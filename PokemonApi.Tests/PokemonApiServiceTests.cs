using Microsoft.Extensions.Caching.Memory;
using PokemonApi.Clients;
using PokemonApi.Exceptions;
using PokemonApi.Models;
using PokemonApi.Services;

namespace PokemonApi.Tests;

public class PokemonApiServiceTests
{
    [Fact]
    public async Task GetPokemonAsync_MapsFallbackSprite_AndUsesCache()
    {
        var client = new FakePokeApiClient
        {
            PokemonToReturn = new PokeApiPokemon
            {
                Id = 25,
                Name = "pikachu",
                Sprites = new PokeApiSprites { FrontDefault = null },
                Types = [new PokeApiTypeSlot { Type = new PokeApiNamedResource { Name = "electric" } }],
                Abilities = [new PokeApiAbilitySlot { Ability = new PokeApiNamedResource { Name = "static" } }],
                Stats = [new PokeApiStatSlot { BaseStat = 55, Stat = new PokeApiNamedResource { Name = "speed" } }]
            }
        };

        var service = CreateService(client);

        var first = await service.GetPokemonAsync(" Pikachu ", CancellationToken.None);
        var second = await service.GetPokemonAsync("pikachu", CancellationToken.None);

        Assert.NotNull(first);
        Assert.NotNull(second);
        Assert.Equal(25, first.Id);
        Assert.Equal("pikachu", first.Name);
        Assert.Equal(new[] { "electric" }, first.Types);
        Assert.Equal(new[] { "static" }, first.Abilities);
        Assert.Single(first.Stats);
        Assert.Equal("speed", first.Stats[0].Name);
        Assert.Equal(55, first.Stats[0].Value);
        Assert.Equal("https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/25.png", first.SpriteUrl);
        Assert.Equal(first, second);
        Assert.Equal(1, client.GetPokemonCallCount);
    }

    [Fact]
    public async Task GetPokemonPageAsync_MapsPageData_AndCachesByPageAndSize()
    {
        var client = new FakePokeApiClient
        {
            PageToReturn = new PokeApiPokemonListResponse
            {
                Count = 45,
                Results =
                [
                    new PokeApiNamedResource { Name = "bulbasaur", Url = "https://pokeapi.co/api/v2/pokemon/1/" },
                    new PokeApiNamedResource { Name = "ivysaur", Url = "https://pokeapi.co/api/v2/pokemon/2/" },
                    new PokeApiNamedResource { Name = "ignored", Url = "not-a-url" }
                ]
            }
        };

        var service = CreateService(client);

        var first = await service.GetPokemonPageAsync(2, 20, CancellationToken.None);
        var second = await service.GetPokemonPageAsync(2, 20, CancellationToken.None);

        Assert.Equal(2, first.Page);
        Assert.Equal(20, first.Size);
        Assert.Equal(45, first.TotalCount);
        Assert.Equal(3, first.TotalPages);
        Assert.Equal(2, first.Items.Count);
        Assert.Equal(1, first.Items[0].Id);
        Assert.Equal("bulbasaur", first.Items[0].Name);
        Assert.Equal("https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon/1.png", first.Items[0].SpriteUrl);
        Assert.Equal(2, first.Items[1].Id);
        Assert.Equal(1, client.GetPokemonPageCallCount);

        Assert.Equal(first, second);
    }

    [Fact]
    public async Task GetPokemonPageAsync_ThrowsWhenRequestedPageIsOutOfRange()
    {
        var client = new FakePokeApiClient
        {
            PageToReturn = new PokeApiPokemonListResponse
            {
                Count = 10,
                Results = [new PokeApiNamedResource { Name = "bulbasaur", Url = "https://pokeapi.co/api/v2/pokemon/1/" }]
            }
        };

        var service = CreateService(client);

        var ex = await Assert.ThrowsAsync<UpstreamServiceException>(() => service.GetPokemonPageAsync(2, 20, CancellationToken.None));
        Assert.Contains("out of range", ex.Message, StringComparison.OrdinalIgnoreCase);
    }

    [Fact]
    public async Task SearchPokemonAsync_FiltersTheCachedCatalogByNameOrId_AndPaginatesMatches()
    {
        var client = new FakePokeApiClient
        {
            CatalogToReturn =
            [
                new PokeApiNamedResource { Name = "pikachu", Url = "https://pokeapi.co/api/v2/pokemon/25/" },
                new PokeApiNamedResource { Name = "pidgey", Url = "https://pokeapi.co/api/v2/pokemon/16/" },
                new PokeApiNamedResource { Name = "bulbasaur", Url = "https://pokeapi.co/api/v2/pokemon/1/" }
            ]
        };
        var service = CreateService(client);

        var firstPage = await service.SearchPokemonAsync("pi", 1, 1, CancellationToken.None);
        var secondPage = await service.SearchPokemonAsync("pi", 2, 1, CancellationToken.None);
        var byId = await service.SearchPokemonAsync("25", 1, 20, CancellationToken.None);

        Assert.Equal(2, firstPage.TotalCount);
        Assert.Equal(2, firstPage.TotalPages);
        Assert.Equal("pikachu", firstPage.Items[0].Name);
        Assert.Equal("pidgey", secondPage.Items[0].Name);
        Assert.Single(byId.Items);
        Assert.Equal(25, byId.Items[0].Id);
        Assert.Equal(2, client.GetPokemonPageCallCount);
    }

    [Fact]
    public async Task SearchPokemonAsync_MatchesHyphenatedNamesWhenTheQueryUsesSpaces()
    {
        var client = new FakePokeApiClient
        {
            CatalogToReturn =
            [
                new PokeApiNamedResource { Name = "mr-mime", Url = "https://pokeapi.co/api/v2/pokemon/122/" }
            ]
        };
        var service = CreateService(client);

        var result = await service.SearchPokemonAsync("Mr Mime", 1, 20, CancellationToken.None);

        Assert.Single(result.Items);
        Assert.Equal(122, result.Items[0].Id);
    }

    [Fact]
    public async Task GetPokemonAsync_ReturnsNull_WithoutCallingClient_ForBlankInput()
    {
        var client = new FakePokeApiClient();
        var service = CreateService(client);

        var result = await service.GetPokemonAsync("   ", CancellationToken.None);

        Assert.Null(result);
        Assert.Equal(0, client.GetPokemonCallCount);
    }

    [Fact]
    public async Task GetPokemonAsync_DoesNotCacheNotFoundResults()
    {
        var client = new FakePokeApiClient { PokemonToReturn = null };
        var service = CreateService(client);

        var first = await service.GetPokemonAsync("missingno", CancellationToken.None);
        var second = await service.GetPokemonAsync("missingno", CancellationToken.None);

        Assert.Null(first);
        Assert.Null(second);
        Assert.Equal(2, client.GetPokemonCallCount);
    }

    [Fact]
    public async Task GetPokemonAsync_UsesCustomFallbackSpriteBaseUrl_FromOptions()
    {
        var client = new FakePokeApiClient
        {
            PokemonToReturn = new PokeApiPokemon
            {
                Id = 7,
                Name = "squirtle",
                Sprites = new PokeApiSprites { FrontDefault = null },
                Types = [],
                Abilities = [],
                Stats = []
            }
        };

        var options = Microsoft.Extensions.Options.Options.Create(new PokemonApi.Configuration.PokeApiOptions
        {
            FallbackSpriteBaseUrl = "https://custom-sprites.example.com"
        });
        var cache = new MemoryCache(new MemoryCacheOptions());
        var service = new PokemonService(client, cache, options);

        var result = await service.GetPokemonAsync("squirtle", CancellationToken.None);

        Assert.NotNull(result);
        Assert.Equal("https://custom-sprites.example.com/7.png", result.SpriteUrl);
    }

    private static PokemonService CreateService(IPokeApiClient client)
    {
        var cache = new MemoryCache(new MemoryCacheOptions());
        return new PokemonService(client, cache);
    }

    private sealed class FakePokeApiClient : IPokeApiClient
    {
        public PokeApiPokemon? PokemonToReturn { get; init; }
        public PokeApiPokemonListResponse PageToReturn { get; init; } = new();
        public List<PokeApiNamedResource>? CatalogToReturn { get; init; }
        public int GetPokemonCallCount { get; private set; }
        public int GetPokemonPageCallCount { get; private set; }

        public Task<PokeApiPokemon?> GetPokemonAsync(string nameOrId, CancellationToken cancellationToken)
        {
            GetPokemonCallCount++;
            return Task.FromResult(PokemonToReturn);
        }

        public Task<PokeApiPokemonListResponse> GetPokemonPageAsync(int offset, int limit, CancellationToken cancellationToken)
        {
            GetPokemonPageCallCount++;
            if (CatalogToReturn is not null)
            {
                return Task.FromResult(new PokeApiPokemonListResponse
                {
                    Count = CatalogToReturn.Count,
                    Results = CatalogToReturn.Skip(offset).Take(limit).ToList()
                });
            }

            return Task.FromResult(PageToReturn);
        }
    }
}

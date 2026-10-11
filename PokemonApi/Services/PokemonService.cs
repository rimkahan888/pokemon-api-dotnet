using Microsoft.Extensions.Caching.Memory;
using PokemonApi.Clients;
using PokemonApi.Exceptions;
using PokemonApi.Models;

namespace PokemonApi.Services;

public class PokemonService(IPokeApiClient pokeApiClient, IMemoryCache cache) : IPokemonService
{
    private static readonly TimeSpan DetailCacheDuration = TimeSpan.FromMinutes(10);
    private static readonly TimeSpan ListCacheDuration = TimeSpan.FromMinutes(5);
    private const string FallbackSpriteBase = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";

    public async Task<PokemonDetailDto?> GetPokemonAsync(string nameOrId, CancellationToken cancellationToken)
    {
        var normalized = nameOrId.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(normalized))
        {
            return null;
        }

        var cacheKey = $"pokemon-detail:{normalized}";

        if (cache.TryGetValue<PokemonDetailDto>(cacheKey, out var cached))
        {
            return cached;
        }

        var pokemon = await pokeApiClient.GetPokemonAsync(normalized, cancellationToken);

        if (pokemon is null)
        {
            return null;
        }

        var dto = MapDetail(pokemon);
        cache.Set(cacheKey, dto, DetailCacheDuration);
        return dto;
    }

    public async Task<PokemonPageDto> GetPokemonPageAsync(int page, int size, CancellationToken cancellationToken)
    {
        var cacheKey = $"pokemon-page:{page}:{size}";

        if (cache.TryGetValue<PokemonPageDto>(cacheKey, out var cached))
        {
            return cached;
        }

        var offset = (page - 1) * size;
        var list = await pokeApiClient.GetPokemonPageAsync(offset, size, cancellationToken);

        if (list.Count <= offset && list.Count > 0)
        {
            throw new UpstreamServiceException("Requested page is out of range.");
        }

        var items = list.Results
            .Select(MapSummary)
            .Where(static item => item is not null)
            .Cast<PokemonSummaryDto>()
            .ToList();

        var dto = new PokemonPageDto(
            page,
            size,
            list.Count,
            (int)Math.Ceiling(list.Count / (double)size),
            items);

        cache.Set(cacheKey, dto, ListCacheDuration);
        return dto;
    }

    private static PokemonDetailDto MapDetail(PokeApiPokemon pokemon)
    {
        var sprite = string.IsNullOrWhiteSpace(pokemon.Sprites.FrontDefault)
            ? $"{FallbackSpriteBase}/{pokemon.Id}.png"
            : pokemon.Sprites.FrontDefault;

        return new PokemonDetailDto(
            pokemon.Id,
            pokemon.Name,
            pokemon.Types.Select(t => t.Type.Name).ToList(),
            pokemon.Abilities.Select(a => a.Ability.Name).ToList(),
            pokemon.Stats.Select(s => new PokemonStatDto(s.Stat.Name, s.BaseStat)).ToList(),
            sprite);
    }

    private static PokemonSummaryDto? MapSummary(PokeApiNamedResource resource)
    {
        if (!TryExtractPokemonId(resource.Url, out var id))
        {
            return null;
        }

        return new PokemonSummaryDto(id, resource.Name, $"{FallbackSpriteBase}/{id}.png");
    }

    private static bool TryExtractPokemonId(string resourceUrl, out int id)
    {
        id = 0;

        if (!Uri.TryCreate(resourceUrl, UriKind.Absolute, out var uri))
        {
            return false;
        }

        var lastSegment = uri.Segments.LastOrDefault()?.Trim('/');
        return int.TryParse(lastSegment, out id);
    }
}

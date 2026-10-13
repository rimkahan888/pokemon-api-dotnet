using Microsoft.Extensions.Caching.Memory;
using Microsoft.Extensions.Options;
using PokemonApi.Clients;
using PokemonApi.Configuration;
using PokemonApi.Exceptions;
using PokemonApi.Models;

namespace PokemonApi.Services;

public class PokemonService(IPokeApiClient pokeApiClient, IMemoryCache cache, IOptions<PokeApiOptions>? options = null) : IPokemonService
{
    private readonly PokeApiOptions _options = options?.Value ?? new PokeApiOptions();

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
        var detailDuration = TimeSpan.FromMinutes(_options.DetailCacheMinutes > 0 ? _options.DetailCacheMinutes : 10);
        cache.Set(cacheKey, dto, detailDuration);
        return dto;
    }

    public async Task<PokemonPageDto> GetPokemonPageAsync(int page, int size, CancellationToken cancellationToken)
    {
        var cacheKey = $"pokemon-page:{page}:{size}";

        if (cache.TryGetValue<PokemonPageDto>(cacheKey, out var cached) && cached is not null)
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

        var listDuration = TimeSpan.FromMinutes(_options.ListCacheMinutes > 0 ? _options.ListCacheMinutes : 5);
        cache.Set(cacheKey, dto, listDuration);
        return dto;
    }

    private PokemonDetailDto MapDetail(PokeApiPokemon pokemon)
    {
        var fallbackBase = _options.FallbackSpriteBaseUrl.TrimEnd('/');
        var sprite = string.IsNullOrWhiteSpace(pokemon.Sprites.FrontDefault)
            ? $"{fallbackBase}/{pokemon.Id}.png"
            : pokemon.Sprites.FrontDefault;

        return new PokemonDetailDto(
            pokemon.Id,
            pokemon.Name,
            pokemon.Types.Select(t => t.Type.Name).ToList(),
            pokemon.Abilities.Select(a => a.Ability.Name).ToList(),
            pokemon.Stats.Select(s => new PokemonStatDto(s.Stat.Name, s.BaseStat)).ToList(),
            sprite);
    }

    private PokemonSummaryDto? MapSummary(PokeApiNamedResource resource)
    {
        if (!TryExtractPokemonId(resource.Url, out var id))
        {
            return null;
        }

        var fallbackBase = _options.FallbackSpriteBaseUrl.TrimEnd('/');
        return new PokemonSummaryDto(id, resource.Name, $"{fallbackBase}/{id}.png");
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

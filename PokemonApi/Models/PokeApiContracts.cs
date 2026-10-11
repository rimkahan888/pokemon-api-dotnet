using System.Text.Json.Serialization;

namespace PokemonApi.Models;

public sealed class PokeApiPokemon
{
    [JsonPropertyName("id")]
    public int Id { get; init; }

    [JsonPropertyName("name")]
    public string Name { get; init; } = string.Empty;

    [JsonPropertyName("types")]
    public List<PokeApiTypeSlot> Types { get; init; } = [];

    [JsonPropertyName("abilities")]
    public List<PokeApiAbilitySlot> Abilities { get; init; } = [];

    [JsonPropertyName("stats")]
    public List<PokeApiStatSlot> Stats { get; init; } = [];

    [JsonPropertyName("sprites")]
    public PokeApiSprites Sprites { get; init; } = new();
}

public sealed class PokeApiSprites
{
    [JsonPropertyName("front_default")]
    public string? FrontDefault { get; init; }
}

public sealed class PokeApiTypeSlot
{
    [JsonPropertyName("type")]
    public PokeApiNamedResource Type { get; init; } = new();
}

public sealed class PokeApiAbilitySlot
{
    [JsonPropertyName("ability")]
    public PokeApiNamedResource Ability { get; init; } = new();
}

public sealed class PokeApiStatSlot
{
    [JsonPropertyName("base_stat")]
    public int BaseStat { get; init; }

    [JsonPropertyName("stat")]
    public PokeApiNamedResource Stat { get; init; } = new();
}

public sealed class PokeApiNamedResource
{
    [JsonPropertyName("name")]
    public string Name { get; init; } = string.Empty;

    [JsonPropertyName("url")]
    public string Url { get; init; } = string.Empty;
}

public sealed class PokeApiPokemonListResponse
{
    [JsonPropertyName("count")]
    public int Count { get; init; }

    [JsonPropertyName("results")]
    public List<PokeApiNamedResource> Results { get; init; } = [];
}

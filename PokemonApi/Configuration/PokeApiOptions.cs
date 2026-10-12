namespace PokemonApi.Configuration;

public class PokeApiOptions
{
    public const string SectionName = "PokeApi";

    public string BaseUrl { get; set; } = "https://pokeapi.co/api/v2/";

    public int ClientTimeoutSeconds { get; set; } = 10;

    public int RequestTimeoutSeconds { get; set; } = 5;

    public int RetryAttempts { get; set; } = 3;

    public int RetryBackoffMilliseconds { get; set; } = 200;

    public int DetailCacheMinutes { get; set; } = 10;

    public int ListCacheMinutes { get; set; } = 5;

    public string FallbackSpriteBaseUrl { get; set; } = "https://raw.githubusercontent.com/PokeAPI/sprites/master/sprites/pokemon";
}

namespace PokemonApi.Models;

public record PokemonDetailDto(
    int Id,
    string Name,
    IReadOnlyList<string> Types,
    IReadOnlyList<string> Abilities,
    IReadOnlyList<PokemonStatDto> Stats,
    string SpriteUrl);

public record PokemonStatDto(string Name, int Value);

public record PokemonSummaryDto(int Id, string Name, string SpriteUrl);

public record PokemonPageDto(
    int Page,
    int Size,
    int TotalCount,
    int TotalPages,
    IReadOnlyList<PokemonSummaryDto> Items);

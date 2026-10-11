using PokemonApi.Models;

namespace PokemonApi.Services;

public interface IPokemonService
{
    Task<PokemonDetailDto?> GetPokemonAsync(string nameOrId, CancellationToken cancellationToken);
    Task<PokemonPageDto> GetPokemonPageAsync(int page, int size, CancellationToken cancellationToken);
}

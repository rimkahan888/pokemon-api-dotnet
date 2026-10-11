using PokemonApi.Models;

namespace PokemonApi.Clients;

public interface IPokeApiClient
{
    Task<PokeApiPokemon?> GetPokemonAsync(string nameOrId, CancellationToken cancellationToken);
    Task<PokeApiPokemonListResponse> GetPokemonPageAsync(int offset, int limit, CancellationToken cancellationToken);
}

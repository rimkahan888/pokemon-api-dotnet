using System.Net;
using System.Text.Json;
using PokemonApi.Exceptions;
using PokemonApi.Models;

namespace PokemonApi.Clients;

public class PokeApiClient(HttpClient httpClient) : IPokeApiClient
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);

    public async Task<PokeApiPokemon?> GetPokemonAsync(string nameOrId, CancellationToken cancellationToken)
    {
        var normalized = nameOrId.Trim().ToLowerInvariant();

        if (string.IsNullOrWhiteSpace(normalized))
        {
            return null;
        }

        return await SendWithRetryAsync<PokeApiPokemon>($"pokemon/{Uri.EscapeDataString(normalized)}", cancellationToken);
    }

    public async Task<PokeApiPokemonListResponse> GetPokemonPageAsync(int offset, int limit, CancellationToken cancellationToken)
    {
        return await SendWithRetryAsync<PokeApiPokemonListResponse>($"pokemon?offset={offset}&limit={limit}", cancellationToken)
            ?? throw new UpstreamServiceException("Empty response received from PokéAPI.");
    }

    private async Task<T?> SendWithRetryAsync<T>(string relativeUrl, CancellationToken cancellationToken)
    {
        Exception? lastError = null;

        for (var attempt = 1; attempt <= 3; attempt++)
        {
            try
            {
                using var timeoutCts = new CancellationTokenSource(TimeSpan.FromSeconds(5));
                using var linkedCts = CancellationTokenSource.CreateLinkedTokenSource(cancellationToken, timeoutCts.Token);

                var response = await httpClient.GetAsync(relativeUrl, linkedCts.Token);

                if (response.StatusCode == HttpStatusCode.NotFound)
                {
                    return default;
                }

                if ((int)response.StatusCode >= 500)
                {
                    throw new UpstreamServiceException($"PokéAPI returned status code {(int)response.StatusCode}.");
                }

                response.EnsureSuccessStatusCode();

                await using var stream = await response.Content.ReadAsStreamAsync(linkedCts.Token);
                var payload = await JsonSerializer.DeserializeAsync<T>(stream, SerializerOptions, linkedCts.Token);

                if (payload is null)
                {
                    throw new UpstreamServiceException("PokéAPI returned an invalid payload.");
                }

                return payload;
            }
            catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException or UpstreamServiceException)
            {
                if (cancellationToken.IsCancellationRequested)
                {
                    throw;
                }

                lastError = ex;

                if (attempt < 3)
                {
                    await Task.Delay(TimeSpan.FromMilliseconds(200 * attempt), cancellationToken);
                }
            }
        }

        throw new UpstreamServiceException("Unable to fetch data from PokéAPI after retries.", lastError);
    }
}

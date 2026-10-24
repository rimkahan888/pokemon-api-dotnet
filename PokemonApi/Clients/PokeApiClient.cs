using System.Net;
using System.Text.Json;
using Microsoft.Extensions.Options;
using PokemonApi.Configuration;
using PokemonApi.Normalization;
using PokemonApi.Exceptions;
using PokemonApi.Models;

namespace PokemonApi.Clients;

public class PokeApiClient(HttpClient httpClient, IOptions<PokeApiOptions>? options = null) : IPokeApiClient
{
    private static readonly JsonSerializerOptions SerializerOptions = new(JsonSerializerDefaults.Web);
    private readonly PokeApiOptions _options = options?.Value ?? new PokeApiOptions();

    public async Task<PokeApiPokemon?> GetPokemonAsync(string nameOrId, CancellationToken cancellationToken)
    {
        var normalized = PokemonNameNormalizer.Normalize(nameOrId);

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
        var retryAttempts = Math.Max(1, _options.RetryAttempts);
        var timeout = TimeSpan.FromSeconds(_options.RequestTimeoutSeconds > 0 ? _options.RequestTimeoutSeconds : 5);
        var backoffMs = _options.RetryBackoffMilliseconds > 0 ? _options.RetryBackoffMilliseconds : 200;

        if (!httpClient.DefaultRequestHeaders.UserAgent.Any())
        {
            httpClient.DefaultRequestHeaders.UserAgent.ParseAdd(
                "PokemonApi/1.0 (+https://github.com/rimkahan888/pokemon-api-dotnet)");
        }

        for (var attempt = 1; attempt <= retryAttempts; attempt++)
        {
            try
            {
                using var timeoutCts = new CancellationTokenSource(timeout);
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

                if (attempt < retryAttempts)
                {
                    await Task.Delay(TimeSpan.FromMilliseconds(backoffMs * attempt), cancellationToken);
                }
            }
        }

        throw new UpstreamServiceException("Unable to fetch data from PokéAPI after retries.", lastError);
    }
}

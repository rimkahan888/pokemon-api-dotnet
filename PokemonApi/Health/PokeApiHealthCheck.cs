using Microsoft.Extensions.Diagnostics.HealthChecks;

namespace PokemonApi.Health;

public sealed class PokeApiHealthCheck(HttpClient httpClient) : IHealthCheck
{
    public async Task<HealthCheckResult> CheckHealthAsync(
        HealthCheckContext context,
        CancellationToken cancellationToken = default)
    {
        try
        {
            using var response = await httpClient.GetAsync("pokemon?limit=1", cancellationToken);
            return response.IsSuccessStatusCode
                ? HealthCheckResult.Healthy("PokéAPI responded successfully.")
                : HealthCheckResult.Unhealthy($"PokéAPI returned status code {(int)response.StatusCode}.");
        }
        catch (Exception ex) when (ex is HttpRequestException or TaskCanceledException)
        {
            return HealthCheckResult.Unhealthy("PokéAPI could not be reached.", ex);
        }
    }
}

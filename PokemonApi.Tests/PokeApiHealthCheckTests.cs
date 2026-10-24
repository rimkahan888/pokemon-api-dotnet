using System.Net;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using PokemonApi.Health;

namespace PokemonApi.Tests;

public class PokeApiHealthCheckTests
{
    [Fact]
    public async Task CheckHealthAsync_IsHealthyWhenPokéApiReturnsSuccess()
    {
        using var httpClient = new HttpClient(new StubHandler(_ => new HttpResponseMessage(HttpStatusCode.OK)))
        {
            BaseAddress = new Uri("https://pokeapi.co/api/v2/")
        };

        var result = await new PokeApiHealthCheck(httpClient).CheckHealthAsync(new HealthCheckContext());

        Assert.Equal(HealthStatus.Healthy, result.Status);
    }

    [Fact]
    public async Task CheckHealthAsync_IsUnhealthyWhenTheCallFails()
    {
        using var httpClient = new HttpClient(new StubHandler(_ => throw new HttpRequestException("down")))
        {
            BaseAddress = new Uri("https://pokeapi.co/api/v2/")
        };

        var result = await new PokeApiHealthCheck(httpClient).CheckHealthAsync(new HealthCheckContext());

        Assert.Equal(HealthStatus.Unhealthy, result.Status);
    }

    private sealed class StubHandler(Func<HttpRequestMessage, HttpResponseMessage> send) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(HttpRequestMessage request, CancellationToken cancellationToken) =>
            Task.FromResult(send(request));
    }
}

using System.Net;
using System.Text;
using PokemonApi.Clients;
using PokemonApi.Exceptions;

namespace PokemonApi.Tests;

public class PokeApiClientTests
{
    [Fact]
    public async Task GetPokemonAsync_NormalizesNameAndDeserializesResponse()
    {
        Uri? requestedUri = null;
        using var httpClient = new HttpClient(new TestHttpMessageHandler((request, _) =>
        {
            requestedUri = request.RequestUri;
            return Task.FromResult(JsonResponse(
                """{"id":25,"name":"mr-mime","sprites":{"front_default":"sprite.png"}}"""));
        }))
        {
            BaseAddress = new Uri("https://pokeapi.co/api/v2/")
        };
        var client = new PokeApiClient(httpClient);

        var result = await client.GetPokemonAsync(" Mr Mime ", CancellationToken.None);

        Assert.Equal("https://pokeapi.co/api/v2/pokemon/mr%20mime", requestedUri?.AbsoluteUri);
        Assert.NotNull(result);
        Assert.Equal(25, result.Id);
        Assert.Equal("mr-mime", result.Name);
        Assert.Equal("sprite.png", result.Sprites.FrontDefault);
    }

    [Fact]
    public async Task GetPokemonAsync_ReturnsNullWithoutRetryingWhenNotFound()
    {
        var requestCount = 0;
        using var httpClient = new HttpClient(new TestHttpMessageHandler((_, _) =>
        {
            requestCount++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.NotFound));
        }))
        {
            BaseAddress = new Uri("https://pokeapi.co/api/v2/")
        };
        var client = new PokeApiClient(httpClient);

        var result = await client.GetPokemonAsync("missingno", CancellationToken.None);

        Assert.Null(result);
        Assert.Equal(1, requestCount);
    }

    [Fact]
    public async Task GetPokemonPageAsync_RetriesServerErrorAndReturnsResponse()
    {
        var requestCount = 0;
        Uri? requestedUri = null;
        using var httpClient = new HttpClient(new TestHttpMessageHandler((request, _) =>
        {
            requestCount++;
            requestedUri = request.RequestUri;
            var response = requestCount == 1
                ? new HttpResponseMessage(HttpStatusCode.ServiceUnavailable)
                : JsonResponse("""{"count":1,"results":[]}""");
            return Task.FromResult(response);
        }))
        {
            BaseAddress = new Uri("https://pokeapi.co/api/v2/")
        };
        var client = new PokeApiClient(httpClient);

        var result = await client.GetPokemonPageAsync(20, 20, CancellationToken.None);

        Assert.Equal("https://pokeapi.co/api/v2/pokemon?offset=20&limit=20", requestedUri?.AbsoluteUri);
        Assert.Equal(2, requestCount);
        Assert.Equal(1, result.Count);
    }

    [Fact]
    public async Task GetPokemonPageAsync_RespectsConfiguredRetryAttempts()
    {
        var requestCount = 0;
        using var httpClient = new HttpClient(new TestHttpMessageHandler((_, _) =>
        {
            requestCount++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.InternalServerError));
        }))
        {
            BaseAddress = new Uri("https://pokeapi.co/api/v2/")
        };
        var options = Microsoft.Extensions.Options.Options.Create(new PokemonApi.Configuration.PokeApiOptions
        {
            RetryAttempts = 1,
            RetryBackoffMilliseconds = 10
        });
        var client = new PokeApiClient(httpClient, options);

        await Assert.ThrowsAsync<UpstreamServiceException>(() =>
            client.GetPokemonPageAsync(0, 10, CancellationToken.None));

        Assert.Equal(1, requestCount);
    }

    private static HttpResponseMessage JsonResponse(string json) =>
        new(HttpStatusCode.OK)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };

    private sealed class TestHttpMessageHandler(
        Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> sendAsync) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            sendAsync(request, cancellationToken);
    }
}

using System.Net;
using System.Text;
using Microsoft.Extensions.Logging;
using PokemonApi.Clients;
using PokemonApi.Exceptions;

namespace PokemonApi.Tests;

public class PokeApiClientTests
{
    [Fact]
    public async Task GetPokemonAsync_NormalizesNameAndDeserializesResponse()
    {
        Uri? requestedUri = null;
        string? userAgent = null;
        using var httpClient = new HttpClient(new TestHttpMessageHandler((request, _) =>
        {
            requestedUri = request.RequestUri;
            userAgent = request.Headers.UserAgent.ToString();
            return Task.FromResult(JsonResponse(
                """{"id":25,"name":"mr-mime","sprites":{"front_default":"sprite.png"}}"""));
        }))
        {
            BaseAddress = new Uri("https://pokeapi.co/api/v2/")
        };
        var client = new PokeApiClient(httpClient);

        var result = await client.GetPokemonAsync(" Mr Mime ", CancellationToken.None);

        Assert.Equal("https://pokeapi.co/api/v2/pokemon/mr%20mime", requestedUri?.AbsoluteUri);
        Assert.Equal("PokemonApi/1.0 (+https://github.com/rimkahan888/pokemon-api-dotnet)", userAgent);
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
        var logger = new CollectingLogger<PokeApiClient>();
        var client = new PokeApiClient(httpClient, logger: logger);

        var result = await client.GetPokemonPageAsync(20, 20, CancellationToken.None);

        Assert.Equal("https://pokeapi.co/api/v2/pokemon?offset=20&limit=20", requestedUri?.AbsoluteUri);
        Assert.Equal(2, requestCount);
        Assert.Equal(1, result.Count);
        Assert.Equal(1, logger.WarningCount);
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

    [Fact]
    public async Task GetPokemonAsync_DoesNotRetryAClientError()
    {
        var requestCount = 0;
        using var httpClient = new HttpClient(new TestHttpMessageHandler((_, _) =>
        {
            requestCount++;
            return Task.FromResult(new HttpResponseMessage(HttpStatusCode.BadRequest));
        }))
        {
            BaseAddress = new Uri("https://pokeapi.co/api/v2/")
        };
        var client = new PokeApiClient(httpClient);

        var ex = await Assert.ThrowsAsync<UpstreamServiceException>(() =>
            client.GetPokemonAsync("pikachu", CancellationToken.None));

        Assert.Equal(1, requestCount);
        Assert.False(ex.IsTransient);
        Assert.Contains("400", ex.Message, StringComparison.Ordinal);
    }

    [Fact]
    public async Task GetPokemonAsync_WrapsInvalidJsonAfterTheConfiguredAttempts()
    {
        var requestCount = 0;
        using var httpClient = new HttpClient(new TestHttpMessageHandler((_, _) =>
        {
            requestCount++;
            return Task.FromResult(JsonResponse("not-json"));
        }))
        {
            BaseAddress = new Uri("https://pokeapi.co/api/v2/")
        };
        var options = Microsoft.Extensions.Options.Options.Create(new PokemonApi.Configuration.PokeApiOptions
        {
            RetryAttempts = 2,
            RetryBackoffMilliseconds = 1
        });
        var client = new PokeApiClient(httpClient, options);

        await Assert.ThrowsAsync<UpstreamServiceException>(() =>
            client.GetPokemonAsync("pikachu", CancellationToken.None));

        Assert.Equal(2, requestCount);
    }

    private static HttpResponseMessage JsonResponse(string json) =>
        new(HttpStatusCode.OK)
        {
            Content = new StringContent(json, Encoding.UTF8, "application/json")
        };

    private sealed class CollectingLogger<T> : ILogger<T>
    {
        public int WarningCount { get; private set; }

        public IDisposable BeginScope<TState>(TState state) where TState : notnull => NullScope.Instance;

        public bool IsEnabled(LogLevel logLevel) => true;

        public void Log<TState>(
            LogLevel logLevel,
            EventId eventId,
            TState state,
            Exception? exception,
            Func<TState, Exception?, string> formatter)
        {
            if (logLevel == LogLevel.Warning)
            {
                WarningCount++;
            }
        }

        private sealed class NullScope : IDisposable
        {
            public static readonly NullScope Instance = new();
            public void Dispose()
            {
            }
        }
    }

    private sealed class TestHttpMessageHandler(
        Func<HttpRequestMessage, CancellationToken, Task<HttpResponseMessage>> sendAsync) : HttpMessageHandler
    {
        protected override Task<HttpResponseMessage> SendAsync(
            HttpRequestMessage request,
            CancellationToken cancellationToken) =>
            sendAsync(request, cancellationToken);
    }
}

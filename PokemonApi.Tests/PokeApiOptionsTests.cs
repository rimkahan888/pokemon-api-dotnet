using Microsoft.Extensions.Configuration;
using PokemonApi.Configuration;

namespace PokemonApi.Tests;

public class PokeApiOptionsTests
{
    [Fact]
    public void Configuration_BindsToPokeApiOptions_Correctly()
    {
        var inMemorySettings = new Dictionary<string, string?>
        {
            ["PokeApi:BaseUrl"] = "https://test.pokeapi.co/api/v2/",
            ["PokeApi:ClientTimeoutSeconds"] = "15",
            ["PokeApi:RequestTimeoutSeconds"] = "7",
            ["PokeApi:RetryAttempts"] = "4",
            ["PokeApi:RetryBackoffMilliseconds"] = "150",
            ["PokeApi:DetailCacheMinutes"] = "20",
            ["PokeApi:ListCacheMinutes"] = "8",
            ["PokeApi:FallbackSpriteBaseUrl"] = "https://custom.sprites.org"
        };

        var configuration = new ConfigurationBuilder()
            .AddInMemoryCollection(inMemorySettings)
            .Build();

        var options = new PokeApiOptions();
        configuration.GetSection(PokeApiOptions.SectionName).Bind(options);

        Assert.Equal("https://test.pokeapi.co/api/v2/", options.BaseUrl);
        Assert.Equal(15, options.ClientTimeoutSeconds);
        Assert.Equal(7, options.RequestTimeoutSeconds);
        Assert.Equal(4, options.RetryAttempts);
        Assert.Equal(150, options.RetryBackoffMilliseconds);
        Assert.Equal(20, options.DetailCacheMinutes);
        Assert.Equal(8, options.ListCacheMinutes);
        Assert.Equal("https://custom.sprites.org", options.FallbackSpriteBaseUrl);
    }
}

using PokemonApi.Configuration;

namespace PokemonApi.Tests;

public class FrontendCorsOptionsTests
{
    [Fact]
    public void ResolveOrigins_UsesConfiguredOrigins()
    {
        var options = new FrontendCorsOptions
        {
            AllowedOrigins = ["https://explorer.example"]
        };

        Assert.Equal(["https://explorer.example"], options.ResolveOrigins());
    }

    [Fact]
    public void ResolveOrigins_FallsBackWhenNothingIsConfigured()
    {
        var options = new FrontendCorsOptions { AllowedOrigins = [" ", ""] };

        Assert.Equal(FrontendCorsOptions.DefaultOrigins, options.ResolveOrigins());
    }
}

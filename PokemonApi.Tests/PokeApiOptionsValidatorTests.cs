using PokemonApi.Configuration;

namespace PokemonApi.Tests;

public class PokeApiOptionsValidatorTests
{
    private readonly PokeApiOptionsValidator _validator = new();

    [Fact]
    public void Validate_AcceptsTheDefaultOptions()
    {
        var result = _validator.Validate(null, new PokeApiOptions());

        Assert.True(result.Succeeded);
    }

    [Fact]
    public void Validate_RejectsARelativeBaseUrl_AndARequestTimeoutThatExceedsTheClientTimeout()
    {
        var result = _validator.Validate(null, new PokeApiOptions
        {
            BaseUrl = "/relative",
            ClientTimeoutSeconds = 5,
            RequestTimeoutSeconds = 5
        });

        Assert.True(result.Failed);
        Assert.Contains(result.Failures, failure => failure.Contains("BaseUrl", StringComparison.Ordinal));
        Assert.Contains(result.Failures, failure => failure.Contains("RequestTimeoutSeconds", StringComparison.Ordinal));
    }
}

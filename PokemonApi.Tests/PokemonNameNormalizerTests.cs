using PokemonApi.Normalization;

namespace PokemonApi.Tests;

public class PokemonNameNormalizerTests
{
    [Theory]
    [InlineData(" Mr Mime ", "mr-mime")]
    [InlineData("mr-mime", "mr-mime")]
    [InlineData("farfetch'd", "farfetchd")]
    [InlineData(" 025 ", "25")]
    [InlineData("nidoran-f", "nidoran-f")]
    [InlineData("   ", "")]
    public void Normalize_ProducesAPokeApiSlug(string input, string expected)
    {
        Assert.Equal(expected, PokemonNameNormalizer.Normalize(input));
    }
}

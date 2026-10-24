using Microsoft.Extensions.Options;

namespace PokemonApi.Configuration;

public sealed class PokeApiOptionsValidator : IValidateOptions<PokeApiOptions>
{
    public ValidateOptionsResult Validate(string? name, PokeApiOptions options)
    {
        ArgumentNullException.ThrowIfNull(options);
        var failures = new List<string>();

        if (!IsHttpUrl(options.BaseUrl))
        {
            failures.Add("PokeApi:BaseUrl must be an absolute http or https URL.");
        }

        if (options.ClientTimeoutSeconds is < 1 or > 120)
        {
            failures.Add("PokeApi:ClientTimeoutSeconds must be between 1 and 120.");
        }

        if (options.RequestTimeoutSeconds is < 1 or > 60)
        {
            failures.Add("PokeApi:RequestTimeoutSeconds must be between 1 and 60.");
        }

        if (options.RequestTimeoutSeconds >= options.ClientTimeoutSeconds)
        {
            failures.Add("PokeApi:RequestTimeoutSeconds must be less than ClientTimeoutSeconds.");
        }

        if (options.RetryAttempts is < 1 or > 5)
        {
            failures.Add("PokeApi:RetryAttempts must be between 1 and 5.");
        }

        if (options.RetryBackoffMilliseconds is < 0 or > 10000)
        {
            failures.Add("PokeApi:RetryBackoffMilliseconds must be between 0 and 10000.");
        }

        if (options.DetailCacheMinutes is < 0 or > 1440 || options.ListCacheMinutes is < 0 or > 1440)
        {
            failures.Add("PokeApi cache durations must be between 0 and 1440 minutes.");
        }

        if (!IsHttpUrl(options.FallbackSpriteBaseUrl))
        {
            failures.Add("PokeApi:FallbackSpriteBaseUrl must be an absolute http or https URL.");
        }

        return failures.Count == 0
            ? ValidateOptionsResult.Success
            : ValidateOptionsResult.Fail(failures);
    }

    private static bool IsHttpUrl(string? value) =>
        Uri.TryCreate(value, UriKind.Absolute, out var uri) && uri.Scheme is "http" or "https";
}

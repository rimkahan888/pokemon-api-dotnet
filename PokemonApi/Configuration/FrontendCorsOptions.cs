namespace PokemonApi.Configuration;

public sealed class FrontendCorsOptions
{
    public const string SectionName = "Cors";

    public static readonly string[] DefaultOrigins =
    [
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:4173"
    ];

    public string[] AllowedOrigins { get; set; } = [.. DefaultOrigins];

    public string[] ResolveOrigins()
    {
        var configured = AllowedOrigins
            .Where(static origin => !string.IsNullOrWhiteSpace(origin))
            .Distinct(StringComparer.OrdinalIgnoreCase)
            .ToArray();

        return configured.Length == 0 ? DefaultOrigins : configured;
    }
}

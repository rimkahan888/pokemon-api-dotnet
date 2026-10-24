using Microsoft.Extensions.Options;
using PokemonApi.Clients;
using PokemonApi.Configuration;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using PokemonApi.Health;
using PokemonApi.Http;
using PokemonApi.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi(options =>
{
    options.AddDocumentTransformer((document, _, _) =>
    {
        document.Info.Title = "Pokémon Data Explorer API";
        document.Info.Version = "v1";
        document.Info.Description =
            "Normalized Pokémon list, catalog search, and detail endpoints backed by PokéAPI.";
        return Task.CompletedTask;
    });
});
builder.Services.AddMemoryCache();
builder.Services.AddControllers();

builder.Services.AddHttpClient<PokeApiHealthCheck>((serviceProvider, client) =>
{
    var options = serviceProvider.GetRequiredService<IOptions<PokeApiOptions>>().Value;
    client.BaseAddress = new Uri(options.BaseUrl);
    client.Timeout = TimeSpan.FromSeconds(Math.Clamp(options.RequestTimeoutSeconds, 1, 5));
});

builder.Services.AddHealthChecks()
    .AddCheck("self", () => HealthCheckResult.Healthy(), tags: ["live"])
    .AddCheck<PokeApiHealthCheck>("pokeapi", tags: ["ready"]);

builder.Services.AddSingleton<IValidateOptions<PokeApiOptions>, PokeApiOptionsValidator>();
builder.Services.AddOptions<PokeApiOptions>()
    .Bind(builder.Configuration.GetSection(PokeApiOptions.SectionName))
    .ValidateOnStart();

builder.Services.AddHttpClient<IPokeApiClient, PokeApiClient>((serviceProvider, client) =>
{
    var options = serviceProvider.GetRequiredService<IOptions<PokeApiOptions>>().Value;
    client.BaseAddress = new Uri(options.BaseUrl);
    client.Timeout = TimeSpan.FromSeconds(options.ClientTimeoutSeconds);
});

builder.Services.AddScoped<IPokemonService, PokemonService>();

var allowedOrigins = builder.Configuration.GetSection(FrontendCorsOptions.SectionName)
    .Get<FrontendCorsOptions>()
    ?.ResolveOrigins()
    ?? FrontendCorsOptions.DefaultOrigins;

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.WithOrigins(allowedOrigins).AllowAnyHeader().AllowAnyMethod();
    });
});

var app = builder.Build();

if (app.Environment.IsDevelopment())
{
    app.MapOpenApi();
}

app.UseMiddleware<SecurityHeadersMiddleware>();
app.UseHttpsRedirection();
app.UseCors("Frontend");
app.MapHealthChecks("/health", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("live")
});
app.MapHealthChecks("/health/ready", new HealthCheckOptions
{
    Predicate = check => check.Tags.Contains("ready")
});
app.MapControllers();

app.Run();

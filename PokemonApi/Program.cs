using Microsoft.Extensions.Options;
using PokemonApi.Clients;
using PokemonApi.Configuration;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using PokemonApi.Health;
using PokemonApi.Http;
using PokemonApi.Services;

var builder = WebApplication.CreateBuilder(args);

builder.Services.AddOpenApi();
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

builder.Services.Configure<PokeApiOptions>(
    builder.Configuration.GetSection(PokeApiOptions.SectionName));

builder.Services.AddHttpClient<IPokeApiClient, PokeApiClient>((serviceProvider, client) =>
{
    var options = serviceProvider.GetRequiredService<IOptions<PokeApiOptions>>().Value;
    client.BaseAddress = new Uri(options.BaseUrl);
    client.Timeout = TimeSpan.FromSeconds(options.ClientTimeoutSeconds);
});

builder.Services.AddScoped<IPokemonService, PokemonService>();

builder.Services.AddCors(options =>
{
    options.AddPolicy("Frontend", policy =>
    {
        policy.AllowAnyOrigin().AllowAnyHeader().AllowAnyMethod();
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

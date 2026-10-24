using Microsoft.Extensions.Options;
using PokemonApi.Clients;
using PokemonApi.Configuration;
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

builder.Services.AddHealthChecks();

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

app.UseHttpsRedirection();
app.UseCors("Frontend");
app.MapHealthChecks("/health");
app.MapControllers();

app.Run();

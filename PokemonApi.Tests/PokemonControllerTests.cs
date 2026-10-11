using Microsoft.AspNetCore.Mvc;
using PokemonApi.Controllers;
using PokemonApi.Exceptions;
using PokemonApi.Models;
using PokemonApi.Services;

namespace PokemonApi.Tests;

public class PokemonControllerTests
{
    [Fact]
    public async Task GetPokemon_ReturnsBadRequest_ForInvalidName()
    {
        var controller = new PokemonController(new FakePokemonService());

        var result = await controller.GetPokemon("", CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetPokemon_ReturnsNotFound_WhenServiceReturnsNull()
    {
        var controller = new PokemonController(new FakePokemonService
        {
            GetPokemonAsyncImpl = (_, _) => Task.FromResult<PokemonDetailDto?>(null)
        });

        var result = await controller.GetPokemon("missing", CancellationToken.None);

        Assert.IsType<NotFoundObjectResult>(result);
    }

    [Fact]
    public async Task GetPokemon_ReturnsServiceUnavailable_WhenUpstreamFails()
    {
        var controller = new PokemonController(new FakePokemonService
        {
            GetPokemonAsyncImpl = (_, _) => throw new UpstreamServiceException("upstream failed")
        });

        var result = await controller.GetPokemon("pikachu", CancellationToken.None);

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(503, objectResult.StatusCode);
    }

    [Fact]
    public async Task GetPokemonPage_ReturnsBadRequest_ForInvalidPageOrSize()
    {
        var controller = new PokemonController(new FakePokemonService());

        var badPage = await controller.GetPokemonPage(0, 20, CancellationToken.None);
        var badSize = await controller.GetPokemonPage(1, 101, CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(badPage);
        Assert.IsType<BadRequestObjectResult>(badSize);
    }

    [Fact]
    public async Task GetPokemonPage_ReturnsBadRequest_ForOutOfRangeMessage()
    {
        var controller = new PokemonController(new FakePokemonService
        {
            GetPokemonPageAsyncImpl = (_, _, _) => throw new UpstreamServiceException("Requested page is out of range.")
        });

        var result = await controller.GetPokemonPage(2, 20, CancellationToken.None);

        Assert.IsType<BadRequestObjectResult>(result);
    }

    [Fact]
    public async Task GetPokemonPage_ReturnsServiceUnavailable_ForOtherUpstreamErrors()
    {
        var controller = new PokemonController(new FakePokemonService
        {
            GetPokemonPageAsyncImpl = (_, _, _) => throw new UpstreamServiceException("network")
        });

        var result = await controller.GetPokemonPage(1, 20, CancellationToken.None);

        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(503, objectResult.StatusCode);
    }

    private sealed class FakePokemonService : IPokemonService
    {
        public Func<string, CancellationToken, Task<PokemonDetailDto?>> GetPokemonAsyncImpl { get; init; } =
            (_, _) => Task.FromResult<PokemonDetailDto?>(new PokemonDetailDto(1, "bulbasaur", ["grass"], ["overgrow"], [new PokemonStatDto("hp", 45)], "sprite"));

        public Func<int, int, CancellationToken, Task<PokemonPageDto>> GetPokemonPageAsyncImpl { get; init; } =
            (page, size, _) => Task.FromResult<PokemonPageDto>(new PokemonPageDto(page, size, 1, 1, [new PokemonSummaryDto(1, "bulbasaur", "sprite")]));

        public Task<PokemonDetailDto?> GetPokemonAsync(string nameOrId, CancellationToken cancellationToken) =>
            GetPokemonAsyncImpl(nameOrId, cancellationToken);

        public Task<PokemonPageDto> GetPokemonPageAsync(int page, int size, CancellationToken cancellationToken) =>
            GetPokemonPageAsyncImpl(page, size, cancellationToken);
    }
}

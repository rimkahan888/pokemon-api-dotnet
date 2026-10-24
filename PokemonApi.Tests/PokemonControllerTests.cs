using Microsoft.AspNetCore.Http;
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

        AssertProblem(result, StatusCodes.Status400BadRequest, "nameOrId must be between 1 and 50 characters.");
    }

    [Fact]
    public async Task GetPokemon_ReturnsNotFound_WhenServiceReturnsNull()
    {
        var controller = new PokemonController(new FakePokemonService
        {
            GetPokemonAsyncImpl = (_, _) => Task.FromResult<PokemonDetailDto?>(null)
        });

        var result = await controller.GetPokemon("missing", CancellationToken.None);

        AssertProblem(result, StatusCodes.Status404NotFound, "Pokemon not found.");
    }

    [Fact]
    public async Task GetPokemon_ReturnsOk_WithServiceDto()
    {
        var expected = new PokemonDetailDto(25, "pikachu", ["electric"], ["static"], [], "sprite");
        var controller = new PokemonController(new FakePokemonService
        {
            GetPokemonAsyncImpl = (_, _) => Task.FromResult<PokemonDetailDto?>(expected)
        });

        var result = await controller.GetPokemon("pikachu", CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Same(expected, okResult.Value);
    }

    [Fact]
    public async Task GetPokemon_ReturnsServiceUnavailable_WhenUpstreamFails()
    {
        var controller = new PokemonController(new FakePokemonService
        {
            GetPokemonAsyncImpl = (_, _) => throw new UpstreamServiceException("upstream failed")
        });

        var result = await controller.GetPokemon("pikachu", CancellationToken.None);

        AssertProblem(result, StatusCodes.Status503ServiceUnavailable, "PokéAPI is temporarily unavailable.");
    }

    [Fact]
    public async Task GetPokemonPage_ReturnsBadRequest_ForInvalidPageOrSize()
    {
        var controller = new PokemonController(new FakePokemonService());

        var badPage = await controller.GetPokemonPage(0, 20, CancellationToken.None);
        var badSize = await controller.GetPokemonPage(1, 101, CancellationToken.None);

        AssertProblem(badPage, StatusCodes.Status400BadRequest, "Page must be greater than or equal to 1.");
        AssertProblem(badSize, StatusCodes.Status400BadRequest, "Size must be between 1 and 100.");
    }

    [Fact]
    public async Task GetPokemonPage_ReturnsBadRequest_ForLongSearch()
    {
        var controller = new PokemonController(new FakePokemonService());

        var result = await controller.GetPokemonPage(1, 20, CancellationToken.None, new string('a', 101));

        AssertProblem(result, StatusCodes.Status400BadRequest, "Search must be 100 characters or fewer.");
    }

    [Fact]
    public async Task GetPokemonPage_UsesCatalogSearch_WhenSearchIsProvided()
    {
        var expected = new PokemonPageDto(1, 20, 1, 1, [new PokemonSummaryDto(25, "pikachu", "sprite")]);
        var controller = new PokemonController(new FakePokemonService
        {
            SearchPokemonAsyncImpl = (query, page, size, _) =>
            {
                Assert.Equal("pika", query);
                Assert.Equal(1, page);
                Assert.Equal(20, size);
                return Task.FromResult(expected);
            }
        });

        var result = await controller.GetPokemonPage(1, 20, CancellationToken.None, "pika");

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Same(expected, okResult.Value);
    }

    [Fact]
    public async Task GetPokemonPage_ReturnsOk_WithServiceDto()
    {
        var expected = new PokemonPageDto(2, 10, 20, 2, [new PokemonSummaryDto(25, "pikachu", "sprite")]);
        var controller = new PokemonController(new FakePokemonService
        {
            GetPokemonPageAsyncImpl = (_, _, _) => Task.FromResult(expected)
        });

        var result = await controller.GetPokemonPage(2, 10, CancellationToken.None);

        var okResult = Assert.IsType<OkObjectResult>(result);
        Assert.Same(expected, okResult.Value);
    }

    [Fact]
    public async Task GetPokemonPage_ReturnsBadRequest_ForOutOfRangeMessage()
    {
        var controller = new PokemonController(new FakePokemonService
        {
            GetPokemonPageAsyncImpl = (_, _, _) => throw new UpstreamServiceException("Requested page is out of range.")
        });

        var result = await controller.GetPokemonPage(2, 20, CancellationToken.None);

        AssertProblem(result, StatusCodes.Status400BadRequest, "Requested page is out of range.");
    }

    [Fact]
    public async Task GetPokemonPage_ReturnsServiceUnavailable_ForOtherUpstreamErrors()
    {
        var controller = new PokemonController(new FakePokemonService
        {
            GetPokemonPageAsyncImpl = (_, _, _) => throw new UpstreamServiceException("network")
        });

        var result = await controller.GetPokemonPage(1, 20, CancellationToken.None);

        AssertProblem(result, StatusCodes.Status503ServiceUnavailable, "PokéAPI is temporarily unavailable.");
    }


    private static void AssertProblem(IActionResult result, int statusCode, string message)
    {
        var objectResult = Assert.IsType<ObjectResult>(result);
        Assert.Equal(statusCode, objectResult.StatusCode);
        var problem = Assert.IsType<ProblemDetails>(objectResult.Value);
        Assert.Equal(statusCode, problem.Status);
        Assert.Equal(message, problem.Detail);
        Assert.Equal(message, problem.Extensions["error"]);
    }

    private sealed class FakePokemonService : IPokemonService
    {
        public Func<string, CancellationToken, Task<PokemonDetailDto?>> GetPokemonAsyncImpl { get; init; } =
            (_, _) => Task.FromResult<PokemonDetailDto?>(new PokemonDetailDto(1, "bulbasaur", ["grass"], ["overgrow"], [new PokemonStatDto("hp", 45)], "sprite"));

        public Func<int, int, CancellationToken, Task<PokemonPageDto>> GetPokemonPageAsyncImpl { get; init; } =
            (page, size, _) => Task.FromResult<PokemonPageDto>(new PokemonPageDto(page, size, 1, 1, [new PokemonSummaryDto(1, "bulbasaur", "sprite")]));

        public Func<string, int, int, CancellationToken, Task<PokemonPageDto>> SearchPokemonAsyncImpl { get; init; } =
            (_, page, size, _) => Task.FromResult<PokemonPageDto>(new PokemonPageDto(page, size, 0, 0, []));

        public Task<PokemonDetailDto?> GetPokemonAsync(string nameOrId, CancellationToken cancellationToken) =>
            GetPokemonAsyncImpl(nameOrId, cancellationToken);

        public Task<PokemonPageDto> GetPokemonPageAsync(int page, int size, CancellationToken cancellationToken) =>
            GetPokemonPageAsyncImpl(page, size, cancellationToken);

        public Task<PokemonPageDto> SearchPokemonAsync(string query, int page, int size, CancellationToken cancellationToken) =>
            SearchPokemonAsyncImpl(query, page, size, cancellationToken);
    }
}

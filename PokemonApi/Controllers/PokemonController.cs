using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Logging.Abstractions;
using PokemonApi.Exceptions;
using PokemonApi.Services;

namespace PokemonApi.Controllers;

[ApiController]
[Route("api/pokemon")]
public class PokemonController(IPokemonService pokemonService, ILogger<PokemonController>? logger = null) : ControllerBase
{
    private readonly ILogger<PokemonController> _logger = logger ?? NullLogger<PokemonController>.Instance;

    [HttpGet("{nameOrId}")]
    public async Task<IActionResult> GetPokemon(string nameOrId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(nameOrId) || nameOrId.Length > 50)
        {
            return ApiProblem(StatusCodes.Status400BadRequest, "nameOrId must be between 1 and 50 characters.");
        }

        try
        {
            var result = await pokemonService.GetPokemonAsync(nameOrId, cancellationToken);

            return result switch
            {
                null => ApiProblem(StatusCodes.Status404NotFound, "Pokemon not found."),
                _ => Ok(result)
            };
        }
        catch (UpstreamServiceException ex)
        {
            _logger.LogWarning(ex, "PokéAPI detail request for {NameOrId} failed.", nameOrId);
            return ApiProblem(StatusCodes.Status503ServiceUnavailable, "PokéAPI is temporarily unavailable.");
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetPokemonPage(
        [FromQuery] int page = 1,
        [FromQuery] int size = 20,
        CancellationToken cancellationToken = default,
        [FromQuery] string? search = null)
    {
        if (page < 1)
        {
            return ApiProblem(StatusCodes.Status400BadRequest, "Page must be greater than or equal to 1.");
        }

        if (size is < 1 or > 100)
        {
            return ApiProblem(StatusCodes.Status400BadRequest, "Size must be between 1 and 100.");
        }

        if (search?.Length > 100)
        {
            return ApiProblem(StatusCodes.Status400BadRequest, "Search must be 100 characters or fewer.");
        }

        try
        {
            var result = string.IsNullOrWhiteSpace(search)
                ? await pokemonService.GetPokemonPageAsync(page, size, cancellationToken)
                : await pokemonService.SearchPokemonAsync(search, page, size, cancellationToken);
            return Ok(result);
        }
        catch (UpstreamServiceException ex)
        {
            if (ex.Message.Contains("out of range", StringComparison.OrdinalIgnoreCase))
            {
                return ApiProblem(StatusCodes.Status400BadRequest, "Requested page is out of range.");
            }

            _logger.LogWarning(ex, "PokéAPI list request failed for page {Page}.", page);
            return ApiProblem(StatusCodes.Status503ServiceUnavailable, "PokéAPI is temporarily unavailable.");
        }
    }

    private IActionResult ApiProblem(int statusCode, string message)
    {
        var result = Problem(
            detail: message,
            statusCode: statusCode,
            title: statusCode switch
            {
                StatusCodes.Status400BadRequest => "Bad Request",
                StatusCodes.Status404NotFound => "Not Found",
                StatusCodes.Status503ServiceUnavailable => "Service Unavailable",
                _ => "Error"
            });

        if (result is ObjectResult { Value: ProblemDetails problem })
        {
            problem.Extensions["error"] = message;
        }

        return result;
    }
}

using Microsoft.AspNetCore.Mvc;
using PokemonApi.Exceptions;
using PokemonApi.Services;

namespace PokemonApi.Controllers;

[ApiController]
[Route("api/pokemon")]
public class PokemonController(IPokemonService pokemonService) : ControllerBase
{
    [HttpGet("{nameOrId}")]
    public async Task<IActionResult> GetPokemon(string nameOrId, CancellationToken cancellationToken)
    {
        if (string.IsNullOrWhiteSpace(nameOrId) || nameOrId.Length > 50)
        {
            return BadRequest(new { error = "nameOrId must be between 1 and 50 characters." });
        }

        try
        {
            var result = await pokemonService.GetPokemonAsync(nameOrId, cancellationToken);

            return result switch
            {
                null => NotFound(new { error = "Pokemon not found." }),
                _ => Ok(result)
            };
        }
        catch (UpstreamServiceException)
        {
            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "PokéAPI is temporarily unavailable." });
        }
    }

    [HttpGet]
    public async Task<IActionResult> GetPokemonPage(
        [FromQuery] int page = 1,
        [FromQuery] int size = 20,
        [FromQuery] string? search = null,
        CancellationToken cancellationToken = default)
    {
        if (page < 1)
        {
            return BadRequest(new { error = "Page must be greater than or equal to 1." });
        }

        if (size is < 1 or > 100)
        {
            return BadRequest(new { error = "Size must be between 1 and 100." });
        }

        if (search?.Length > 100)
        {
            return BadRequest(new { error = "Search must be 100 characters or fewer." });
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
                return BadRequest(new { error = "Requested page is out of range." });
            }

            return StatusCode(StatusCodes.Status503ServiceUnavailable, new { error = "PokéAPI is temporarily unavailable." });
        }
    }
}

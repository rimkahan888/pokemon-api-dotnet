namespace PokemonApi.Exceptions;

public class UpstreamServiceException(string message, Exception? innerException = null, bool isTransient = true)
    : Exception(message, innerException)
{
    public bool IsTransient { get; } = isTransient;
}

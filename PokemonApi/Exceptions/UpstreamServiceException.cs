namespace PokemonApi.Exceptions;

public class UpstreamServiceException(string message, Exception? innerException = null) : Exception(message, innerException);

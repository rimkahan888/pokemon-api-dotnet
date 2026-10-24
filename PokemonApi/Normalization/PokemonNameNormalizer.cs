using System.Text;

namespace PokemonApi.Normalization;

public static class PokemonNameNormalizer
{
    public static string Normalize(string? nameOrId)
    {
        if (string.IsNullOrWhiteSpace(nameOrId))
        {
            return string.Empty;
        }

        var trimmed = nameOrId.Trim().ToLowerInvariant();
        if (trimmed.All(char.IsAsciiDigit))
        {
            var stripped = trimmed.TrimStart('0');
            return stripped.Length == 0 ? "0" : stripped;
        }

        var builder = new StringBuilder(trimmed.Length);
        var pendingHyphen = false;
        foreach (var ch in trimmed)
        {
            if (ch is '\'' or '\u2019' or '.')
            {
                continue;
            }

            if (char.IsWhiteSpace(ch) || ch is '_' or '-')
            {
                pendingHyphen = builder.Length > 0;
                continue;
            }

            if (ch is >= 'a' and <= 'z' || char.IsAsciiDigit(ch))
            {
                if (pendingHyphen)
                {
                    builder.Append('-');
                    pendingHyphen = false;
                }

                builder.Append(ch);
            }
        }

        return builder.ToString();
    }
}

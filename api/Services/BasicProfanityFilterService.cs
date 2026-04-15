namespace Bts.Api.Services;

public sealed class BasicProfanityFilterService : IProfanityFilterService
{
    private static readonly string[] BlockedWords =
    [
        "Fuck",
        "Sex",
        "Horny"
    ];

    public bool ContainsBlockedContent(string text)
    {
        if (string.IsNullOrWhiteSpace(text))
            return false;

        var value = text.ToLowerInvariant();

        foreach (var word in BlockedWords)
        {
            if (value.Contains(word, StringComparison.Ordinal))
                return true;
        }

        return false;
    }
}
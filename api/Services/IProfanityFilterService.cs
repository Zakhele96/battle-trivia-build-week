namespace Bts.Api.Services;

public interface IProfanityFilterService
{
    bool ContainsBlockedContent(string text);
}
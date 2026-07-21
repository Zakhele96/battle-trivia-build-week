using Bts.Api.Models.Responses;

namespace Bts.Api.Services;

public interface ITriviaExplanationService
{
    Task<TriviaExplanationResponse> GetOrGenerateAsync(
        Guid roundId,
        Guid userId,
        CancellationToken cancellationToken = default);
}

public sealed class TriviaRoundNotFoundException : Exception
{
}

public sealed class TriviaRoundNotEndedException : Exception
{
}

public sealed class TriviaExplanationUnavailableException : Exception
{
    public TriviaExplanationUnavailableException(string message)
        : base(message)
    {
    }

    public TriviaExplanationUnavailableException(string message, Exception innerException)
        : base(message, innerException)
    {
    }
}

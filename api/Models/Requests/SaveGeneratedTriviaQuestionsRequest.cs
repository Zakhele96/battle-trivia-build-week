namespace Bts.Api.Models.Requests;

public sealed class SaveGeneratedTriviaQuestionsRequest
{
    public List<CreateTriviaQuestionRequest> Questions { get; set; } = new();
}

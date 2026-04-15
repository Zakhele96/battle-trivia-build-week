using System.Text.Json;

namespace Bts.Api.Models.Domain;

public sealed class TriviaQuestion
{
    public Guid Id { get; set; }
    public string QuestionText { get; set; } = string.Empty;
    public string CorrectAnswer { get; set; } = string.Empty;

    // Selected from SQL as accepted_answers::text
    public string AcceptedAnswersJson { get; set; } = "[]";

    public string? Category { get; set; }
    public string? Difficulty { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }

    public IReadOnlyList<string> GetAcceptedAnswers()
    {
        if (string.IsNullOrWhiteSpace(AcceptedAnswersJson))
            return Array.Empty<string>();

        try
        {
            var values = JsonSerializer.Deserialize<List<string>>(AcceptedAnswersJson);
            return values is not null ? values : Array.Empty<string>();
        }
        catch
        {
            return Array.Empty<string>();
        }
    }
}
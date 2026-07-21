namespace Bts.Api.Services;

public sealed class OpenAiOptions
{
    public const string SectionName = "OpenAI";

    public bool Enabled { get; set; }
    public string ApiKey { get; set; } = string.Empty;
    public string Model { get; set; } = "gpt-5.6-luna";
    public string ReasoningEffort { get; set; } = "low";
    public int MaxOutputTokens { get; set; } = 400;
    public int QuestionStudioMaxOutputTokens { get; set; } = 3000;
}

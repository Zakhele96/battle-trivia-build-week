using Bts.Api.Models.Requests;
using FluentValidation;

namespace Bts.Api.Validators;

public sealed class GenerateTriviaQuestionsRequestValidator : AbstractValidator<GenerateTriviaQuestionsRequest>
{
    private static readonly string[] AllowedDifficulties = ["easy", "medium", "hard"];

    public GenerateTriviaQuestionsRequestValidator()
    {
        RuleFor(x => x.Topic)
            .NotEmpty()
            .MinimumLength(2)
            .MaximumLength(100);

        RuleFor(x => x.Difficulty)
            .NotEmpty()
            .Must(value => AllowedDifficulties.Contains(value, StringComparer.OrdinalIgnoreCase))
            .WithMessage("Difficulty must be easy, medium, or hard.");

        RuleFor(x => x.Count)
            .InclusiveBetween(1, 5);
    }
}

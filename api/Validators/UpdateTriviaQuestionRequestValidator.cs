using Bts.Api.Models.Requests;
using FluentValidation;

namespace Bts.Api.Validators;

public sealed class UpdateTriviaQuestionRequestValidator : AbstractValidator<UpdateTriviaQuestionRequest>
{
    public UpdateTriviaQuestionRequestValidator()
    {
        RuleFor(x => x.QuestionText)
            .NotEmpty()
            .MaximumLength(500);

        RuleFor(x => x.CorrectAnswer)
            .NotEmpty()
            .MaximumLength(200);

        RuleFor(x => x.Category)
            .MaximumLength(50);

        RuleFor(x => x.Difficulty)
            .MaximumLength(30);

        RuleFor(x => x.QuestionImageUrl)
            .MaximumLength(1000)
            .Must(BeValidOptionalUrl)
            .WithMessage("Question image URL must be a valid absolute URL.");

        RuleFor(x => x.AnswerImageUrl)
            .MaximumLength(1000)
            .Must(BeValidOptionalUrl)
            .WithMessage("Answer image URL must be a valid absolute URL.");

        RuleFor(x => x.AnswerExplanation)
            .MaximumLength(500);

        RuleForEach(x => x.AcceptedAnswers)
            .NotEmpty()
            .MaximumLength(200);
    }

    private static bool BeValidOptionalUrl(string? value)
    {
        return string.IsNullOrWhiteSpace(value) ||
               Uri.TryCreate(value, UriKind.Absolute, out _);
    }
}

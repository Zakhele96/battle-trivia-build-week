using Bts.Api.Models.Requests;
using FluentValidation;

namespace Bts.Api.Validators;

public sealed class CreateTriviaQuestionRequestValidator : AbstractValidator<CreateTriviaQuestionRequest>
{
    public CreateTriviaQuestionRequestValidator()
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

        RuleForEach(x => x.AcceptedAnswers)
            .NotEmpty()
            .MaximumLength(200);
    }
}
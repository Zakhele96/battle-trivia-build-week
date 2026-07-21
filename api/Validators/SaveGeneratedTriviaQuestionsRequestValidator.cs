using Bts.Api.Models.Requests;
using FluentValidation;

namespace Bts.Api.Validators;

public sealed class SaveGeneratedTriviaQuestionsRequestValidator : AbstractValidator<SaveGeneratedTriviaQuestionsRequest>
{
    public SaveGeneratedTriviaQuestionsRequestValidator()
    {
        RuleFor(x => x.Questions)
            .NotEmpty()
            .Must(questions => questions.Count <= 5)
            .WithMessage("You can save at most 5 generated questions at a time.");

        RuleForEach(x => x.Questions)
            .SetValidator(new CreateTriviaQuestionRequestValidator());
    }
}

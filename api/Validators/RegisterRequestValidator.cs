using Bts.Api.Models.Requests;
using FluentValidation;

namespace Bts.Api.Validators;

public sealed class RegisterRequestValidator : AbstractValidator<RegisterRequest>
{
    public RegisterRequestValidator()
    {
        RuleFor(x => x.Username)
            .NotEmpty()
            .MinimumLength(3)
            .MaximumLength(30);

        RuleFor(x => x.DisplayName)
            .NotEmpty()
            .MaximumLength(50);

        RuleFor(x => x.Email)
            .NotEmpty()
            .EmailAddress()
            .MaximumLength(120);

        When(
            x => !x.UsePasswordless,
            () =>
            {
                RuleFor(x => x.Password)
                    .NotEmpty()
                    .MinimumLength(8);
            });

        RuleFor(x => x.PhoneNumber)
            .MaximumLength(20);
    }
}

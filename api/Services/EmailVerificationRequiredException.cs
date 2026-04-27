namespace Bts.Api.Services;

public sealed class EmailVerificationRequiredException : Exception
{
    public EmailVerificationRequiredException(string email)
        : base("Verify your email before logging in.")
    {
        Email = email;
    }

    public string Email { get; }
}

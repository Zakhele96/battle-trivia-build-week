namespace Bts.Api.Models.Domain;

public sealed class User
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public string? PasswordHash { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
    public bool IsAdmin { get; set; }

    public string? GoogleSub { get; set; }
    public string? FacebookUserId { get; set; }
    public string AuthProvider { get; set; } = "local";
    public string? AvatarUrl { get; set; }
    public string? StatusMessage { get; set; }
    public bool IsSupporter { get; set; }
    public string? SupporterTier { get; set; }
    public DateTime? SupporterExpiresAt { get; set; }
    public bool EmailVerified { get; set; }
    public string? EmailVerificationCodeHash { get; set; }
    public DateTime? EmailVerificationExpiresAt { get; set; }
    public DateTime? EmailVerificationSentAt { get; set; }
}

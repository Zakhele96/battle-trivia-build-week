namespace Bts.Api.Models.Responses;

public sealed class UserResponse
{
    public Guid Id { get; set; }
    public string Username { get; set; } = string.Empty;
    public string DisplayName { get; set; } = string.Empty;
    public string Email { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
    public bool IsAdmin { get; set; }
    public string? AvatarUrl { get; set; }
    public string? StatusMessage { get; set; }
    public bool IsSupporter { get; set; }
    public string? SupporterTier { get; set; }
    public string? SupporterBadgeLabel { get; set; }
    public DateTime? SupporterExpiresAt { get; set; }
    public string AuthProvider { get; set; } = "local";
    public bool HasPassword { get; set; }
    public bool EmailVerified { get; set; }
}

namespace Bts.Api.Models.Responses;

public sealed class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public UserResponse? User { get; set; }
    public bool RequiresEmailVerification { get; set; }
    public string? PendingEmail { get; set; }
    public string? Message { get; set; }
}

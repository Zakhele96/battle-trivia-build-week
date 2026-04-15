namespace Bts.Api.Models.Responses;

public sealed class AuthResponse
{
    public string Token { get; set; } = string.Empty;
    public UserResponse User { get; set; } = new();
}
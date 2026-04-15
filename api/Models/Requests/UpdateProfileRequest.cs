namespace Bts.Api.Models.Requests;

public sealed class UpdateProfileRequest
{
    public string DisplayName { get; set; } = string.Empty;
    public string? PhoneNumber { get; set; }
}
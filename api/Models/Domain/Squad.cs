namespace Bts.Api.Models.Domain;

public sealed class Squad
{
    public Guid Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public string InviteCode { get; set; } = string.Empty;
    public Guid CreatedByUserId { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

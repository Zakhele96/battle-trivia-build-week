namespace Bts.Api.Models.Domain;

public sealed class Friendship
{
    public Guid Id { get; set; }
    public Guid RequesterUserId { get; set; }
    public Guid AddresseeUserId { get; set; }
    public string Status { get; set; } = "pending";
    public DateTime? RespondedAt { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}

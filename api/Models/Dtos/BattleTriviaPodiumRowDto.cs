public sealed class BattleTriviaPodiumRowDto
{
    public Guid UserId { get; set; }
    public string Username { get; set; } = "";
    public string DisplayName { get; set; } = "";
    public int Rank { get; set; }
    public int Score { get; set; }
}
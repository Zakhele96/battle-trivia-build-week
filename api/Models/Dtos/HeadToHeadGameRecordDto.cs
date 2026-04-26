namespace Bts.Api.Models.Dtos;

public sealed class HeadToHeadGameRecordDto
{
    public int Matches { get; set; }
    public int Wins { get; set; }
    public int Losses { get; set; }
    public int Ties { get; set; }
}

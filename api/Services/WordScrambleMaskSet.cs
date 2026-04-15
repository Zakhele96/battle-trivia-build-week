namespace Bts.Api.Services;

public sealed class WordScrambleMaskSet
{
    public string InitialMask { get; set; } = string.Empty;
    public string MaskAt20s { get; set; } = string.Empty;
    public string MaskAt10s { get; set; } = string.Empty;
}
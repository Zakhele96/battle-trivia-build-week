using System.Text;

namespace Bts.Api.Services;

public sealed class WordScrambleMaskService
{
    public WordScrambleMaskSet BuildMasks(string answerWord)
    {
        if (string.IsNullOrWhiteSpace(answerWord))
        {
            return new WordScrambleMaskSet
            {
                InitialMask = string.Empty,
                MaskAt20s = string.Empty,
                MaskAt10s = string.Empty
            };
        }

        var display = answerWord.Trim().ToUpperInvariant();
        var revealOrder = BuildRevealOrder(display);

        var revealableCount = revealOrder.Count;

        if (revealableCount == 0)
        {
            return new WordScrambleMaskSet
            {
                InitialMask = display,
                MaskAt20s = display,
                MaskAt10s = display
            };
        }

        var initialRevealCount = GetInitialRevealCount(revealableCount);
        var reveal20Count = GetReveal20Count(revealableCount, initialRevealCount);
        var reveal10Count = GetReveal10Count(revealableCount, reveal20Count);

        return new WordScrambleMaskSet
        {
            InitialMask = BuildMask(display, revealOrder.Take(initialRevealCount).ToHashSet()),
            MaskAt20s = BuildMask(display, revealOrder.Take(reveal20Count).ToHashSet()),
            MaskAt10s = BuildMask(display, revealOrder.Take(reveal10Count).ToHashSet())
        };
    }

    private static List<int> BuildRevealOrder(string value)
    {
        var revealable = new List<int>();

        for (var i = 0; i < value.Length; i++)
        {
            if (char.IsLetterOrDigit(value[i]))
            {
                revealable.Add(i);
            }
        }

        if (revealable.Count <= 2)
            return revealable;

        var ordered = new List<int>();
        var used = new HashSet<int>();

        void AddIndex(int index)
        {
            if (index < 0 || index >= value.Length)
                return;

            if (!char.IsLetterOrDigit(value[index]))
                return;

            if (used.Add(index))
            {
                ordered.Add(index);
            }
        }

        var first = revealable.First();
        var last = revealable.Last();
        var middle = revealable[revealable.Count / 2];
        var quarter = revealable[revealable.Count / 4];
        var threeQuarter = revealable[(revealable.Count * 3) / 4];

        AddIndex(first);
        AddIndex(last);
        AddIndex(middle);
        AddIndex(quarter);
        AddIndex(threeQuarter);

        foreach (var index in revealable)
        {
            AddIndex(index);
        }

        return ordered;
    }

    private static int GetInitialRevealCount(int length)
    {
        if (length <= 2)
            return length;

        return Math.Min(length, Math.Max(3, (int)Math.Ceiling(length * 0.35)));
    }

    private static int GetReveal20Count(int length, int initialRevealCount)
    {
        if (length <= initialRevealCount)
            return length;

        return Math.Min(length, Math.Max(initialRevealCount + 1, (int)Math.Ceiling(length * 0.6)));
    }

    private static int GetReveal10Count(int length, int reveal20Count)
    {
        if (length <= reveal20Count)
            return length;

        if (length <= 4)
            return length;

        return Math.Min(length, Math.Max(reveal20Count + 1, length - 1));
    }

    private static string BuildMask(string display, HashSet<int> revealedIndexes)
    {
        var builder = new StringBuilder(display.Length);

        for (var i = 0; i < display.Length; i++)
        {
            var ch = display[i];

            if (!char.IsLetterOrDigit(ch))
            {
                builder.Append(ch);
                continue;
            }

            builder.Append(revealedIndexes.Contains(i) ? ch : '_');
        }

        return builder.ToString();
    }
}
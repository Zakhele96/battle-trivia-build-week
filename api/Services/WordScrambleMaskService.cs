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

        // Reveal inner letters first so the opening and closing letters stay hidden longer.
        var interior = revealable.Skip(1).Take(Math.Max(0, revealable.Count - 2)).ToList();
        var ordered = new List<int>();

        var left = interior.Count / 2;
        var right = left + 1;

        if (interior.Count % 2 == 1)
        {
            ordered.Add(interior[left]);
            left--;
        }

        while (left >= 0 || right < interior.Count)
        {
            if (right < interior.Count)
            {
                ordered.Add(interior[right]);
                right++;
            }

            if (left >= 0)
            {
                ordered.Add(interior[left]);
                left--;
            }
        }

        ordered.Add(revealable.First());
        ordered.Add(revealable.Last());

        return ordered.Distinct().ToList();
    }

    private static int GetInitialRevealCount(int length)
    {
        if (length <= 2)
            return length;

        return Math.Min(length, Math.Max(2, (int)Math.Ceiling(length * 0.22)));
    }

    private static int GetReveal20Count(int length, int initialRevealCount)
    {
        if (length <= initialRevealCount)
            return length;

        return Math.Min(length, Math.Max(initialRevealCount + 1, (int)Math.Ceiling(length * 0.4)));
    }

    private static int GetReveal10Count(int length, int reveal20Count)
    {
        if (length <= reveal20Count)
            return length;

        if (length <= 4)
            return Math.Min(length, reveal20Count + 1);

        // Keep the final moments challenging; do not reveal the full outline of the word.
        return Math.Min(length, Math.Max(reveal20Count + 1, (int)Math.Ceiling(length * 0.58)));
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

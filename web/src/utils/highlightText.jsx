export function highlightText(text, query) {
  if (!text || !query) return text;

  const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const regex = new RegExp(`(${escaped})`, "ig");
  const parts = text.split(regex);

  return parts.map((part, index) =>
    regex.test(part) ? (
      <mark key={index} className="bg-yellow-100 px-0.5 text-inherit">
        {part}
      </mark>
    ) : (
      <span key={index}>{part}</span>
    )
  );
}
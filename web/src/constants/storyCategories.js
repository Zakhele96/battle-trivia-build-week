export const STORY_CATEGORIES = [
  "News",
  "Politics",
  "Community",
  "Sport",
  "Business",
  "Lifestyle",
  "Entertainment",
  "Opinion",
  "Education",
  "Health",
  "Technology",
  "Travel",
];

export function normalizeCategory(category) {
  return category?.trim() || "General";
}

export function slugifyCategory(category) {
  return normalizeCategory(category)
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");
}

export function getCategoryFromSlug(slug) {
  const match = STORY_CATEGORIES.find(
    (category) => slugifyCategory(category) === slug
  );

  return match || null;
}
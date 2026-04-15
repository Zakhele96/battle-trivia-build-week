export function validateStoryForPublish(form) {
  const errors = [];

  if (!form.title?.trim()) errors.push("Title is required.");
  if (!form.summary?.trim()) errors.push("Summary is required.");
  if (!form.bodyHtml?.trim()) errors.push("Body content is required.");
  if (!form.heroImageUrl?.trim()) errors.push("Hero image is required.");
  if (!form.authorName?.trim()) errors.push("Author name is required.");
  if (!form.category?.trim()) errors.push("Category is required.");
  if (!form.publishDate?.trim()) errors.push("Publish date is required.");

  return errors;
}

export function validateIssueForPublish(form) {
  const errors = [];

  if (!form.title?.trim()) errors.push("Title is required.");
  if (!form.issueNumber?.toString().trim()) errors.push("Issue number is required.");
  if (!form.description?.trim()) errors.push("Description is required.");
  if (!form.publishDate?.trim()) errors.push("Publish date is required.");

  const thumbnail =
    form.thumbnailUrl ||
    form.thumbnail_url ||
    form.thumbnail ||
    form.coverImageUrl ||
    form.cover_image_url ||
    "";

  if (!thumbnail?.trim()) errors.push("Issue thumbnail / cover is required.");

  return errors;
}
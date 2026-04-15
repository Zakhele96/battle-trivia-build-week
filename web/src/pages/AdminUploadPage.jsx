import { useState } from "react";
import { Link } from "react-router-dom";
import { uploadIssue } from "../api/issuesApi";

const initialForm = {
  title: "",
  issueNumber: "",
  description: "",
  publishDate: "",
  isPublished: false,
};

export default function AdminUploadPage() {
  const [form, setForm] = useState(initialForm);
  const [pdfFile, setPdfFile] = useState(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");
  const [createdIssue, setCreatedIssue] = useState(null);

  const checklistItems = [
    { label: "Title", done: !!form.title.trim() },
    { label: "Issue number", done: !!String(form.issueNumber).trim() },
    { label: "Description", done: !!form.description.trim() },
    { label: "PDF file", done: !!pdfFile },
    { label: "Publish date", done: !!form.publishDate.trim() },
  ];

  function handleChange(event) {
    const { name, value, type, checked } = event.target;

    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  }

  function handlePdfChange(event) {
    const file = event.target.files?.[0] || null;
    setPdfFile(file);
  }

  async function handleSubmit(event) {
    event.preventDefault();

    setError("");
    setSuccessMessage("");
    setCreatedIssue(null);

    if (!form.title.trim()) {
      setError("Title is required.");
      return;
    }

    if (!String(form.issueNumber).trim()) {
      setError("Issue number is required.");
      return;
    }

    if (!pdfFile) {
      setError("PDF file is required.");
      return;
    }

    if (form.isPublished) {
      if (!form.description.trim()) {
        setError("Description is required before publishing.");
        return;
      }

      if (!form.publishDate.trim()) {
        setError("Publish date is required before publishing.");
        return;
      }
    }

    try {
      setSubmitting(true);

      const payload = new FormData();
      payload.append("file", pdfFile);
      payload.append("title", form.title.trim());
      payload.append("issueNumber", String(form.issueNumber).trim());
      payload.append("description", form.description.trim());
      payload.append(
        "publishDate",
        form.publishDate ? new Date(form.publishDate).toISOString() : ""
      );
      payload.append("isPublished", String(form.isPublished));

      const created = await uploadIssue(payload);

      setCreatedIssue(created);
      setSuccessMessage("Issue uploaded successfully.");
      setForm(initialForm);
      setPdfFile(null);
    } catch (err) {
      setError(
        err?.response?.data?.message ||
          err?.response?.data ||
          "Failed to upload issue."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <div className="min-h-screen bg-neutral-100 px-4 py-8">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex flex-col gap-3 md:flex-row md:items-end md:justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900">
              Upload Issue
            </h1>
            <p className="mt-2 text-sm text-neutral-600">
              Upload a new PDF issue, add metadata, and publish it when ready.
            </p>
          </div>

          <div className="flex flex-wrap gap-3">
            <Link
              to="/admin/issues"
              className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
            >
              Back to Issues
            </Link>
          </div>
        </div>

        {error ? (
          <div className="mb-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
            {error}
          </div>
        ) : null}

        {successMessage ? (
          <div className="mb-4 rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">
            {successMessage}
            {createdIssue ? (
              <div className="mt-2 text-xs text-green-800">
                <div>
                  <strong>ID:</strong> {createdIssue.id}
                </div>
                {createdIssue.slug ? (
                  <div>
                    <strong>Slug:</strong> {createdIssue.slug}
                  </div>
                ) : null}
              </div>
            ) : null}
          </div>
        ) : null}

        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
          <form
            onSubmit={handleSubmit}
            className="rounded-2xl bg-white p-6 shadow-sm ring-1 ring-black/5"
          >
            <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-neutral-800">
                  Title
                </label>
                <input
                  type="text"
                  name="title"
                  value={form.title}
                  onChange={handleChange}
                  placeholder="Issue title"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800">
                  Issue Number
                </label>
                <input
                  type="text"
                  name="issueNumber"
                  value={form.issueNumber}
                  onChange={handleChange}
                  placeholder="e.g. 171"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                />
              </div>

              <div>
                <label className="mb-2 block text-sm font-medium text-neutral-800">
                  Publish Date
                </label>
                <input
                  type="datetime-local"
                  name="publishDate"
                  value={form.publishDate}
                  onChange={handleChange}
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-neutral-800">
                  Description
                </label>
                <textarea
                  name="description"
                  value={form.description}
                  onChange={handleChange}
                  rows={5}
                  placeholder="Short description for this issue"
                  className="w-full rounded-xl border border-neutral-300 px-4 py-3 text-sm outline-none transition focus:border-neutral-500"
                />
              </div>

              <div className="md:col-span-2">
                <label className="mb-2 block text-sm font-medium text-neutral-800">
                  PDF File
                </label>

                <div className="rounded-2xl border border-dashed border-neutral-300 bg-neutral-50 p-4">
                  <input
                    type="file"
                    accept="application/pdf"
                    onChange={handlePdfChange}
                    className="block w-full text-sm text-neutral-700 file:mr-4 file:rounded-lg file:border-0 file:bg-neutral-900 file:px-4 file:py-2 file:text-sm file:font-medium file:text-white hover:file:bg-neutral-800"
                  />

                  <p className="mt-3 text-xs text-neutral-500">
                    Upload the issue PDF. The cover/thumbnail is typically generated from this file.
                  </p>

                  {pdfFile ? (
                    <div className="mt-4 rounded-xl border border-neutral-200 bg-white px-4 py-3 text-sm text-neutral-700">
                      <div className="font-medium text-neutral-900">{pdfFile.name}</div>
                      <div className="mt-1 text-xs text-neutral-500">
                        {(pdfFile.size / 1024 / 1024).toFixed(2)} MB
                      </div>
                    </div>
                  ) : null}
                </div>
              </div>
            </div>

            <div className="mt-5 flex items-center gap-3">
              <input
                id="isPublished"
                type="checkbox"
                name="isPublished"
                checked={form.isPublished}
                onChange={handleChange}
                className="h-4 w-4 rounded border-neutral-300"
              />
              <label
                htmlFor="isPublished"
                className="text-sm font-medium text-neutral-800"
              >
                Publish immediately
              </label>
            </div>

            <div className="mt-6 flex flex-wrap gap-3">
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {submitting ? "Uploading..." : "Upload Issue"}
              </button>

              <button
                type="button"
                onClick={() => {
                  setForm(initialForm);
                  setPdfFile(null);
                  setError("");
                  setSuccessMessage("");
                  setCreatedIssue(null);
                }}
                className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
              >
                Reset
              </button>
            </div>
          </form>

          <div className="h-fit rounded-2xl border border-neutral-200 bg-neutral-50 p-4">
            <div className="text-xs font-semibold uppercase tracking-[0.2em] text-neutral-500">
              Publish Checklist
            </div>

            <div className="mt-4 space-y-2 text-sm text-neutral-700">
              {checklistItems.map((item) => (
                <div key={item.label}>
                  {item.done ? "✓" : "•"} {item.label}
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
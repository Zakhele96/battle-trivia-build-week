import { Link } from "react-router-dom";
import AdminPageShell from "../components/AdminPageShell";
import AdminCard from "../components/AdminCard";

const QUICK_ACTIONS = [
  {
    title: "Manage Issues",
    description: "View and edit your published and draft issues.",
    to: "/admin/issues",
  },
  {
    title: "Upload Issue",
    description: "Upload a new digital issue and prepare it for readers.",
    to: "/admin/upload",
  },
  {
    title: "Manage Stories",
    description: "Edit stories, publishing state, and article details.",
    to: "/admin/stories",
  },
  {
    title: "Create Story",
    description: "Add a new story with a hero image and category.",
    to: "/admin/stories/create",
  },
  {
    title: "Media Library",
    description: "Browse uploaded story images and reuse them quickly.",
    to: "/admin/stories/media",
  },
];

export default function AdminDashboardPage() {
  return (
    <AdminPageShell
      title="Admin Overview"
      description="Manage issues, stories, media, and uploads from one place."
      actions={
        <>
          <Link
            to="/admin/stories/create"
            className="rounded-xl bg-neutral-900 px-5 py-3 text-sm font-medium text-white transition hover:bg-neutral-800"
          >
            Create Story
          </Link>

          <Link
            to="/admin/upload"
            className="rounded-xl border border-neutral-300 bg-white px-5 py-3 text-sm font-medium text-neutral-800 transition hover:bg-neutral-50"
          >
            Upload Issue
          </Link>
        </>
      }
    >
      <div className="grid grid-cols-1 gap-5 md:grid-cols-2 xl:grid-cols-3">
        {QUICK_ACTIONS.map((item) => (
          <Link key={item.to} to={item.to}>
            <AdminCard className="h-full transition hover:border-neutral-300 hover:shadow-md">
              <h2 className="text-lg font-semibold text-neutral-900">
                {item.title}
              </h2>
              <p className="mt-2 text-sm leading-6 text-neutral-600">
                {item.description}
              </p>
              <div className="mt-4 text-sm font-semibold text-neutral-900">
                Open →
              </div>
            </AdminCard>
          </Link>
        ))}
      </div>
    </AdminPageShell>
  );
}
export default function AdminCard({ children, className = "" }) {
  return (
    <div
      className={`rounded-2xl border border-neutral-200 bg-white p-6 shadow-sm ${className}`}
    >
      {children}
    </div>
  );
}
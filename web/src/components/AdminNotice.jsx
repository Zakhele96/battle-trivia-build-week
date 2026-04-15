export default function AdminNotice({ type = "info", children }) {
  const styles = {
    info: "border-blue-200 bg-blue-50 text-blue-700",
    success: "border-green-200 bg-green-50 text-green-700",
    error: "border-red-200 bg-red-50 text-red-700",
    warning: "border-amber-200 bg-amber-50 text-amber-800",
  };

  return (
    <div
      className={`rounded-xl border px-4 py-3 text-sm ${
        styles[type] || styles.info
      }`}
    >
      {children}
    </div>
  );
}
import { Navigate, Outlet, useLocation } from "react-router-dom";
import { useAdminAuth } from "../context/AdminAuthContext";

export default function ProtectedAdminRoute() {
  const { loading, isAuthenticated, sessionExpired } = useAdminAuth();
  const location = useLocation();

  if (loading) {
    return (
      <div className="min-h-screen bg-neutral-100 px-4 py-8">
        <div className="mx-auto max-w-xl rounded-2xl bg-white p-8 text-center text-sm text-neutral-600 shadow-sm ring-1 ring-black/5">
          Checking admin session...
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <Navigate
        to="/admin/login"
        replace
        state={{
          from: location.pathname,
          reason: sessionExpired ? "expired" : "unauthorized",
        }}
      />
    );
  }

  return <Outlet />;
}
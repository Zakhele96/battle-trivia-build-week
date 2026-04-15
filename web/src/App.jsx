import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LobbyPage from "./pages/LobbyPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RoomPage from "./pages/RoomPage";
import ProfilePage from "./pages/ProfilePage";
import { useAuth } from "./hooks/useAuth";
import AdminRoute from "./components/AdminRoute";
import AdminTriviaManagementPage from "./pages/AdminTriviaManagementPage";
import LeaderboardsPage from "./pages/LeaderboardsPage";

function PublicOnlyRoute({ children }) {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-white">
        Loading...
      </div>
    );
  }

  if (isAuthenticated) {
    return <Navigate to="/" replace />;
  }

  return children;
}

export default function App() {
  return (
    <Routes>
      <Route
        path="/login"
        element={
          <PublicOnlyRoute>
            <LoginPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/register"
        element={
          <PublicOnlyRoute>
            <RegisterPage />
          </PublicOnlyRoute>
        }
      />

      <Route
        path="/"
        element={
          <ProtectedRoute>
            <LobbyPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/rooms/:roomId"
        element={
          <ProtectedRoute>
            <RoomPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />
<Route
  path="/leaderboards"
  element={
    <ProtectedRoute>
      <LeaderboardsPage />
    </ProtectedRoute>
  }
/>

      <Route
        path="/admin/trivia"
        element={
          <AdminRoute>
            <AdminTriviaManagementPage />
          </AdminRoute>
        }
      />
    </Routes>
  );
}
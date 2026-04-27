import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import LobbyPage from "./pages/LobbyPage";
import LoginPage from "./pages/LoginPage";
import RegisterPage from "./pages/RegisterPage";
import RoomPage from "./pages/RoomPage";
import ProfilePage from "./pages/ProfilePage";
import UserProfilePage from "./pages/UserProfilePage";
import ActivityPage from "./pages/ActivityPage";
import { useAuth } from "./hooks/useAuth";
import AdminRoute from "./components/AdminRoute";
import AdminTriviaManagementPage from "./pages/AdminTriviaManagementPage";
import LeaderboardsPage from "./pages/LeaderboardsPage";
import RoomsPage from "./pages/RoomsPage";
import CommunityPage from "./pages/CommunityPage";
import SharedLeaderboardPage from "./pages/SharedLeaderboardPage";
import SquadsPage from "./pages/SquadsPage";
import AlertsPage from "./pages/AlertsPage";
import DirectMessagesPage from "./pages/DirectMessagesPage";
import SupportPage from "./pages/SupportPage";
import AppSeo from "./components/seo/AppSeo";
import PwaInstallPrompt from "./components/pwa/PwaInstallPrompt";
import PwaUpdatePrompt from "./components/pwa/PwaUpdatePrompt";

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
    <>
      <AppSeo />
      <PwaInstallPrompt />
      <PwaUpdatePrompt />
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
        path="/rooms"
        element={
          <ProtectedRoute>
            <RoomsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/alerts"
        element={
          <ProtectedRoute>
            <AlertsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/messages"
        element={
          <ProtectedRoute>
            <DirectMessagesPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/squads"
        element={
          <ProtectedRoute>
            <SquadsPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/community"
        element={
          <ProtectedRoute>
            <CommunityPage />
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

      <Route path="/share/leaderboard" element={<SharedLeaderboardPage />} />

      <Route
        path="/profile"
        element={
          <ProtectedRoute>
            <ProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/support"
        element={
          <ProtectedRoute>
            <SupportPage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/profile/:userId"
        element={
          <ProtectedRoute>
            <UserProfilePage />
          </ProtectedRoute>
        }
      />

      <Route
        path="/activity"
        element={
          <ProtectedRoute>
            <ActivityPage />
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
        path="/admin/trivia"
        element={
          <AdminRoute>
            <AdminTriviaManagementPage />
          </AdminRoute>
        }
      />

        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </>
  );
}

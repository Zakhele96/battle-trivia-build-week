import { Suspense, lazy } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import ProtectedRoute from "./components/ProtectedRoute";
import { useAuth } from "./hooks/useAuth";
import AdminRoute from "./components/AdminRoute";
import AppSeo from "./components/seo/AppSeo";
import PwaInstallPrompt from "./components/pwa/PwaInstallPrompt";
import PwaUpdatePrompt from "./components/pwa/PwaUpdatePrompt";

const LobbyPage = lazy(() => import("./pages/LobbyPage"));
const LandingPage = lazy(() => import("./pages/LandingPage"));
const LoginPage = lazy(() => import("./pages/LoginPage"));
const RegisterPage = lazy(() => import("./pages/RegisterPage"));
const RoomPage = lazy(() => import("./pages/RoomPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const UserProfilePage = lazy(() => import("./pages/UserProfilePage"));
const ActivityPage = lazy(() => import("./pages/ActivityPage"));
const AdminTriviaManagementPage = lazy(
  () => import("./pages/AdminTriviaManagementPage")
);
const LeaderboardsPage = lazy(() => import("./pages/LeaderboardsPage"));
const RoomsPage = lazy(() => import("./pages/RoomsPage"));
const CommunityPage = lazy(() => import("./pages/CommunityPage"));
const SharedLeaderboardPage = lazy(
  () => import("./pages/SharedLeaderboardPage")
);
const SquadsPage = lazy(() => import("./pages/SquadsPage"));
const AlertsPage = lazy(() => import("./pages/AlertsPage"));
const DirectMessagesPage = lazy(() => import("./pages/DirectMessagesPage"));
const SupportPage = lazy(() => import("./pages/SupportPage"));

function RouteLoadingScreen() {
  return (
    <div className="flex min-h-screen items-center justify-center bg-neutral-950 text-sm text-neutral-400">
      Loading page...
    </div>
  );
}

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

function HomeRoute() {
  const { isAuthenticated, isInitializing } = useAuth();

  if (isInitializing) {
    return <RouteLoadingScreen />;
  }

  return isAuthenticated ? <LobbyPage /> : <LandingPage />;
}

export default function App() {
  return (
    <>
      <AppSeo />
      <PwaInstallPrompt />
      <PwaUpdatePrompt />
      <Suspense fallback={<RouteLoadingScreen />}>
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
              <HomeRoute />
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
      </Suspense>
    </>
  );
}

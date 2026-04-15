import { Routes, Route, useLocation} from "react-router-dom";
import { AdminAuthProvider } from "./context/AdminAuthContext";
import ProtectedAdminRoute from "./components/ProtectedAdminRoute";
import IssuesPage from "./pages/IssuesPage";
import IssueReaderPage from "./pages/IssueReaderPage";
import StoriesIndexPage from "./pages/StoriesIndexPage";
import StoryPage from "./pages/StoryPage";
import CategoryStoriesPage from "./pages/CategoryStoriesPage";
import AdminLayout from "./components/AdminLayout";
import AdminDashboardPage from "./pages/AdminDashboardPage";
import AdminLoginPage from "./pages/AdminLoginPage";
import AdminUploadPage from "./pages/AdminUploadPage";
import AdminIssuesPage from "./pages/AdminIssuesPage";
import AdminEditIssuePage from "./pages/AdminEditIssuePage";
import AdminCreateStoryPage from "./pages/AdminCreateStoryPage";
import AdminStoriesPage from "./pages/AdminStoriesPage";
import AdminEditStoryPage from "./pages/AdminEditStoryPage";
import AdminStoryMediaPage from "./pages/AdminStoryMediaPage";
import IssuesIndexPage from "./pages/IssuesIndexPage";
import FloatingWhatsAppButton from "./components/FloatingWhatsAppButton";
import AdminAnalyticsPage from "./pages/AdminAnalyticsPage";
import AdminSubscribersPage from "./pages/AdminSubscribersPage";
import AboutPage from "./pages/AboutPage";
import ContactPage from "./pages/ContactPage";
import AdvertisePage from "./pages/AdvertisePage";
import PrivacyPolicyPage from "./pages/PrivacyPolicyPage";
import TermsPage from "./pages/TermsPage";
import AdminCategoriesPage from "./pages/AdminCategoriesPage";
import AdminCreateCategoryPage from "./pages/AdminCreateCategoryPage";
import AdminEditCategoryPage from "./pages/AdminEditCategoryPage";
import AdminPlacementsPage from "./pages/AdminPlacementsPage";
import AdminCreatePlacementPage from "./pages/AdminCreatePlacementPage";
import AdminEditPlacementPage from "./pages/AdminEditPlacementPage";
import NotFoundPage from "./pages/NotFoundPage";

export default function App() {

  function PublicWhatsAppButton() {
  const location = useLocation();

  if (location.pathname.startsWith("/admin")) {
    return null;
  }

  return <FloatingWhatsAppButton />;
}


  return (
    <AdminAuthProvider>
      <div className="min-h-screen bg-slate-50">
        <Routes>
          {/* Public */}
          <Route path="/" element={<IssuesPage />} />
          <Route path="/issues" element={<IssuesIndexPage />} />
          <Route path="/issues/:slug" element={<IssueReaderPage />} />
          <Route path="/stories" element={<StoriesIndexPage />} />
          <Route
            path="/stories/category/:categorySlug"
            element={<CategoryStoriesPage />}
          />
          <Route path="/stories/:slug" element={<StoryPage />} />
          <Route path="/about" element={<AboutPage />} />
          <Route path="/contact" element={<ContactPage />} />
          <Route path="/advertise" element={<AdvertisePage />} />
          <Route path="/privacy-policy" element={<PrivacyPolicyPage />} />
          <Route path="/terms" element={<TermsPage />} />
          

          {/* Admin login */}
          <Route path="/admin/login" element={<AdminLoginPage />} />

          {/* Protected admin */}
          <Route element={<ProtectedAdminRoute />}>
              <Route path="/admin" element={<AdminLayout />}>
              <Route index element={<AdminDashboardPage />} />
              <Route path="upload" element={<AdminUploadPage />} />
              <Route path="issues" element={<AdminIssuesPage />} />
              <Route path="issues/:id/edit" element={<AdminEditIssuePage />} />
              <Route path="stories" element={<AdminStoriesPage />} />
              <Route path="stories/create" element={<AdminCreateStoryPage />} />
              <Route path="stories/:id/edit" element={<AdminEditStoryPage />} />
              <Route path="stories/media" element={<AdminStoryMediaPage />} />
              <Route path="/admin/analytics" element={<AdminAnalyticsPage />} />
              <Route path="/admin/subscribers" element={<AdminSubscribersPage />} />
              <Route path="/admin/categories" element={<AdminCategoriesPage />} />
              <Route path="/admin/categories/create" element={<AdminCreateCategoryPage />} />
              <Route path="/admin/categories/:id/edit" element={<AdminEditCategoryPage />} />
              <Route path="/admin/placements" element={<AdminPlacementsPage />} />
              <Route path="/admin/placements/create" element={<AdminCreatePlacementPage />} />
              <Route path="/admin/placements/:id/edit" element={<AdminEditPlacementPage />} />

            </Route>
          </Route>
          <Route path="*" element={<NotFoundPage />} />
        </Routes>
         <PublicWhatsAppButton />
      </div>
    </AdminAuthProvider>
  );
}
import { Suspense } from "react";
import { Navigate, Route, Routes, useRoutes } from "react-router-dom";
import routes from "tempo-routes";
import LoginForm from "./components/auth/LoginForm";
import SignUpForm from "./components/auth/SignUpForm";
import ForgotPasswordForm from "./components/auth/ForgotPasswordForm";
import ResetPasswordForm from "./components/auth/ResetPasswordForm";
import AuthHandler from "./components/auth/AuthHandler";
import Dashboard from "./components/pages/dashboard";
import Success from "./components/pages/success";
import Home from "./components/pages/home";
import AdminPanel from "./components/pages/admin-panel";
import AssignCompany from "./components/pages/assign-company";
import { AuthProvider, useAuth } from "../supabase/auth";
import { Toaster } from "./components/ui/toaster";
import { LoadingScreen, LoadingSpinner } from "./components/ui/loading-spinner";

// Company Pages
import Companies from "./components/pages/companies";
import CompanyFormPage from "./components/pages/company-form";
import CompanyDetail from "./components/pages/company-detail";

// Project Pages
import Projects from "./components/pages/projects";
import ProjectFormPage from "./components/pages/project-form";
import ProjectDetail from "./components/pages/project-detail";

// Task Pages
import Tasks from "./components/pages/tasks";
import TaskFormPage from "./components/pages/task-form";
import TaskDetail from "./components/pages/task-detail";

// Client Pages
import ClientDashboardPage from "./components/pages/client-dashboard";
import ClientProjectDetail from "./components/client/ClientProjectDetail";
import ClientTaskDetail from "./components/client/ClientTaskDetail";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const { user, loading } = useAuth();

  if (loading) {
    return <LoadingScreen text="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  return <>{children}</>;
}

function AdminRoute({ children }: { children: React.ReactNode }) {
  const { user, loading, isAdmin } = useAuth();

  if (loading) {
    return <LoadingScreen text="Authenticating..." />;
  }

  if (!user) {
    return <Navigate to="/" />;
  }

  // Allow access to admin panel even if not admin, the component will handle showing the make-admin UI
  return <>{children}</>;
}

function AppRoutes() {
  return (
    <>
      <Routes>
        <Route path="/" element={<Home />} />
        <Route path="/login" element={<LoginForm />} />
        <Route path="/signup" element={<SignUpForm />} />
        <Route path="/forgot-password" element={<ForgotPasswordForm />} />
        <Route path="/reset-password" element={<ResetPasswordForm />} />
        <Route path="/auth" element={<AuthHandler />} />
        <Route
          path="/dashboard"
          element={
            <PrivateRoute>
              <Dashboard />
            </PrivateRoute>
          }
        />
        <Route
          path="/admin"
          element={
            <AdminRoute>
              <AdminPanel />
            </AdminRoute>
          }
        />
        <Route
          path="/admin/assign-company/:userId"
          element={
            <AdminRoute>
              <AssignCompany />
            </AdminRoute>
          }
        />
        <Route path="/success" element={<Success />} />

        {/* Client Dashboard */}
        <Route
          path="/client"
          element={
            <PrivateRoute>
              <ClientDashboardPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/client/projects/:projectId"
          element={
            <PrivateRoute>
              <ClientProjectDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/client/tasks/:taskId"
          element={
            <PrivateRoute>
              <ClientTaskDetail />
            </PrivateRoute>
          }
        />

        {/* Company routes */}
        <Route
          path="/companies"
          element={
            <PrivateRoute>
              <Companies />
            </PrivateRoute>
          }
        />
        <Route
          path="/companies/new"
          element={
            <PrivateRoute>
              <CompanyFormPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/companies/:id"
          element={
            <PrivateRoute>
              <CompanyDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/companies/:id/edit"
          element={
            <PrivateRoute>
              <CompanyFormPage />
            </PrivateRoute>
          }
        />

        {/* Project routes */}
        <Route
          path="/projects"
          element={
            <PrivateRoute>
              <Projects />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/new"
          element={
            <PrivateRoute>
              <ProjectFormPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id"
          element={
            <PrivateRoute>
              <ProjectDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:id/edit"
          element={
            <PrivateRoute>
              <ProjectFormPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/projects/:projectId/tasks/new"
          element={
            <PrivateRoute>
              <TaskFormPage />
            </PrivateRoute>
          }
        />

        {/* Task routes */}
        <Route
          path="/tasks"
          element={
            <PrivateRoute>
              <Tasks />
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks/new"
          element={
            <PrivateRoute>
              <TaskFormPage />
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks/:id"
          element={
            <PrivateRoute>
              <TaskDetail />
            </PrivateRoute>
          }
        />
        <Route
          path="/tasks/:id/edit"
          element={
            <PrivateRoute>
              <TaskFormPage />
            </PrivateRoute>
          }
        />
      </Routes>
      {import.meta.env.VITE_TEMPO === "true" && useRoutes(routes)}
    </>
  );
}

function App() {
  return (
    <AuthProvider>
      <Suspense fallback={<LoadingScreen text="Loading application..." />}>
        <AppRoutes />
      </Suspense>
      <Toaster />
    </AuthProvider>
  );
}

export default App;

import { Routes, Route, Navigate } from "react-router-dom";
import { useAuthStore } from "./store/authStore";
import Layout from "./components/layout/Layout";
import LoginPage from "./pages/LoginPage";
import DashboardPage from "./pages/DashboardPage";
import RepositoryPage from "./pages/RepositoryPage";
import ChatPage from "./pages/ChatPage";
import SummaryPage from "./pages/SummaryPage";
import DecisionPage from "./pages/DecisionPage";
import AnalyticsPage from "./pages/AnalyticsPage";
import UsersPage from "./pages/UsersPage";

function PrivateRoute({ children }: { children: React.ReactNode }) {
  const token = useAuthStore((s) => s.token);
  return token ? <>{children}</> : <Navigate to="/login" replace />;
}

export default function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route
        path="/"
        element={
          <PrivateRoute>
            <Layout />
          </PrivateRoute>
        }
      >
        <Route index element={<DashboardPage />} />
        <Route path="repository" element={<RepositoryPage />} />
        <Route path="chat" element={<ChatPage />} />
        <Route path="summary" element={<SummaryPage />} />
        <Route path="decision" element={<DecisionPage />} />
        <Route path="analytics" element={<AnalyticsPage />} />
        <Route path="users" element={<UsersPage />} />
      </Route>
    </Routes>
  );
}
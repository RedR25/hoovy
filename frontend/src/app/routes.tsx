import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/users/pages/RegisterPage";
import { ProfilePage } from "@/features/users/pages/ProfilePage";
import { RequireAuth } from "@/features/auth/RequireAuth";
import { PlaygroundPage } from "@/features/scenarios/pages/PlaygroundPage";
import { ScenarioPage } from "@/features/scenarios/pages/ScenarioPage";
import { AuthorPage } from "@/features/author/pages/AuthorPage";
import { KidsPage } from "@/features/kids/pages/KidsPage";
import { ProgressPage } from "@/features/progress/pages/ProgressPage";

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<PlaygroundPage />} />
    <Route path="/scenario/:scenarioId" element={<ScenarioPage />} />
    <Route path="/author" element={<AuthorPage />} />
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route
      path="/kids"
      element={
        <RequireAuth>
          <KidsPage />
        </RequireAuth>
      }
    />
    <Route
      path="/progress"
      element={
        <RequireAuth>
          <ProgressPage />
        </RequireAuth>
      }
    />
    <Route
      path="/me"
      element={
        <RequireAuth>
          <ProfilePage />
        </RequireAuth>
      }
    />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

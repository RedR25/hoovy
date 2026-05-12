import { Navigate, Route, Routes } from "react-router-dom";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { RegisterPage } from "@/features/users/pages/RegisterPage";
import { ProfilePage } from "@/features/users/pages/ProfilePage";
import { RequireAuth } from "@/features/auth/RequireAuth";

export const AppRoutes = () => (
  <Routes>
    <Route path="/login" element={<LoginPage />} />
    <Route path="/register" element={<RegisterPage />} />
    <Route
      path="/me"
      element={
        <RequireAuth>
          <ProfilePage />
        </RequireAuth>
      }
    />
    <Route path="*" element={<Navigate to="/me" replace />} />
  </Routes>
);

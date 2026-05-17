import { Navigate, Route, Routes } from "react-router-dom";
import { WelcomePage } from "@/features/welcome/pages/WelcomePage";
import { PlaygroundPage } from "@/features/scenarios/pages/PlaygroundPage";
import { ScenarioPage } from "@/features/scenarios/pages/ScenarioPage";
import { AuthorPage } from "@/features/author/pages/AuthorPage";
import { ProgressPage } from "@/features/progress/pages/ProgressPage";

export const AppRoutes = () => (
  <Routes>
    <Route path="/" element={<WelcomePage />} />
    <Route path="/episodes" element={<PlaygroundPage />} />
    <Route path="/scenario/:scenarioId" element={<ScenarioPage />} />
    <Route path="/author" element={<AuthorPage />} />
    <Route path="/progress" element={<ProgressPage />} />
    <Route path="*" element={<Navigate to="/" replace />} />
  </Routes>
);

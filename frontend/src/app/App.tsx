import { AppProviders } from "@/providers/AppProviders";
import { AppRoutes } from "@/app/routes";

export const App = () => (
  <AppProviders>
    <AppRoutes />
  </AppProviders>
);

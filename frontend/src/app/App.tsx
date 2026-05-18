import { AppProviders } from "@/providers/AppProviders";
import { AppRoutes } from "@/app/routes";
import { CustomScrollbar } from "@/components/ui/CustomScrollbar";

export const App = () => (
  <AppProviders>
    <AppRoutes />
    <CustomScrollbar />
  </AppProviders>
);

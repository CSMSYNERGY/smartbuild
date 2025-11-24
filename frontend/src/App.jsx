// App.jsx
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";
import { MantineProvider, createTheme } from "@mantine/core";

import Home from "./pages/Home.jsx";
import Subscription from "./pages/Subscription.jsx";
import Configuration from "./pages/Configuration.jsx";
import PublicLanding from "./pages/public/PublicLanding.jsx";

import PublicLayout from "./layouts/PublicLayout.jsx";
import PrivateLayout from "./layouts/PrivateLayout.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";

const theme = createTheme({
  fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  primaryColor: "indigo",
  headings: { fontWeight: 600 },
});

// Private branch wrapper so AuthProvider only applies there
function PrivateBranch() {
  return (
    <AuthProvider>
      <PrivateLayout />
    </AuthProvider>
  );
}

function App() {
  return (
    <BrowserRouter basename="/app">
      <MantineProvider theme={theme} defaultColorScheme="light">
        <Routes>
          {/* PUBLIC: /app/public/* → no AuthProvider, no HeaderNav */}
          <Route path="/public" element={<PublicLayout />}>
            <Route index element={<PublicLanding />} />
            {/* e.g. <Route path="callback" element={<OAuthCallback />} /> */}
          </Route>

          {/* PRIVATE: everything else → AuthProvider + HeaderNav + AppShell */}
          <Route path="/*" element={<PrivateBranch />}>
            <Route path="home" element={<Home />} />
            <Route path="subscription" element={<Subscription />} />
            <Route path="configuration" element={<Configuration />} />
            <Route path="*" element={<Navigate to="home" replace />} />
          </Route>
        </Routes>
      </MantineProvider>
    </BrowserRouter>
  );
}

export default App;

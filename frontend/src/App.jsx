import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import {
  ActionIcon,
  AppShell,
  Anchor,
  Container,
  Group,
  MantineProvider,
  Title,
  Text,
  createTheme,
  rem,
} from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import Home from "./pages/Home.jsx";
import Subscription from "./pages/Subscription.jsx";
import Configuration from "./pages/Configuration.jsx";
import { AuthProvider, useAuth } from "./context/AuthProvider.jsx";

const theme = createTheme({
  fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  primaryColor: "indigo",
  headings: { fontWeight: 600 },
});

function HeaderNav() {
  const location = useLocation();
  const { user } = useAuth();
  const links = [
    { to: "/home", label: "Home" },
    { to: "/subscription", label: "Subscription" },
    { to: "/configuration", label: "Configuration" },
  ];
  const isEmbedded =
    typeof window !== "undefined" && window.self !== window.top;

  return (
    <Group
      h="100%"
      px="md"
      justify="space-between"
      style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
    >
      <Title order={4} fw={700}>
        SmartBuild Integrations
      </Title>
      <Group gap="md" align="center">
        {links.map((link) => {
          const isActive = location.pathname === link.to;
          return (
            <Anchor
              key={link.to}
              component={Link}
              to={link.to}
              size="sm"
              fw={isActive ? 700 : 500}
              c={isActive ? "indigo.6" : "dark.3"}
              underline="never"
            >
              {link.label}
            </Anchor>
          );
        })}
        {user && (
          <Text size="sm" c="dimmed" style={{ marginLeft: "1rem" }}>
            Logged in as {user.userName}
          </Text>
        )}
        {isEmbedded && (
          <ActionIcon
            variant="subtle"
            color="indigo"
            aria-label="Open in new tab"
            onClick={() => {
              const appUrl = `${window.location.origin}/app/home`;
              window.open(appUrl, "_blank", "noopener,noreferrer");
            }}
          >
            <IconExternalLink stroke={1.8} size="1.25rem" />
          </ActionIcon>
        )}
      </Group>
    </Group>
  );
}

function App() {
  return (
    <BrowserRouter basename="/app">
      <MantineProvider theme={theme} defaultColorScheme="light">
        <AppShell
          header={{ height: rem(64) }}
          padding="lg"
          styles={{
            main: {
              backgroundColor: "var(--mantine-color-gray-0)",
            },
          }}
        >
          <AuthProvider>
            <AppShell.Header>
              <HeaderNav />
            </AppShell.Header>
            <AppShell.Main>
              <Container size="lg" py="lg">
                <Routes>
                  <Route path="/home" element={<Home />} />
                  <Route path="/subscription" element={<Subscription />} />
                  <Route path="/configuration" element={<Configuration />} />
                  <Route path="*" element={<Navigate to="/home" replace />} />
                </Routes>
              </Container>
            </AppShell.Main>
          </AuthProvider>
        </AppShell>
      </MantineProvider>
    </BrowserRouter>
  );
}

export default App;

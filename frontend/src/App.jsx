import {
  BrowserRouter,
  Routes,
  Route,
  Link,
  Navigate,
  useLocation,
} from "react-router-dom";
import {
  AppShell,
  Anchor,
  Container,
  Group,
  MantineProvider,
  Title,
  createTheme,
  rem,
} from "@mantine/core";
import Home from "./pages/Home.jsx";
import { AuthProvider } from "./context/AuthProvider.jsx";

const theme = createTheme({
  fontFamily: "Inter, system-ui, -apple-system, BlinkMacSystemFont, sans-serif",
  primaryColor: "indigo",
  headings: { fontWeight: 600 },
});

function HeaderNav() {
  const location = useLocation();
  const links = [{ to: "/home", label: "Home" }];

  return (
    <Group
      h="100%"
      px="md"
      justify="space-between"
      style={{ borderBottom: "1px solid var(--mantine-color-gray-3)" }}
    >
      <Title order={4} fw={700}>
        SmartBuild Console
      </Title>
      <Group gap="md">
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
          <AppShell.Header>
            <HeaderNav />
          </AppShell.Header>
          <AppShell.Main>
            <AuthProvider>
              <Container size="lg" py="lg">
                <Routes>
                  <Route path="/home" element={<Home />} />
                  <Route path="*" element={<Navigate to="/home" replace />} />
                </Routes>
              </Container>
            </AuthProvider>
          </AppShell.Main>
        </AppShell>
      </MantineProvider>
    </BrowserRouter>
  );
}

export default App;

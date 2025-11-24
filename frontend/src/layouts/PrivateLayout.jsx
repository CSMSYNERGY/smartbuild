// layouts/PrivateLayout.jsx
import { Outlet } from "react-router-dom";
import { AppShell, Container, rem } from "@mantine/core";
import HeaderNav from "../components/header-nav/HeaderNav.jsx";

export default function PrivateLayout() {
  return (
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
        <Container size="lg" py="lg">
          <Outlet />
        </Container>
      </AppShell.Main>
    </AppShell>
  );
}

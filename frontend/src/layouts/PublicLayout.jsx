// layouts/PublicLayout.jsx
import { Outlet } from "react-router-dom";
import { Container } from "@mantine/core";

export default function PublicLayout() {
  return (
    <Container size="lg" py="lg">
      <Outlet />
    </Container>
  );
}

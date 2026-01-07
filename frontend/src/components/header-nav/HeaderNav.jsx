// components/HeaderNav.jsx
import { Link, useLocation } from "react-router-dom";
import { ActionIcon, Anchor, Group, Title, Text } from "@mantine/core";
import { IconExternalLink } from "@tabler/icons-react";
import { useAuth } from "../../context/AuthProvider.jsx";

export default function HeaderNav() {
  const location = useLocation();
  const { user } = useAuth();

  const links = [
    { to: "/home", label: "Home" },
    { to: "/subscription", label: "Subscription" },
    { to: "/smartbuild", label: "Smart Build" },
    { to: "/mappers", label: "Mappers" },
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
        Construction Platform Integrations
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

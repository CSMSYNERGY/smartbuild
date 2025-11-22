import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Paper,
  Stack,
  Text,
  Title,
} from "@mantine/core";
import { IconAlertCircle, IconCheck, IconX } from "@tabler/icons-react";
import { useAuth } from "../context/AuthProvider";
import { Link } from "react-router-dom";

export default function Home() {
  const { user, entitlement } = useAuth();

  const isSubscribed = entitlement?.status === "active";

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={2}>Welcome, {user?.userName || "User"}!</Title>
        <Text c="dimmed">
          Manage your SmartBuild integrations and subscriptions from this
          dashboard.
        </Text>
      </Stack>

      {!isSubscribed && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Subscription Required"
          color="orange"
          variant="light"
        >
          <Text size="sm" mb="md">
            You need to subscribe to start using this application. Subscription
            management can be done via the{" "}
            <Text component="span" fw={600}>
              Subscription
            </Text>{" "}
            page.
          </Text>
          <Button
            component={Link}
            to="/subscription"
            variant="light"
            color="orange"
          >
            Go to Subscription
          </Button>
        </Alert>
      )}

      {isSubscribed && (
        <Alert
          icon={<IconCheck size="1rem" />}
          title="Subscription Active"
          color="green"
          variant="light"
        >
          Your subscription is active and you have full access to all features.
        </Alert>
      )}

      <Paper withBorder shadow="sm" radius="lg" p="lg">
        <Stack gap="md">
          <Title order={3}>About SmartBuild</Title>
          <Text>
            SmartBuild is a powerful integration platform that connects your
            GoHighLevel account with various construction and project management
            tools. Streamline your workflow and automate your business processes
            with our comprehensive suite of integrations.
          </Text>

          <Group gap="md" mt="md">
            <Card withBorder radius="md" p="md" style={{ flex: 1 }}>
              <Stack gap="xs">
                <Text fw={600} size="sm">
                  Seamless Integration
                </Text>
                <Text size="sm" c="dimmed">
                  Connect your GoHighLevel account with ease and start
                  automating workflows in minutes.
                </Text>
              </Stack>
            </Card>

            <Card withBorder radius="md" p="md" style={{ flex: 1 }}>
              <Stack gap="xs">
                <Text fw={600} size="sm">
                  Real-time Sync
                </Text>
                <Text size="sm" c="dimmed">
                  Keep your data synchronized across all platforms in real-time
                  for accurate reporting and management.
                </Text>
              </Stack>
            </Card>

            <Card withBorder radius="md" p="md" style={{ flex: 1 }}>
              <Stack gap="xs">
                <Text fw={600} size="sm">
                  Secure & Reliable
                </Text>
                <Text size="sm" c="dimmed">
                  Enterprise-grade security ensures your data is protected at
                  all times.
                </Text>
              </Stack>
            </Card>
          </Group>
        </Stack>
      </Paper>

      <Paper withBorder shadow="sm" radius="lg" p="lg">
        <Stack gap="sm">
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600}>Account Information</Text>
              <Text size="sm" c="dimmed">
                Your current account details and subscription status.
              </Text>
            </div>
            <Badge
              color={isSubscribed ? "green" : "gray"}
              variant="light"
              size="lg"
            >
              {isSubscribed ? "Active" : "Inactive"}
            </Badge>
          </Group>
          <Group gap="md" mt="sm">
            <div>
              <Text size="xs" c="dimmed">
                Email
              </Text>
              <Text size="sm" fw={500}>
                {user?.email}
              </Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">
                Role
              </Text>
              <Text size="sm" fw={500}>
                {user?.role}
              </Text>
            </div>
            <div>
              <Text size="xs" c="dimmed">
                Type
              </Text>
              <Text size="sm" fw={500}>
                {user?.type}
              </Text>
            </div>
          </Group>
        </Stack>
      </Paper>
    </Stack>
  );
}

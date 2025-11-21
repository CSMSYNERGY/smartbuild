// frontend/src/pages/Subscribe.jsx
import { Group, Paper, Stack, Text, Title, List, ThemeIcon } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";
import { useAuth } from "../context/AuthProvider";
import PaymentForm from "../components/PaymentForm";

export default function Subscribe() {
  const { user } = useAuth();
  // user: { id, email, companyId, locationId, userName, role, type }

  return (
    <Stack gap="lg">
      <Title order={2}>Subscribe to SmartBuild</Title>

      <Paper withBorder shadow="sm" radius="lg" p="lg">
        <Group align="flex-start" justify="space-between" gap="xl" wrap="wrap">
          {/* Left side: plan summary */}
          <Stack gap="sm" style={{ flex: 1, minWidth: 260 }}>
            <Text fw={600} size="lg">
              {planName}
            </Text>
            <Text fw={700} c="blue.6" size="xl">
              {priceText}
            </Text>
            <Text size="sm" c="dimmed">
              Billed monthly. You can cancel anytime from your billing page.
            </Text>

            <List
              spacing="xs"
              size="sm"
              center
              icon={
                <ThemeIcon color="blue" size={20} radius="xl">
                  <IconCheck size={14} />
                </ThemeIcon>
              }
              mt="md"
            >
              <List.Item>Full access to SmartBuild features</List.Item>
              <List.Item>Priority support</List.Item>
              <List.Item>Usage tied to your GHL location</List.Item>
            </List>

            <Text size="xs" c="dimmed" mt="md">
              Subscription will be linked to:
              <br />
              <strong>User ID:</strong> {user?.id || "—"} <br />
              <strong>Location ID:</strong> {user?.locationId || "—"}
            </Text>
          </Stack>

          {/* Right side: payment form */}
          <div style={{ flex: 1.1, minWidth: 320 }}>
            <PaymentForm
              user={user}
              planId="CPI_MONTHLY" // your internal plan id
            />
          </div>
        </Group>
      </Paper>
    </Stack>
  );
}

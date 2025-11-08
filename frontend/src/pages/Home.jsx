import { Code, Group, Paper, Stack, Text, Title } from "@mantine/core";
import { useAuth } from "../context/AuthProvider";

export default function Home() {
  const { user } = useAuth();

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={2}>Connected account</Title>
        <Text c="dimmed">
          Review the authenticated SmartBuild user pulled from GoHighLevel.
        </Text>
      </Stack>

      {user ? (
        <Paper withBorder shadow="sm" radius="lg" p="lg">
          <Stack gap="sm">
            <Group justify="space-between" align="flex-start">
              <div>
                <Text fw={600}>Session payload</Text>
                <Text size="sm" c="dimmed">
                  These values are stored in your secure session cookie.
                </Text>
              </div>
            </Group>
            <Code
              block
              fz="sm"
              style={{
                whiteSpace: "pre-wrap",
                wordBreak: "break-word",
                fontFamily: "Menlo, Monaco, Consolas, monospace",
              }}
            >
              {JSON.stringify(user, null, 2)}
            </Code>
          </Stack>
        </Paper>
      ) : (
        <Paper withBorder radius="lg" p="lg" shadow="xs">
          <Text c="dimmed">
            No authenticated user detected. Use the SmartBuild embed to connect
            your account.
          </Text>
        </Paper>
      )}
    </Stack>
  );
}

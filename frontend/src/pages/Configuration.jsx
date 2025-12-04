import { Paper, Stack, Text, Title } from "@mantine/core";

export default function Configuration() {
  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={2}>Configuration</Title>
        <Text c="dimmed">
          Configure your integration settings and preferences.
        </Text>
      </Stack>

      <Paper withBorder shadow="sm" radius="lg" p="lg">
        <Stack gap="md">
          <Text>Configuration options will be available here soon.</Text>
        </Stack>
      </Paper>
    </Stack>
  );
}


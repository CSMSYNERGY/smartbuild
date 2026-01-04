import { Paper, Stack, Text, Title } from "@mantine/core";

export default function Mappers() {
  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={2}>Mappers</Title>
        <Text c="dimmed">
          Configure your mappers and preferences.
        </Text>
      </Stack>

      <Paper withBorder shadow="sm" radius="lg" p="lg">
        <Stack gap="md">
          <Text>Mappers options will be available here soon.</Text>
        </Stack>
      </Paper>
    </Stack>
  );
}


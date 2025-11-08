import { Center, Loader, Paper, Stack, Text } from "@mantine/core";

export default function LoadingScreen() {
  return (
    <Center mih="100vh">
      <Paper withBorder shadow="md" radius="lg" p="xl">
        <Stack align="center" gap="sm">
          <Loader color="indigo" size="lg" />
          <Text size="sm" c="dimmed" ta="center" maw={260}>
            Please wait while we verify your GoHighLevel session.
          </Text>
        </Stack>
      </Paper>
    </Center>
  );
}

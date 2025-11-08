import {
  Alert,
  Button,
  Center,
  Container,
  Stack,
  Text,
  Title,
} from "@mantine/core";

export default function AuthError({ error, onRetry }) {
  return (
    <Center mih="70vh">
      <Container size={460}>
        <Stack gap="lg" align="center">
          <Title order={2}>Authentication error</Title>
          <Alert
            variant="light"
            color="red"
            radius="md"
            title="We couldn't verify your session"
            w="100%"
          >
            <Text size="sm">{error}</Text>
          </Alert>
          {onRetry && (
            <Button onClick={onRetry} size="md">
              Retry
            </Button>
          )}
        </Stack>
      </Container>
    </Center>
  );
}
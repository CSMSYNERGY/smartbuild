import {
  Alert,
  Button,
  Center,
  Container,
  Stack,
  Text,
  Title,
} from "@mantine/core";

export default function PublicError({ errorTitle, errorMessage, errorCode }) {
  return (
    <Center mih="70vh">
      <Container size={460}>
        <Stack gap="lg" align="center" justify="center">
          <Alert
            variant="light"
            color="red"
            radius="md"
            title={errorTitle}
            align="start"
            w="100%"
          >
            <Text size="md">{errorMessage}</Text>
            <Text size="xs">Error Code: {errorCode}</Text>
          </Alert>
        </Stack>
      </Container>
    </Center>
  );
}

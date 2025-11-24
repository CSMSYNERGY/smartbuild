// src/pages/public/LocationAuthSuccess.jsx
import { Alert, Text, Title } from "@mantine/core";
import { IconCheck } from "@tabler/icons-react";

export default function PublicSuccess({ successTitle, successMessage }) {
  return (
    <>
      <Title order={2} mb="sm">
        Success!
      </Title>

      <Alert
        icon={<IconCheck size={18} />}
        color="green"
        radius="md"
        mb="lg"
        title={successTitle}
      >
        <Text size="sm">{successMessage}</Text>
      </Alert>
    </>
  );
}

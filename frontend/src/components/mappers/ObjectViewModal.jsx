import {
  Modal,
  Stack,
  Text,
  Paper,
  Group,
  Button,
  Loader,
  Alert,
  Badge,
  Divider,
} from "@mantine/core";
import { IconEye, IconAlertCircle, IconTrash } from "@tabler/icons-react";

// Convert camelCase to Title Case (e.g., "contactName" -> "Contact Name")
const formatFieldName = (fieldName) => {
  if (!fieldName) return "";
  return fieldName
    .replace(/([A-Z])/g, " $1") // Add space before uppercase letters
    .replace(/^./, (str) => str.toUpperCase()) // Capitalize first letter
    .trim();
};

// Format field value for display
const formatFieldValue = (value) => {
  if (value === null || value === undefined) return "-";
  if (typeof value === "boolean") return value ? "Yes" : "No";
  if (typeof value === "object") return JSON.stringify(value);
  return String(value);
};

export default function ObjectViewModal({
  opened,
  onClose,
  typeLabel,
  objectKey,
  availableFields,
  objectData,
  loading,
  onDelete,
}) {
  const hasError = objectData?.error;

  return (
    <Modal
      opened={opened}
      onClose={onClose}
      title={
        <Group gap="xs">
          <IconEye size={20} />
          <Text fw={600}>View {typeLabel}</Text>
        </Group>
      }
      size="lg"
    >
      {loading ? (
        <Stack align="center" py="xl">
          <Loader />
          <Text c="dimmed">Loading {typeLabel?.toLowerCase()}...</Text>
        </Stack>
      ) : hasError ? (
        <Stack gap="md">
          <Alert
            icon={<IconAlertCircle size="1rem" />}
            title="Object Not Found"
            color="red"
            variant="light"
          >
            {objectData.error}
          </Alert>
          <Text size="sm" c="dimmed">
            The referenced object may have been deleted or is no longer accessible.
          </Text>
          <Group justify="flex-end" mt="md">
            {onDelete && (
              <Button
                variant="light"
                color="red"
                leftSection={<IconTrash size={16} />}
                onClick={onDelete}
              >
                Delete Mapping
              </Button>
            )}
            <Button variant="light" onClick={onClose}>
              Close
            </Button>
          </Group>
        </Stack>
      ) : (
        <Stack gap="md">
          <Paper withBorder p="md" radius="md">
            <Stack gap="sm">
              {availableFields?.map((field, index) => {
                const value = objectData?.[field];
                const isKeyField = field === objectKey;

                return (
                  <div key={field}>
                    {index > 0 && <Divider mb="sm" />}
                    <Group justify="space-between" align="flex-start">
                      <Group gap="xs">
                        <Text size="sm" c="dimmed">
                          {formatFieldName(field)}
                        </Text>
                        {isKeyField && (
                          <Badge size="xs" variant="light" color="blue">
                            Key
                          </Badge>
                        )}
                      </Group>
                      <Text
                        size="sm"
                        fw={isKeyField ? 600 : 500}
                        ff={isKeyField ? "monospace" : undefined}
                        style={{ textAlign: "right", maxWidth: "60%" }}
                      >
                        {formatFieldValue(value)}
                      </Text>
                    </Group>
                  </div>
                );
              })}
            </Stack>
          </Paper>
          <Group justify="flex-end">
            <Button variant="light" onClick={onClose}>
              Close
            </Button>
          </Group>
        </Stack>
      )}
    </Modal>
  );
}


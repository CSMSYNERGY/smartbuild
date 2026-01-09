import { Group, TextInput, Stack, ActionIcon, Tooltip } from "@mantine/core";
import { IconCheck, IconX } from "@tabler/icons-react";
import { useMemo } from "react";

/**
 * Input fields for value properties - used for both adding new mappings and editing existing ones
 */
export default function ValuePropertiesInput({
  objectConfiguration,
  values,
  onChange,
  onSave,
  onCancel,
  saving,
  isEditMode = false,
}) {
  // Sort property keys by their numeric values
  const sortedPropertyKeys = useMemo(() => {
    return Object.keys(objectConfiguration || {}).sort(
      (a, b) => Number(objectConfiguration[a]) - Number(objectConfiguration[b])
    );
  }, [objectConfiguration]);

  const handleChange = (propKey, value) => {
    onChange({ ...values, [propKey]: value });
  };

  const handleKeyDown = (e) => {
    if (isEditMode) {
      if (e.key === "Enter") onSave?.();
      if (e.key === "Escape") onCancel?.();
    }
  };

  if (isEditMode) {
    return (
      <Stack gap="xs">
        {sortedPropertyKeys.map((propKey) => (
          <TextInput
            key={propKey}
            label={`${propKey} (${objectConfiguration[propKey]})`}
            size="sm"
            value={values[propKey] || ""}
            onChange={(e) => handleChange(propKey, e.currentTarget.value)}
            onKeyDown={handleKeyDown}
          />
        ))}
        <Group justify="flex-end" gap="xs">
          <Tooltip label="Save">
            <ActionIcon
              color="green"
              variant="filled"
              size="md"
              onClick={onSave}
              loading={saving}
            >
              <IconCheck size={16} />
            </ActionIcon>
          </Tooltip>
          <Tooltip label="Cancel">
            <ActionIcon
              color="gray"
              variant="light"
              size="md"
              onClick={onCancel}
            >
              <IconX size={16} />
            </ActionIcon>
          </Tooltip>
        </Group>
      </Stack>
    );
  }

  // Add mode - horizontal layout
  return (
    <Group grow>
      {sortedPropertyKeys.map((propKey) => (
        <TextInput
          key={propKey}
          label={`${propKey} (${objectConfiguration[propKey]})`}
          placeholder={`Enter ${propKey}...`}
          value={values[propKey] || ""}
          onChange={(e) => handleChange(propKey, e.currentTarget.value)}
        />
      ))}
    </Group>
  );
}


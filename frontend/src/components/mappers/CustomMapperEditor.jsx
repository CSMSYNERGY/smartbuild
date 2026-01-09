import {
  Group,
  TextInput,
  Button,
  Stack,
  Text,
  ActionIcon,
  Paper,
  Box,
  Tooltip,
  Badge,
} from "@mantine/core";
import { IconPlus, IconX, IconEdit, IconCheck, IconArrowRight } from "@tabler/icons-react";
import { useState, useMemo } from "react";

export default function CustomMapperEditor({
  mapper,
  objectConfiguration,
  onAddKeyValue,
  onUpdateValue,
  onRemoveKey,
  saving,
}) {
  const [customKey, setCustomKey] = useState("");
  const [valueInputs, setValueInputs] = useState({});
  const [editingKey, setEditingKey] = useState(null);
  const [editingValues, setEditingValues] = useState({});

  const propertyKeys = useMemo(
    () => Object.keys(objectConfiguration || {}),
    [objectConfiguration]
  );

  const handleValueInputChange = (propKey, value) => {
    setValueInputs((prev) => ({ ...prev, [propKey]: value }));
  };

  const handleAdd = () => {
    if (!customKey.trim()) {
      return;
    }

    // Check if all properties have values
    const hasAllValues = propertyKeys.every(
      (key) => valueInputs[key]?.trim()
    );
    if (!hasAllValues) {
      return;
    }

    if (mapper.map && customKey.trim() in mapper.map) {
      return;
    }

    // Build value object
    const valueObject = {};
    propertyKeys.forEach((key) => {
      valueObject[key] = valueInputs[key].trim();
    });

    onAddKeyValue(customKey.trim(), valueObject);
    setCustomKey("");
    setValueInputs({});
  };

  const handleStartEdit = (key, currentValue) => {
    setEditingKey(key);
    setEditingValues(currentValue || {});
  };

  const handleSaveEdit = () => {
    const hasAllValues = propertyKeys.every(
      (key) => editingValues[key]?.trim()
    );
    if (!hasAllValues) {
      return;
    }

    const valueObject = {};
    propertyKeys.forEach((key) => {
      valueObject[key] = editingValues[key].trim();
    });

    onUpdateValue(editingKey, valueObject);
    setEditingKey(null);
    setEditingValues({});
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditingValues({});
  };

  const handleEditValueChange = (propKey, value) => {
    setEditingValues((prev) => ({ ...prev, [propKey]: value }));
  };

  const isAddDisabled =
    !customKey.trim() ||
    !propertyKeys.every((key) => valueInputs[key]?.trim());

  return (
    <>
      {/* Add New Mapping */}
      <Paper
        p="md"
        radius="md"
        style={{
          background:
            "linear-gradient(135deg, var(--mantine-color-blue-0) 0%, var(--mantine-color-grape-0) 100%)",
        }}
      >
        <Stack gap="md">
          <TextInput
            label="Key"
            placeholder="Enter mapping key..."
            value={customKey}
            onChange={(e) => setCustomKey(e.currentTarget.value)}
          />
          <Group grow>
            {propertyKeys.map((propKey) => (
              <TextInput
                key={propKey}
                label={objectConfiguration[propKey] || propKey}
                placeholder={`Enter ${propKey}...`}
                value={valueInputs[propKey] || ""}
                onChange={(e) =>
                  handleValueInputChange(propKey, e.currentTarget.value)
                }
              />
            ))}
          </Group>
          <Group justify="flex-end">
            <Button
              leftSection={<IconPlus size={16} />}
              onClick={handleAdd}
              loading={saving}
              disabled={isAddDisabled}
            >
              Add Mapping
            </Button>
          </Group>
        </Stack>
      </Paper>

      {/* Mappings List */}
      <Stack gap="sm" mt="lg">
        <Group justify="space-between" mb="xs">
          <Text
            size="sm"
            fw={600}
            c="dimmed"
            tt="uppercase"
            style={{ letterSpacing: 0.5 }}
          >
            Key
          </Text>
          <Text
            size="sm"
            fw={600}
            c="dimmed"
            tt="uppercase"
            style={{ letterSpacing: 0.5 }}
          >
            Values
          </Text>
        </Group>

        {Object.entries(mapper.map || {}).length === 0 ? (
          <Paper p="xl" radius="md" bg="gray.0" ta="center">
            <Text c="dimmed" size="sm">
              No mappings yet. Add your first mapping above.
            </Text>
          </Paper>
        ) : (
          Object.entries(mapper.map || {}).map(([key, value]) => {
            const isEditing = editingKey === key;

            return (
              <Paper key={key} p="md" radius="md" withBorder>
                <Group justify="space-between" align="center" wrap="nowrap">
                  {/* Key */}
                  <Box style={{ flex: "0 0 200px" }}>
                    <Text size="sm" fw={600} ff="monospace">
                      {key}
                    </Text>
                  </Box>

                  {/* Arrow */}
                  <Box style={{ flex: "0 0 40px", textAlign: "center" }}>
                    <IconArrowRight
                      size={20}
                      color="var(--mantine-color-gray-5)"
                    />
                  </Box>

                  {/* Values */}
                  <Box style={{ flex: 1 }}>
                    {isEditing ? (
                      <Stack gap="xs">
                        <Group grow>
                          {propertyKeys.map((propKey) => (
                            <TextInput
                              key={propKey}
                              label={objectConfiguration[propKey] || propKey}
                              size="sm"
                              value={editingValues[propKey] || ""}
                              onChange={(e) =>
                                handleEditValueChange(
                                  propKey,
                                  e.currentTarget.value
                                )
                              }
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleSaveEdit();
                                if (e.key === "Escape") handleCancelEdit();
                              }}
                            />
                          ))}
                        </Group>
                        <Group justify="flex-end" gap="xs">
                          <Tooltip label="Save">
                            <ActionIcon
                              color="green"
                              variant="filled"
                              size="md"
                              onClick={handleSaveEdit}
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
                              onClick={handleCancelEdit}
                            >
                              <IconX size={16} />
                            </ActionIcon>
                          </Tooltip>
                        </Group>
                      </Stack>
                    ) : (
                      <Group gap="xs" wrap="wrap">
                        {propertyKeys.map((propKey) => (
                          <Badge
                            key={propKey}
                            variant="light"
                            size="lg"
                            style={{ textTransform: "none" }}
                          >
                            {objectConfiguration[propKey] || propKey}:{" "}
                            {value?.[propKey] || "-"}
                          </Badge>
                        ))}
                      </Group>
                    )}
                  </Box>

                  {/* Actions */}
                  {!isEditing && (
                    <Group gap="xs" style={{ flex: "0 0 auto" }}>
                      <Tooltip label="Edit values">
                        <ActionIcon
                          color="blue"
                          variant="light"
                          size="lg"
                          onClick={() => handleStartEdit(key, value)}
                        >
                          <IconEdit size={18} />
                        </ActionIcon>
                      </Tooltip>
                      <Tooltip label="Delete mapping">
                        <ActionIcon
                          color="red"
                          variant="light"
                          size="lg"
                          onClick={() => onRemoveKey(key)}
                        >
                          <IconX size={18} />
                        </ActionIcon>
                      </Tooltip>
                    </Group>
                  )}
                </Group>
              </Paper>
            );
          })
        )}
      </Stack>
    </>
  );
}

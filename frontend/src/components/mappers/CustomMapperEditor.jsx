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
} from "@mantine/core";
import { IconPlus, IconX, IconEdit, IconArrowRight } from "@tabler/icons-react";
import { useState, useMemo } from "react";
import ValuePropertiesInput from "./ValuePropertiesInput";
import ValuePropertiesCard from "./ValuePropertiesCard";

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

  // Sort property keys by their numeric values
  const sortedPropertyKeys = useMemo(() => {
    return Object.keys(objectConfiguration || {}).sort(
      (a, b) => Number(objectConfiguration[a]) - Number(objectConfiguration[b])
    );
  }, [objectConfiguration]);

  // Check if key already exists
  const keyExists = useMemo(() => {
    return customKey.trim() && mapper.map && customKey.trim() in mapper.map;
  }, [customKey, mapper.map]);

  const handleAdd = () => {
    if (!customKey.trim() || keyExists) {
      return;
    }

    // Build value object - use empty string for missing values
    const valueObject = {};
    sortedPropertyKeys.forEach((key) => {
      valueObject[key] = (valueInputs[key] || "").trim();
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
    // Build value object - use empty string for missing values
    const valueObject = {};
    sortedPropertyKeys.forEach((key) => {
      valueObject[key] = (editingValues[key] || "").trim();
    });

    onUpdateValue(editingKey, valueObject);
    setEditingKey(null);
    setEditingValues({});
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditingValues({});
  };

  const isAddDisabled = !customKey.trim() || keyExists;

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
            error={keyExists ? "This key already exists" : null}
            styles={keyExists ? {
              input: { borderColor: "var(--mantine-color-red-6)" }
            } : undefined}
          />
          <ValuePropertiesInput
            objectConfiguration={objectConfiguration}
            values={valueInputs}
            onChange={setValueInputs}
          />
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
                  <Box style={{ flex: "0 0 180px" }}>
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
                      <ValuePropertiesInput
                        objectConfiguration={objectConfiguration}
                        values={editingValues}
                        onChange={setEditingValues}
                        onSave={handleSaveEdit}
                        onCancel={handleCancelEdit}
                        saving={saving}
                        isEditMode
                      />
                    ) : (
                      <ValuePropertiesCard
                        objectConfiguration={objectConfiguration}
                        values={value}
                      />
                    )}
                  </Box>

                  {/* Actions */}
                  {!isEditing && (
                    <Group gap="xs" style={{ flex: "0 0 auto" }} ml="md">
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

import {
  Group,
  TextInput,
  Button,
  Stack,
  Text,
  ActionIcon,
  Badge,
  Paper,
  Modal,
  Box,
  Tooltip,
  ScrollArea,
} from "@mantine/core";
import { IconPlus, IconX, IconEdit, IconCheck, IconSearch, IconArrowRight, IconKey } from "@tabler/icons-react";
import { useState, useMemo } from "react";

export default function NonDynamicMapperEditor({
  mapper,
  typeInfo,
  onAddKeyValue,
  onRemoveKey,
  onUpdateValue,
  saving,
}) {
  const [selectedObjectId, setSelectedObjectId] = useState("");
  const [nonDynamicValue, setNonDynamicValue] = useState("");
  const [objectSearchQuery, setObjectSearchQuery] = useState("");
  const [searchModalOpen, setSearchModalOpen] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const typeLabel = typeInfo?.name || mapper.type;
  const objectKey = typeInfo?.object?.key || "id";
  const availableFields = typeInfo?.object?.availableFields || ["id", "name"];

  const filteredOptions = useMemo(() => {
    if (!mapper?.options) return [];
    const query = objectSearchQuery.toLowerCase();
    const existingKeys = Object.keys(mapper.map || {});
    return Object.entries(mapper.options)
      .filter(([id, obj]) => {
        // Filter out existing keys
        if (existingKeys.includes(id)) return false;
        if (!query) return true;
        // Search across all available fields
        const searchable = availableFields
          .map((field) => obj[field] || "")
          .join(" ")
          .toLowerCase();
        return searchable.includes(query);
      })
      .map(([id, obj]) => ({
        id,
        ...obj,
      }));
  }, [mapper?.options, mapper?.map, objectSearchQuery, availableFields]);

  const selectedObject = mapper?.options?.[selectedObjectId];

  const handleAdd = () => {
    if (!selectedObjectId || !nonDynamicValue.trim()) {
      return;
    }

    if (mapper.map && selectedObjectId in mapper.map) {
      return;
    }

    onAddKeyValue(selectedObjectId, nonDynamicValue.trim());
    setSelectedObjectId("");
    setNonDynamicValue("");
    setObjectSearchQuery("");
  };

  const handleSelectObject = (objectId) => {
    setSelectedObjectId(objectId);
    setSearchModalOpen(false);
    setObjectSearchQuery("");
  };

  const handleStartEdit = (key, currentValue) => {
    setEditingKey(key);
    setEditingValue(String(currentValue));
  };

  const handleSaveEdit = () => {
    if (!editingValue.trim()) {
      return;
    }

    onUpdateValue(editingKey, editingValue.trim());
    setEditingKey(null);
    setEditingValue("");
  };

  const handleCancelEdit = () => {
    setEditingKey(null);
    setEditingValue("");
  };

  const mapEntries = Object.entries(mapper.map || {});

  // Get display name for an object (first non-key field or id)
  const getDisplayName = (obj) => {
    if (!obj) return "";
    const displayField = availableFields.find((f) => f !== objectKey && obj[f]);
    return obj[displayField] || obj[objectKey] || "";
  };

  // Render object fields dynamically based on availableFields
  const renderObjectFields = (obj, keyId) => {
    if (!obj) return null;

    return (
      <Stack gap={4}>
        {availableFields
          .filter((field) => field !== objectKey && obj[field])
          .map((field, index) => (
            <Text
              key={field}
              size={index === 0 ? "sm" : "xs"}
              fw={index === 0 ? 600 : 400}
              c={index === 0 ? undefined : "dimmed"}
            >
              {obj[field]}
            </Text>
          ))}
        <Group gap="xs">
          <IconKey size={14} color="var(--mantine-color-gray-5)" />
          <Text size="xs" c="dimmed" ff="monospace">
            {keyId}
          </Text>
        </Group>
      </Stack>
    );
  };

  return (
    <>
      {/* Add New Mapping */}
      <Paper
        p="md"
        radius="md"
        style={{
          background: "linear-gradient(135deg, var(--mantine-color-blue-0) 0%, var(--mantine-color-grape-0) 100%)",
        }}
      >
        <Group align="flex-end" gap="md">
          <Box style={{ flex: 1 }}>
            <Text size="xs" fw={500} c="dimmed" mb={4}>
              Select {typeLabel}
            </Text>
            <TextInput
              placeholder={`Click to select ${typeLabel.toLowerCase()}...`}
              value={selectedObject ? getDisplayName(selectedObject) : ""}
              readOnly
              onClick={() => setSearchModalOpen(true)}
              style={{ cursor: "pointer" }}
              styles={{
                input: {
                  cursor: "pointer",
                  "&:hover": { borderColor: "var(--mantine-color-blue-5)" },
                },
              }}
              rightSection={
                <ActionIcon
                  variant="subtle"
                  color="blue"
                  onClick={() => setSearchModalOpen(true)}
                >
                  <IconSearch size={16} />
                </ActionIcon>
              }
            />
          </Box>
          <Box style={{ flex: 1 }}>
            <Text size="xs" fw={500} c="dimmed" mb={4}>
              Mapped Value
            </Text>
            <TextInput
              placeholder="Enter value..."
              value={nonDynamicValue}
              onChange={(e) => setNonDynamicValue(e.currentTarget.value)}
            />
          </Box>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleAdd}
            loading={saving}
            disabled={!selectedObjectId || !nonDynamicValue.trim()}
            variant="filled"
          >
            Add Mapping
          </Button>
        </Group>
      </Paper>

      {/* Object Search Modal */}
      <Modal
        opened={searchModalOpen}
        onClose={() => {
          setSearchModalOpen(false);
          setObjectSearchQuery("");
        }}
        title={
          <Group gap="xs">
            <IconSearch size={20} />
            <Text fw={600}>Select {typeLabel}</Text>
          </Group>
        }
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            placeholder={`Search by ${availableFields.join(", ")}...`}
            value={objectSearchQuery}
            onChange={(e) => setObjectSearchQuery(e.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            autoFocus
          />

          <ScrollArea h={400}>
            <Stack gap="xs">
              {filteredOptions.length > 0 ? (
                filteredOptions.map((obj) => (
                  <Paper
                    key={obj.id}
                    p="sm"
                    radius="md"
                    withBorder
                    style={{
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onClick={() => handleSelectObject(obj.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor = "var(--mantine-color-blue-5)";
                      e.currentTarget.style.backgroundColor = "var(--mantine-color-blue-0)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "";
                      e.currentTarget.style.backgroundColor = "";
                    }}
                  >
                    <Group justify="space-between" align="center">
                      <Stack gap={4}>
                        {availableFields
                          .filter((field) => obj[field])
                          .map((field, index) => (
                            <Text
                              key={field}
                              size={index === 0 ? "sm" : "xs"}
                              fw={index === 0 ? 600 : 400}
                              c={index === 0 ? undefined : "dimmed"}
                              ff={field === objectKey ? "monospace" : undefined}
                            >
                              {field === objectKey ? `${objectKey.toUpperCase()}: ${obj[field]}` : obj[field]}
                            </Text>
                          ))}
                      </Stack>
                      <Badge variant="light" color="blue" size="sm">
                        Select
                      </Badge>
                    </Group>
                  </Paper>
                ))
              ) : (
                <Paper p="xl" radius="md" bg="gray.0">
                  <Text size="sm" c="dimmed" ta="center">
                    {objectSearchQuery ? "No results found" : "No objects available"}
                  </Text>
                </Paper>
              )}
            </Stack>
          </ScrollArea>
        </Stack>
      </Modal>

      {/* Mappings List */}
      <Stack gap="sm" mt="lg">
        <Group justify="space-between" mb="xs">
          <Text size="sm" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: 0.5 }}>
            Key ({typeLabel}.{objectKey})
          </Text>
          <Text size="sm" fw={600} c="dimmed" tt="uppercase" style={{ letterSpacing: 0.5 }}>
            Mapped Value
          </Text>
        </Group>

        {mapEntries.length === 0 ? (
          <Paper p="xl" radius="md" bg="gray.0" ta="center">
            <Text c="dimmed" size="sm">
              No mappings yet. Add your first mapping above.
            </Text>
          </Paper>
        ) : (
          mapEntries.map(([key, value]) => {
            const object = mapper.options?.[key];
            const isEditing = editingKey === key;

            return (
              <Paper
                key={key}
                p="md"
                radius="md"
                withBorder
                style={{
                  borderColor: !object ? "var(--mantine-color-yellow-4)" : undefined,
                  backgroundColor: !object ? "var(--mantine-color-yellow-0)" : undefined,
                }}
              >
                <Group justify="space-between" align="center" wrap="nowrap">
                  {/* Object Card */}
                  <Box style={{ flex: "0 0 280px" }}>
                    {object ? (
                      renderObjectFields(object, key)
                    ) : (
                      <Stack gap={4}>
                        <Badge color="yellow" variant="filled" size="xs" mb={4}>
                          Object Not Found
                        </Badge>
                        <Group gap="xs">
                          <IconKey size={14} color="var(--mantine-color-gray-5)" />
                          <Text size="xs" c="dimmed" ff="monospace">
                            {key}
                          </Text>
                        </Group>
                      </Stack>
                    )}
                  </Box>

                  {/* Arrow */}
                  <Box style={{ flex: "0 0 40px", textAlign: "center" }}>
                    <IconArrowRight size={20} color="var(--mantine-color-gray-5)" />
                  </Box>

                  {/* Value */}
                  <Box style={{ flex: 1, minWidth: 150 }}>
                    {isEditing ? (
                      <Group gap="xs" wrap="nowrap">
                        <TextInput
                          value={editingValue}
                          onChange={(e) => setEditingValue(e.currentTarget.value)}
                          size="sm"
                          style={{ flex: 1 }}
                          autoFocus
                          onKeyDown={(e) => {
                            if (e.key === "Enter") handleSaveEdit();
                            if (e.key === "Escape") handleCancelEdit();
                          }}
                        />
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
                    ) : (
                      <Paper
                        p="xs"
                        radius="sm"
                        bg="gray.0"
                        style={{ display: "inline-block" }}
                      >
                        <Text fw={500} size="sm" ff="monospace">
                          {String(value)}
                        </Text>
                      </Paper>
                    )}
                  </Box>

                  {/* Actions */}
                  {!isEditing && (
                    <Group gap="xs" style={{ flex: "0 0 auto" }}>
                      <Tooltip label="Edit value">
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

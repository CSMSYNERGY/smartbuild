import {
  Group,
  TextInput,
  Button,
  Stack,
  Text,
  ActionIcon,
  Modal,
  Paper,
  Loader,
  Box,
  Badge,
  Tooltip,
  ScrollArea,
} from "@mantine/core";
import {
  IconPlus,
  IconX,
  IconEye,
  IconSearch,
  IconArrowRight,
  IconKey,
  IconEdit,
  IconCheck,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import ObjectViewModal from "./ObjectViewModal";

// Convert camelCase to Title Case (e.g., "contactName" -> "Contact Name")
const formatFieldName = (fieldName) => {
  if (!fieldName) return "";
  return fieldName
    .replace(/([A-Z])/g, " $1")
    .replace(/^./, (str) => str.toUpperCase())
    .trim();
};

export default function DynamicMapperEditor({
  mapper,
  mapperId,
  typeInfo,
  onAddKeyValue,
  onUpdateValue,
  onRemoveKey,
  saving,
}) {
  const [dynamicObjectId, setDynamicObjectId] = useState("");
  const [dynamicValue, setDynamicValue] = useState("");
  const [dynamicSearchQuery, setDynamicSearchQuery] = useState("");
  const [dynamicSearchResults, setDynamicSearchResults] = useState([]);
  const [dynamicSearchLoading, setDynamicSearchLoading] = useState(false);
  const [dynamicKeySearchModalOpen, setDynamicKeySearchModalOpen] = useState(false);
  const [viewingObject, setViewingObject] = useState(null);
  const [viewingObjectData, setViewingObjectData] = useState(null);
  const [viewingObjectLoading, setViewingObjectLoading] = useState(false);
  const [editingKey, setEditingKey] = useState(null);
  const [editingValue, setEditingValue] = useState("");

  const typeLabel = typeInfo?.name || mapper.type;
  const objectKey = typeInfo?.object?.key || "id";
  const availableFields = typeInfo?.object?.availableFields || ["id", "name"];

  const searchDynamicObjects = async (query, page = 1) => {
    if (query.length < 3) {
      setDynamicSearchResults([]);
      return;
    }

    setDynamicSearchLoading(true);
    try {
      const searchResponse = await fetch(`/api/mappers/${mapperId}/search`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          query,
          page,
          limit: 10,
        }),
      });

      if (!searchResponse.ok) {
        const errorData = await searchResponse.json().catch(() => ({}));
        throw new Error(errorData.error || "Search failed");
      }

      const data = await searchResponse.json();
      setDynamicSearchResults(data.opportunities || []);
    } catch (err) {
      console.error("Search error:", err);
      setDynamicSearchResults([]);
    } finally {
      setDynamicSearchLoading(false);
    }
  };

  // Debounce dynamic search
  useEffect(() => {
    const timer = setTimeout(() => {
      if (dynamicSearchQuery.length >= 3) {
        searchDynamicObjects(dynamicSearchQuery, 1);
      } else {
        setDynamicSearchResults([]);
      }
    }, 500);

    return () => clearTimeout(timer);
  }, [dynamicSearchQuery]);

  const handleSelectDynamicObject = (objectId) => {
    setDynamicObjectId(objectId);
    setDynamicKeySearchModalOpen(false);
    setDynamicSearchQuery("");
    setDynamicSearchResults([]);
  };

  const handleAdd = () => {
    if (!dynamicObjectId || !dynamicValue.trim()) {
      return;
    }

    if (mapper.map && dynamicObjectId in mapper.map) {
      return;
    }

    onAddKeyValue(dynamicObjectId, dynamicValue.trim());
    setDynamicObjectId("");
    setDynamicValue("");
  };

  const handleViewDynamicObject = async (key) => {
    setViewingObject(key);
    setViewingObjectLoading(true);
    setViewingObjectData(null);

    try {
      const response = await fetch(
        `/api/mappers/${mapperId}/object?mapperKey=${encodeURIComponent(key)}`,
        {
          method: "GET",
          credentials: "include",
        }
      );

      if (!response.ok) {
        throw new Error("Failed to fetch object");
      }

      const data = await response.json();
      setViewingObjectData(data);
    } catch (err) {
      setViewingObjectData({ error: err.message });
    } finally {
      setViewingObjectLoading(false);
    }
  };

  const handleDeleteInvalidKey = () => {
    if (viewingObject) {
      onRemoveKey(viewingObject);
      setViewingObject(null);
      setViewingObjectData(null);
    }
  };

  const handleCloseViewModal = () => {
    setViewingObject(null);
    setViewingObjectData(null);
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
  const filteredResults = dynamicSearchResults.filter(
    (item) => !(item.id in (mapper.map || {}))
  );

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
        <Group align="flex-end" gap="md">
          <Box style={{ flex: 1 }}>
            <Text size="xs" fw={500} c="dimmed" mb={4}>
              Search {typeLabel}
            </Text>
            <TextInput
              placeholder={`Click to search for ${typeLabel.toLowerCase()}...`}
              value={dynamicObjectId || ""}
              readOnly
              onClick={() => setDynamicKeySearchModalOpen(true)}
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
                  onClick={() => setDynamicKeySearchModalOpen(true)}
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
              value={dynamicValue}
              onChange={(e) => setDynamicValue(e.currentTarget.value)}
            />
          </Box>
          <Button
            leftSection={<IconPlus size={16} />}
            onClick={handleAdd}
            loading={saving}
            disabled={!dynamicObjectId || !dynamicValue.trim()}
            variant="filled"
          >
            Add Mapping
          </Button>
        </Group>
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
            Key ({typeLabel}.{objectKey})
          </Text>
          <Text
            size="sm"
            fw={600}
            c="dimmed"
            tt="uppercase"
            style={{ letterSpacing: 0.5 }}
          >
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
            const isEditing = editingKey === key;

            return (
              <Paper key={key} p="md" radius="md" withBorder>
                <Group justify="space-between" align="center" wrap="nowrap">
                  {/* Key */}
                  <Box style={{ flex: "0 0 280px" }}>
                    <Group gap="xs">
                      <IconKey size={14} color="var(--mantine-color-gray-5)" />
                      <Text size="sm" ff="monospace" fw={500}>
                        {key}
                      </Text>
                    </Group>
                  </Box>

                  {/* Arrow */}
                  <Box style={{ flex: "0 0 40px", textAlign: "center" }}>
                    <IconArrowRight
                      size={20}
                      color="var(--mantine-color-gray-5)"
                    />
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
                      <Tooltip label={`View ${typeLabel}`}>
                        <ActionIcon
                          color="cyan"
                          variant="light"
                          size="lg"
                          onClick={() => handleViewDynamicObject(key)}
                        >
                          <IconEye size={18} />
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

      {/* Dynamic Key Search Modal */}
      <Modal
        opened={dynamicKeySearchModalOpen}
        onClose={() => {
          setDynamicKeySearchModalOpen(false);
          setDynamicSearchQuery("");
          setDynamicSearchResults([]);
        }}
        title={
          <Group gap="xs">
            <IconSearch size={20} />
            <Text fw={600}>Search {typeLabel}</Text>
          </Group>
        }
        size="lg"
      >
        <Stack gap="md">
          <TextInput
            placeholder="Search (min 3 characters)..."
            value={dynamicSearchQuery}
            onChange={(e) => setDynamicSearchQuery(e.currentTarget.value)}
            leftSection={<IconSearch size={16} />}
            rightSection={dynamicSearchLoading ? <Loader size="xs" /> : null}
            autoFocus
          />

          <ScrollArea h={400}>
            <Stack gap="xs">
              {dynamicSearchQuery.length < 3 ? (
                <Paper p="xl" radius="md" bg="gray.0">
                  <Text size="sm" c="dimmed" ta="center">
                    Type at least 3 characters to search
                  </Text>
                </Paper>
              ) : dynamicSearchLoading ? (
                <Paper p="xl" radius="md" bg="gray.0">
                  <Group justify="center">
                    <Loader size="sm" />
                    <Text size="sm" c="dimmed">
                      Searching...
                    </Text>
                  </Group>
                </Paper>
              ) : filteredResults.length > 0 ? (
                filteredResults.map((item) => (
                  <Paper
                    key={item.id}
                    p="sm"
                    radius="md"
                    withBorder
                    style={{
                      cursor: "pointer",
                      transition: "all 0.15s ease",
                    }}
                    onClick={() => handleSelectDynamicObject(item.id)}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.borderColor =
                        "var(--mantine-color-blue-5)";
                      e.currentTarget.style.backgroundColor =
                        "var(--mantine-color-blue-0)";
                    }}
                    onMouseLeave={(e) => {
                      e.currentTarget.style.borderColor = "";
                      e.currentTarget.style.backgroundColor = "";
                    }}
                  >
                    <Group justify="space-between" align="center">
                      <Stack gap={4}>
                        {availableFields
                          .filter((field) => item[field])
                          .map((field, index) => (
                            <Text
                              key={field}
                              size={index === 0 ? "sm" : "xs"}
                              fw={index === 0 ? 600 : 400}
                              c={index === 0 ? undefined : "dimmed"}
                              ff={field === objectKey ? "monospace" : undefined}
                            >
                              {field === objectKey
                                ? `${formatFieldName(objectKey)}: ${item[field]}`
                                : item[field]}
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
                    No results found
                  </Text>
                </Paper>
              )}
            </Stack>
          </ScrollArea>
        </Stack>
      </Modal>

      {/* Object View Modal */}
      <ObjectViewModal
        opened={!!viewingObject}
        onClose={handleCloseViewModal}
        typeLabel={typeLabel}
        objectKey={objectKey}
        availableFields={availableFields}
        objectData={viewingObjectData}
        loading={viewingObjectLoading}
        onDelete={viewingObjectData?.error ? handleDeleteInvalidKey : undefined}
      />
    </>
  );
}

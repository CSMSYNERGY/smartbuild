import {
  Paper,
  Stack,
  Text,
  Title,
  Loader,
  Alert,
  Group,
  TextInput,
  ActionIcon,
  Badge,
  Box,
  CopyButton,
  Tooltip,
  Modal,
  Code,
  Divider,
} from "@mantine/core";
import {
  IconArrowLeft,
  IconX,
  IconAlertCircle,
  IconCheck,
  IconEdit,
  IconCopy,
  IconId,
  IconCategory,
  IconKey,
  IconQuestionMark,
} from "@tabler/icons-react";
import { useState, useEffect, useMemo } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { fetchWithAuth } from "../utils/utils";
import CustomMapperEditor from "../components/mappers/CustomMapperEditor";
import NonDynamicMapperEditor from "../components/mappers/NonDynamicMapperEditor";
import DynamicMapperEditor from "../components/mappers/DynamicMapperEditor";

export default function Mapper() {
  const { mapperId } = useParams();
  const navigate = useNavigate();

  const [mapper, setMapper] = useState(null);
  const [mapperTypes, setMapperTypes] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [editingName, setEditingName] = useState(false);
  const [mapperName, setMapperName] = useState("");
  const [helpModalOpen, setHelpModalOpen] = useState(false);

  // Sort objectConfiguration keys by their numeric values
  const sortedConfigEntries = useMemo(() => {
    if (!mapper?.objectConfiguration) return [];
    return Object.entries(mapper.objectConfiguration).sort(
      ([, a], [, b]) => Number(a) - Number(b)
    );
  }, [mapper?.objectConfiguration]);

  useEffect(() => {
    fetchMapper();
    fetchMapperTypes();
  }, [mapperId]);

  const fetchMapper = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth(`/api/mappers/${mapperId}`, {
        method: "GET",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch mapper");
      }

      const data = await response.json();
      setMapper(data);
      setMapperName(data.name || "");
    } catch (err) {
      setError(err.message || "Failed to load mapper");
    } finally {
      setLoading(false);
    }
  };

  const fetchMapperTypes = async () => {
    try {
      const response = await fetchWithAuth("/api/mapper-types", {
        method: "GET",
      });

      if (!response.ok) {
        throw new Error("Failed to fetch mapper types");
      }

      const data = await response.json();
      setMapperTypes(data || {});
    } catch (err) {
      console.error("Failed to fetch mapper types:", err);
    }
  };

  const saveMapper = async (updates, optimisticUpdate) => {
    setSaving(true);
    setError(null);
    
    // Apply optimistic update immediately
    if (optimisticUpdate) {
      setMapper((prev) => optimisticUpdate(prev));
    }
    
    try {
      const response = await fetchWithAuth(`/api/mappers/${mapperId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to update mapper");
      }

      setSuccess("Mapper updated successfully!");
    } catch (err) {
      setError(err.message || "Failed to update mapper");
      // Revert on error by refetching
      await fetchMapper();
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateName = async () => {
    if (!mapperName.trim()) {
      setError("Mapper name cannot be empty");
      return;
    }

    const newName = mapperName.trim();
    await saveMapper(
      { name: newName },
      (prev) => ({ ...prev, name: newName })
    );
    setEditingName(false);
  };

  const handleAddKeyValue = (key, value) => {
    if (mapper.map && key in mapper.map) {
      setError("Key already exists");
      return;
    }

    saveMapper(
      { map: { [key]: value } },
      (prev) => ({
        ...prev,
        map: { ...prev.map, [key]: value },
      })
    );
  };

  const handleUpdateValue = (key, value) => {
    saveMapper(
      { map: { [key]: value } },
      (prev) => ({
        ...prev,
        map: { ...prev.map, [key]: value },
      })
    );
  };

  const handleRemoveKey = (key) => {
    saveMapper(
      { map: { [key]: null } },
      (prev) => {
        const newMap = { ...prev.map };
        delete newMap[key];
        return { ...prev, map: newMap };
      }
    );
  };

  if (loading) {
    return (
      <Stack align="center" py="xl">
        <Loader size="lg" />
        <Text c="dimmed">Loading mapper...</Text>
      </Stack>
    );
  }

  if (!mapper) {
    return (
      <Alert
        icon={<IconAlertCircle size="1rem" />}
        title="Mapper not found"
        color="red"
      >
        The mapper you're looking for doesn't exist.
      </Alert>
    );
  }

  const isCustom = mapper.type === "custom";
  const isDynamic = mapper.dynamic === true;
  const isNonDynamic = !isCustom && !isDynamic;

  const typeInfo = mapperTypes[mapper.type] || {};
  const typeLabel = typeInfo.name || mapper.type;

  return (
    <Stack gap="lg">
      <Group>
        <ActionIcon variant="light" onClick={() => navigate("/mappers")}>
          <IconArrowLeft size={18} />
        </ActionIcon>
        <div style={{ flex: 1 }}>
          {editingName ? (
            <Group gap="xs" align="center">
              <TextInput
                value={mapperName}
                onChange={(e) => setMapperName(e.currentTarget.value)}
                style={{ flex: 1, maxWidth: 400 }}
                autoFocus
                onKeyDown={(e) => {
                  if (e.key === "Enter") handleUpdateName();
                  if (e.key === "Escape") {
                    setEditingName(false);
                    setMapperName(mapper.name || "");
                  }
                }}
              />
              <ActionIcon
                color="green"
                variant="light"
                onClick={handleUpdateName}
                loading={saving}
              >
                <IconCheck size={16} />
              </ActionIcon>
              <ActionIcon
                variant="light"
                onClick={() => {
                  setEditingName(false);
                  setMapperName(mapper.name || "");
                }}
              >
                <IconX size={16} />
              </ActionIcon>
            </Group>
          ) : (
            <Group gap="xs" align="center">
              <Title order={2}>{mapper.name}</Title>
              <Tooltip label="Edit name">
                <ActionIcon
                  variant="subtle"
                  size="sm"
                  onClick={() => setEditingName(true)}
                >
                  <IconEdit size={14} />
                </ActionIcon>
              </Tooltip>
            </Group>
          )}
        </div>
      </Group>

      {/* Mapper Info Card */}
      <Paper withBorder radius="md" p="md" bg="gray.0">
        <Group grow align="stretch">
          <Box>
            <Group gap="xs" mb={4}>
              <IconId size={14} color="var(--mantine-color-gray-6)" />
              <Text size="xs" fw={500} c="dimmed" tt="uppercase">
                Mapper ID
              </Text>
            </Group>
            <Group gap="xs">
              <Text size="sm" ff="monospace" fw={500}>
                {mapperId}
              </Text>
              <CopyButton value={mapperId}>
                {({ copied, copy }) => (
                  <Tooltip label={copied ? "Copied!" : "Copy ID"}>
                    <ActionIcon
                      variant="subtle"
                      size="xs"
                      color={copied ? "green" : "gray"}
                      onClick={copy}
                    >
                      <IconCopy size={12} />
                    </ActionIcon>
                  </Tooltip>
                )}
              </CopyButton>
            </Group>
          </Box>
          <Box>
            <Group gap="xs" mb={4}>
              <IconCategory size={14} color="var(--mantine-color-gray-6)" />
              <Text size="xs" fw={500} c="dimmed" tt="uppercase">
                Type
              </Text>
            </Group>
            <Badge variant="light" size="md">
              {typeLabel}
            </Badge>
          </Box>
          <Box>
            <Group gap="xs" mb={4}>
              <IconKey size={14} color="var(--mantine-color-gray-6)" />
              <Text size="xs" fw={500} c="dimmed" tt="uppercase">
                Key Count
              </Text>
            </Group>
            <Text size="sm" fw={600}>
              {Object.keys(mapper.map || {}).length} keys
            </Text>
          </Box>
        </Group>
      </Paper>

      {/* Value Properties Info */}
      {mapper.objectConfiguration && Object.keys(mapper.objectConfiguration).length > 0 && (
        <Paper withBorder radius="md" p="md">
          <Group justify="space-between" align="flex-start" mb="sm">
            <Box>
              <Text size="xs" fw={500} c="dimmed" tt="uppercase" mb={4}>
                Value Properties
              </Text>
              <Text size="xs" c="dimmed">
                These are the value fields defined for this mapper. Each mapping will store values for these properties.
              </Text>
            </Box>
            <Tooltip label="How to use in actions">
              <ActionIcon
                variant="light"
                color="blue"
                size="sm"
                onClick={() => setHelpModalOpen(true)}
              >
                <IconQuestionMark size={14} />
              </ActionIcon>
            </Tooltip>
          </Group>
          <Group gap="xs">
            {sortedConfigEntries.map(([propName, label]) => (
              <Badge key={propName} variant="outline" size="sm" style={{ textTransform: "none" }}>
                {label}: {propName}
              </Badge>
            ))}
          </Group>
        </Paper>
      )}

      {error && (
        <Alert
          icon={<IconAlertCircle size="1rem" />}
          title="Error"
          color="red"
          variant="light"
          onClose={() => setError(null)}
          withCloseButton
        >
          {error}
        </Alert>
      )}

      {success && (
        <Alert
          icon={<IconCheck size="1rem" />}
          title="Success"
          color="green"
          variant="light"
          onClose={() => setSuccess(null)}
          withCloseButton
        >
          {success}
        </Alert>
      )}

      <Paper withBorder shadow="sm" radius="lg" p="lg">
        <Stack gap="md">
          <Title order={4}>Key Mappings</Title>

          {isCustom && (
            <CustomMapperEditor
              mapper={mapper}
              objectConfiguration={mapper.objectConfiguration || {}}
              onAddKeyValue={handleAddKeyValue}
              onUpdateValue={handleUpdateValue}
              onRemoveKey={handleRemoveKey}
              saving={saving}
            />
          )}

          {isNonDynamic && (
            <NonDynamicMapperEditor
              mapper={mapper}
              typeInfo={typeInfo}
              objectConfiguration={mapper.objectConfiguration || {}}
              onAddKeyValue={handleAddKeyValue}
              onUpdateValue={handleUpdateValue}
              onRemoveKey={handleRemoveKey}
              saving={saving}
            />
          )}

          {isDynamic && (
            <DynamicMapperEditor
              mapper={mapper}
              mapperId={mapperId}
              typeInfo={typeInfo}
              objectConfiguration={mapper.objectConfiguration || {}}
              onAddKeyValue={handleAddKeyValue}
              onUpdateValue={handleUpdateValue}
              onRemoveKey={handleRemoveKey}
              saving={saving}
            />
          )}
        </Stack>
      </Paper>

      {/* Help Modal */}
      <Modal
        opened={helpModalOpen}
        onClose={() => setHelpModalOpen(false)}
        title={
          <Group gap="xs">
            <IconQuestionMark size={20} />
            <Text fw={600}>Using Value Properties in Actions</Text>
          </Group>
        }
        size="lg"
      >
        <Stack gap="md">
          <Text size="sm">
            When using the <strong>Get Mapping Value</strong> action, you can access individual property values using dot notation with the action output.
          </Text>
          
          <Divider />
          
          <Box>
            <Text size="sm" fw={600} mb="xs">
              How to Access Properties:
            </Text>
            <Text size="sm" c="dimmed" mb="sm">
              Use <Code>{"{{action.X}}"}</Code> where X is the property number (1, 2, 3, etc.)
            </Text>
          </Box>

          {sortedConfigEntries.length > 0 && (
            <Paper p="md" radius="md" bg="gray.0">
              <Text size="sm" fw={600} mb="sm">
                Example for this mapper:
              </Text>
              <Stack gap="xs">
                {sortedConfigEntries.map(([propName, label]) => (
                  <Group key={propName} gap="sm">
                    <Code>{`{{action.${label}}}`}</Code>
                    <Text size="sm" c="dimmed">→ Returns value of "{propName}"</Text>
                  </Group>
                ))}
              </Stack>
            </Paper>
          )}

          <Alert variant="light" color="blue" title="Tip">
            <Text size="sm">
              The property numbers correspond to the order they were defined when creating the mapper.
            </Text>
          </Alert>
        </Stack>
      </Modal>
    </Stack>
  );
}

import {
  Paper,
  Stack,
  Text,
  Title,
  TextInput,
  Select,
  Group,
  Button,
  Loader,
  Alert,
  Modal,
  ActionIcon,
  Badge,
  Box,
  Tooltip,
} from "@mantine/core";
import {
  IconSearch,
  IconPlus,
  IconTrash,
  IconAlertCircle,
  IconCheck,
  IconMapPin,
} from "@tabler/icons-react";
import { useState, useEffect, useMemo } from "react";
import { useNavigate } from "react-router-dom";

export default function Mappers() {
  const navigate = useNavigate();
  const [mappers, setMappers] = useState([]);
  const [mapperTypes, setMapperTypes] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Search/filter state
  const [searchName, setSearchName] = useState("");
  const [searchType, setSearchType] = useState("");
  const [searchId, setSearchId] = useState("");

  // Create mapper modal state
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [createName, setCreateName] = useState("");
  const [createType, setCreateType] = useState("");
  const [creating, setCreating] = useState(false);

  // Delete confirmation modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingMapper, setDeletingMapper] = useState(null);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    fetchMappers();
    fetchMapperTypes();
  }, []);

  const fetchMappers = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/mappers", {
        method: "GET",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to fetch mappers");
      }

      const data = await response.json();
      setMappers(data || []);
    } catch (err) {
      setError(err.message || "Failed to load mappers");
    } finally {
      setLoading(false);
    }
  };

  const fetchMapperTypes = async () => {
    try {
      const response = await fetch("/api/mapper-types", {
        method: "GET",
        credentials: "include",
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

  const filteredMappers = useMemo(() => {
    return mappers.filter((mapper) => {
      const nameMatch =
        !searchName ||
        mapper.name.toLowerCase().includes(searchName.toLowerCase());
      const typeMatch = !searchType || mapper.type === searchType;
      const idMatch =
        !searchId || mapper.id.toLowerCase().includes(searchId.toLowerCase());

      return nameMatch && typeMatch && idMatch;
    });
  }, [mappers, searchName, searchType, searchId]);

  const handleCreateMapper = async () => {
    if (!createName.trim()) {
      setError("Mapper name cannot be empty");
      return;
    }

    if (!createType) {
      setError("Please select a mapper type");
      return;
    }

    setCreating(true);
    setError(null);

    try {
      const response = await fetch("/api/mappers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify({
          name: createName.trim(),
          type: createType,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || "Failed to create mapper");
      }

      setSuccess("Mapper created successfully!");
      setCreateModalOpen(false);
      setCreateName("");
      setCreateType("");
      await fetchMappers();
    } catch (err) {
      setError(err.message || "Failed to create mapper");
    } finally {
      setCreating(false);
    }
  };

  const openDeleteModal = (mapper) => {
    setDeletingMapper(mapper);
    setDeleteModalOpen(true);
  };

  const handleDeleteMapper = async () => {
    if (!deletingMapper) return;

    setDeleting(true);
    try {
      const response = await fetch(`/api/mappers/${deletingMapper.id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.error || "Failed to delete mapper");
      }

      setSuccess("Mapper deleted successfully!");
      setDeleteModalOpen(false);
      setDeletingMapper(null);
      setMappers((prev) => prev.filter((m) => m.id !== deletingMapper.id));
    } catch (err) {
      setError(err.message || "Failed to delete mapper");
    } finally {
      setDeleting(false);
    }
  };

  const typeOptions = Object.keys(mapperTypes).map((key) => ({
    value: key,
    label: mapperTypes[key].name || key,
  }));

  const getTypeLabel = (type) => mapperTypes[type]?.name || type;

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={2}>Mappers</Title>
        <Text c="dimmed">Manage your key-value mappers for data transformation.</Text>
      </Stack>

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

      {/* Search & Filters */}
      <Paper withBorder radius="md" p="md" bg="gray.0">
        <Group gap="md">
          <TextInput
            placeholder="Search by name..."
            leftSection={<IconSearch size={16} />}
            value={searchName}
            onChange={(e) => setSearchName(e.currentTarget.value)}
            style={{ flex: 1 }}
          />
          <Select
            placeholder="Filter by type"
            data={typeOptions}
            value={searchType}
            onChange={setSearchType}
            clearable
            style={{ width: 180 }}
          />
          <TextInput
            placeholder="Search by ID..."
            value={searchId}
            onChange={(e) => setSearchId(e.currentTarget.value)}
            style={{ width: 180 }}
          />
          <Button leftSection={<IconPlus size={16} />} onClick={() => setCreateModalOpen(true)}>
            Create Mapper
          </Button>
        </Group>
      </Paper>

      {/* Mappers List */}
      <Paper withBorder shadow="sm" radius="lg" p="lg">
        {loading ? (
          <Stack align="center" py="xl">
            <Loader />
            <Text c="dimmed">Loading mappers...</Text>
          </Stack>
        ) : filteredMappers.length === 0 ? (
          <Stack align="center" py="xl" gap="md">
            <IconMapPin size={48} color="var(--mantine-color-gray-4)" />
            <Text c="dimmed" ta="center">
              {mappers.length === 0
                ? "No mappers yet. Create your first mapper to get started!"
                : "No mappers match your search criteria."}
            </Text>
            {mappers.length === 0 && (
              <Button
                variant="light"
                leftSection={<IconPlus size={16} />}
                onClick={() => setCreateModalOpen(true)}
              >
                Create Your First Mapper
              </Button>
            )}
          </Stack>
        ) : (
          <Stack gap="sm">
            {filteredMappers.map((mapper) => (
              <Paper
                key={mapper.id}
                p="md"
                radius="md"
                withBorder
                style={{
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                }}
                onClick={() => navigate(`/mappers/${mapper.id}`)}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = "var(--mantine-color-blue-5)";
                  e.currentTarget.style.backgroundColor = "var(--mantine-color-blue-0)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = "";
                  e.currentTarget.style.backgroundColor = "";
                }}
              >
                <Group justify="space-between" align="center" wrap="nowrap">
                  <Box style={{ flex: 1 }}>
                    <Group gap="sm" mb={4}>
                      <Text fw={600} size="md">
                        {mapper.name}
                      </Text>
                      <Badge variant="light" size="sm">
                        {getTypeLabel(mapper.type)}
                      </Badge>
                    </Group>
                    <Group gap="md">
                      <Text size="xs" c="dimmed" ff="monospace">
                        ID: {mapper.id}
                      </Text>
                      <Text size="xs" c="dimmed">
                        {Object.keys(mapper.map || {}).length} keys
                      </Text>
                    </Group>
                  </Box>
                  <Tooltip label="Delete mapper">
                    <ActionIcon
                      color="red"
                      variant="light"
                      size="lg"
                      onClick={(e) => {
                        e.stopPropagation();
                        openDeleteModal(mapper);
                      }}
                    >
                      <IconTrash size={18} />
                    </ActionIcon>
                  </Tooltip>
                </Group>
              </Paper>
            ))}
          </Stack>
        )}
      </Paper>

      {/* Create Mapper Modal */}
      <Modal
        opened={createModalOpen}
        onClose={() => {
          setCreateModalOpen(false);
          setCreateName("");
          setCreateType("");
        }}
        title={
          <Group gap="xs">
            <IconPlus size={20} />
            <Text fw={600}>Create New Mapper</Text>
          </Group>
        }
      >
        <Stack gap="md">
          <TextInput
            label="Mapper Name"
            placeholder="Enter a descriptive name..."
            value={createName}
            onChange={(e) => setCreateName(e.currentTarget.value)}
            required
            autoFocus
          />
          <Select
            label="Mapper Type"
            placeholder="Select a type"
            data={typeOptions}
            value={createType}
            onChange={setCreateType}
            required
          />
          <Group justify="flex-end" mt="md">
            <Button
              variant="light"
              onClick={() => {
                setCreateModalOpen(false);
                setCreateName("");
                setCreateType("");
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleCreateMapper}
              loading={creating}
              disabled={!createName.trim() || !createType}
            >
              Create Mapper
            </Button>
          </Group>
        </Stack>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        opened={deleteModalOpen}
        onClose={() => {
          setDeleteModalOpen(false);
          setDeletingMapper(null);
        }}
        title={
          <Group gap="xs">
            <IconTrash size={20} color="var(--mantine-color-red-6)" />
            <Text fw={600}>Delete Mapper</Text>
          </Group>
        }
        size="sm"
      >
        <Stack gap="md">
          <Text>
            Are you sure you want to delete{" "}
            <Text component="span" fw={600}>
              "{deletingMapper?.name}"
            </Text>
            ?
          </Text>
          <Text size="sm" c="dimmed">
            This action cannot be undone. All key mappings will be permanently removed.
          </Text>
          <Group justify="flex-end" mt="md">
            <Button
              variant="light"
              onClick={() => {
                setDeleteModalOpen(false);
                setDeletingMapper(null);
              }}
            >
              Cancel
            </Button>
            <Button color="red" onClick={handleDeleteMapper} loading={deleting}>
              Delete Mapper
            </Button>
          </Group>
        </Stack>
      </Modal>
    </Stack>
  );
}

import {
  Group,
  TextInput,
  Button,
  Stack,
  Text,
  ActionIcon,
} from "@mantine/core";
import { IconPlus, IconX } from "@tabler/icons-react";
import { useState } from "react";

export default function CustomMapperEditor({ mapper, onAddKeyValue, onRemoveKey, saving }) {
  const [customKey, setCustomKey] = useState("");
  const [customValue, setCustomValue] = useState("");

  const handleAdd = () => {
    if (!customKey.trim() || !customValue.trim()) {
      return;
    }

    if (mapper.map && customKey.trim() in mapper.map) {
      return;
    }

    onAddKeyValue(customKey.trim(), customValue.trim());
    setCustomKey("");
    setCustomValue("");
  };

  return (
    <>
      <Group align="flex-end">
        <TextInput
          placeholder="Key"
          value={customKey}
          onChange={(e) => setCustomKey(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <TextInput
          placeholder="Value"
          value={customValue}
          onChange={(e) => setCustomValue(e.currentTarget.value)}
          style={{ flex: 1 }}
        />
        <Button
          leftSection={<IconPlus size={16} />}
          onClick={handleAdd}
          loading={saving}
          disabled={!customKey.trim() || !customValue.trim()}
        >
          Add
        </Button>
      </Group>

      <Stack gap="xs" mt="md">
        {Object.entries(mapper.map || {}).map(([key, value]) => (
          <Group
            key={key}
            justify="space-between"
            p="xs"
            style={{
              border: "1px solid var(--mantine-color-gray-3)",
              borderRadius: 4,
            }}
          >
            <Group>
              <Text fw={500}>{key}</Text>
              <Text c="dimmed">→</Text>
              <Text>{String(value)}</Text>
            </Group>
            <ActionIcon
              color="red"
              variant="light"
              onClick={() => onRemoveKey(key)}
            >
              <IconX size={16} />
            </ActionIcon>
          </Group>
        ))}
      </Stack>
    </>
  );
}


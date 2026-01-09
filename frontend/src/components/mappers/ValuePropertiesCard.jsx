import { Paper, Text, Box } from "@mantine/core";
import { useMemo } from "react";

/**
 * Display value properties in a card format (view mode)
 */
export default function ValuePropertiesCard({ objectConfiguration, values }) {
  // Sort property keys by their numeric values
  const sortedPropertyKeys = useMemo(() => {
    return Object.keys(objectConfiguration || {}).sort(
      (a, b) => Number(objectConfiguration[a]) - Number(objectConfiguration[b])
    );
  }, [objectConfiguration]);

  return (
    <Paper p="sm" radius="sm" bg="gray.0">
      <Box
        style={{
          display: "grid",
          gridTemplateColumns: "auto 1fr",
          gap: "6px 12px",
          alignItems: "baseline",
        }}
      >
        {sortedPropertyKeys.map((propKey) => (
          <>
            <Text key={`${propKey}-label`} size="xs" c="dimmed" style={{ whiteSpace: "nowrap" }}>
              {propKey}:
            </Text>
            <Text key={`${propKey}-value`} size="sm" fw={500}>
              {values?.[propKey] || "-"}
            </Text>
          </>
        ))}
      </Box>
    </Paper>
  );
}

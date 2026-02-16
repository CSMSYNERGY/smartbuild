import {
  Alert,
  Badge,
  Button,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  TextInput,
  Title,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCheck,
  IconKey,
  IconRefresh,
} from "@tabler/icons-react";
import { useState, useEffect } from "react";
import { fetchWithAuth } from "../utils/utils";

export default function SmartBuild() {
  const [config, setConfig] = useState(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    fetchConfiguration();
  }, []);

  const fetchConfiguration = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth("/api/location/smartbuild/configuration", {
        method: "GET",
      });

      if (!response.ok) {
        // If backend throws error (e.g., auth data not found), treat as not connected
        const errorData = await response.json().catch(() => ({}));
        setConfig({
          connected: false,
          smartbuildUserId: null,
        });
        return;
      }

      const data = await response.json();
      setConfig(data);
    } catch (err) {
      setError(err.message || "Failed to load SmartBuild configuration");
      setConfig({
        connected: false,
        smartbuildUserId: null,
      });
    } finally {
      setLoading(false);
    }
  };

  const handleAuthenticate = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError(null);
    setSuccess(null);

    if (!username.trim() || !password.trim()) {
      setError("Username and password are required");
      setSubmitting(false);
      return;
    }

    try {
      const response = await fetchWithAuth("/api/location/smartbuild/authenticate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          smartbuildUserId: username.trim(),
          smartbuildUserPassword: password,
        }),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Authentication failed");
      }

      setSuccess("SmartBuild credentials saved successfully!");
      setUsername("");
      setPassword("");

      // Refresh configuration
      await fetchConfiguration();
    } catch (err) {
      setError(err.message || "Failed to authenticate SmartBuild");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <Stack gap="lg" align="center" mt="xl">
        <Loader size="lg" />
        <Text c="dimmed">Loading SmartBuild configuration...</Text>
      </Stack>
    );
  }

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={2}>SmartBuild Configuration</Title>
        <Text c="dimmed">
          Manage your SmartBuild integration and authentication settings.
        </Text>
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

      <Paper withBorder shadow="sm" radius="lg" p="lg">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600} size="lg">
                Connection Status
              </Text>
              <Text size="sm" c="dimmed">
                Current SmartBuild authentication status
              </Text>
            </div>
            <Badge
              color={config?.connected ? "green" : "gray"}
              variant="light"
              size="lg"
            >
              {config?.connected ? "Connected" : "Not Connected"}
            </Badge>
          </Group>

          {config?.connected && config?.smartbuildUserId && (
            <Paper withBorder p="md" radius="md" bg="gray.0">
              <Stack gap="xs">
                <Text size="sm" fw={600}>
                  Connected Account
                </Text>
                <Text size="sm" c="dimmed">
                  User ID:{" "}
                  <Text component="span" fw={500}>
                    {config.smartbuildUserId}
                  </Text>
                </Text>
              </Stack>
            </Paper>
          )}

          <form onSubmit={handleAuthenticate}>
            <Stack gap="md" mt="md">
              <div>
                <Text fw={600} size="md" mb="sm">
                  {config?.connected ? "Update Credentials" : "Connect SmartBuild"}
                </Text>
                <Text size="sm" c="dimmed" mb="md">
                  {config?.connected
                    ? "Update your SmartBuild username and password to refresh the connection."
                    : "Enter your SmartBuild username and password to connect your account."}
                </Text>
              </div>

              <TextInput
                label="SmartBuild Username"
                placeholder="Enter your SmartBuild username"
                value={username}
                onChange={(e) => setUsername(e.currentTarget.value)}
                required
                disabled={submitting}
                leftSection={<IconKey size={16} />}
              />

              <TextInput
                label="SmartBuild Password"
                type="password"
                placeholder="Enter your SmartBuild password"
                value={password}
                onChange={(e) => setPassword(e.currentTarget.value)}
                required
                disabled={submitting}
                leftSection={<IconKey size={16} />}
              />

              <Group mt="md">
                <Button
                  type="submit"
                  loading={submitting}
                  leftSection={
                    config?.connected ? (
                      <IconRefresh size={16} />
                    ) : (
                      <IconCheck size={16} />
                    )
                  }
                >
                  {config?.connected
                    ? "Update Credentials"
                    : "Connect SmartBuild"}
                </Button>
                {config?.connected && (
                  <Button
                    variant="light"
                    onClick={fetchConfiguration}
                    disabled={submitting}
                  >
                    Refresh Status
                  </Button>
                )}
              </Group>
            </Stack>
          </form>
        </Stack>
      </Paper>
    </Stack>
  );
}


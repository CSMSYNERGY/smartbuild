import { useEffect, useState } from "react";
import { Alert, Button, Group, Text } from "@mantine/core";
import { IconAlertCircle, IconExternalLink } from "@tabler/icons-react";

export default function ReauthorizeLocation() {
  const [isAuthorized, setIsAuthorized] = useState(null);
  const [isChecking, setIsChecking] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    checkAuthorization();
  }, []);

  const checkAuthorization = async () => {
    try {
      setIsChecking(true);
      setError(null);
      const response = await fetch("/api/location/check-authorization", {
        method: "GET",
        credentials: "include",
      });

      if (response.ok) {
        const data = await response.json();
        setIsAuthorized(data.authorized === true);
      } else {
        setIsAuthorized(false);
      }
    } catch (err) {
      console.error("Failed to check location authorization:", err);
      setError(err.message);
      setIsAuthorized(false);
    } finally {
      setIsChecking(false);
    }
  };

  const handleReauthorize = () => {
    const authorizeUrl = `${window.location.origin}/auth/authorize`;
    window.open(authorizeUrl, "_blank", "noopener,noreferrer");
  };

  // Don't show anything if authorized or still checking
  if (isChecking || isAuthorized === true) {
    return null;
  }

  // Show reauthorization prompt if not authorized
  return (
    <Alert
      icon={<IconAlertCircle size={16} />}
      title="Authorization Required"
      color="orange"
      variant="light"
      mb="md"
    >
      <Text size="sm" mb="sm">
        Your account needs to be reauthorized to continue using
        integrations. Please authorize your account to proceed.
      </Text>
      {error && (
        <Text size="xs" c="red" mb="sm">
          Error: {error}
        </Text>
      )}
      <Group>
        <Button
          size="xs"
          variant="light"
          color="orange"
          leftSection={<IconExternalLink size={14} />}
          onClick={handleReauthorize}
        >
          Authorize Account
        </Button>
        <Button
          size="xs"
          variant="subtle"
          color="gray"
          onClick={checkAuthorization}
        >
          Check Again
        </Button>
      </Group>
    </Alert>
  );
}

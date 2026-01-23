import {
  Alert,
  Badge,
  Button,
  Card,
  Group,
  Loader,
  Paper,
  Stack,
  Text,
  Title,
  Divider,
  Box,
} from "@mantine/core";
import {
  IconAlertCircle,
  IconCheck,
  IconCreditCard,
  IconX,
  IconRefresh,
  IconMail,
  IconUser,
  IconCalendar,
} from "@tabler/icons-react";
import { useAuth } from "../context/AuthProvider";
import { useState, useEffect } from "react";
import PaymentForm from "../components/payment-form/PaymentForm";

export default function Subscription() {
  const { user, entitlement, refreshAuth } = useAuth();
  const [plans, setPlans] = useState([]);
  const [loading, setLoading] = useState(false);
  const [actionLoading, setActionLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [selectedPlan, setSelectedPlan] = useState(null);
  const [paymentAction, setPaymentAction] = useState(null); // "create" or "update-payment" or null

  const status = entitlement?.status || "inactive";
  const subscriptionByThisUser = entitlement?.subscriptionByThisUser || false;
  const paymentDetails = entitlement?.paymentDetails || null;

  const isPendingState =
    status === "pending-update-payment" ||
    status === "pending-resume";

  useEffect(() => {
    fetchPlans();
  }, []);

  const fetchPlans = async () => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetch("/api/subscription/plans", {
        method: "GET",
        credentials: "include",
      });
      if (!response.ok) throw new Error("Failed to fetch plans");
      const data = await response.json();
      setPlans(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const handleAction = async (action, data = {}) => {
    setActionLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const response = await fetch(`/api/subscription/${action}`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(data),
      });

      const result = await response.json();
      if (!response.ok) {
        throw new Error(result.error || "Action failed");
      }

      setSuccess(`Subscription ${action} completed successfully!`);
      
      // Refresh auth data to get updated entitlement
      if (refreshAuth) {
        await refreshAuth();
      }
    } catch (err) {
      setError(err.message || "An error occurred");
    } finally {
      setActionLoading(false);
    }
  };

  const handlePaymentSuccess = () => {
    setSelectedPlan(null);
    setPaymentAction(null);
    // Refresh auth data to get updated entitlement
    if (refreshAuth) {
      refreshAuth();
    }
  };

  const openUpdatePayment = () => {
    setPaymentAction("update-payment");
  };

  const handlePlanSelect = (plan) => {
    setSelectedPlan(plan);
    setPaymentAction("create");
  };

  const getStatusBadge = () => {
    const statusColors = {
      active: "green",
      cancelled: "red",
      inactive: "gray",
      "pending-update-payment": "yellow",
      "pending-resume": "yellow",
    };

    const statusLabels = {
      active: "Active",
      cancelled: "Cancelled",
      inactive: "Inactive",
      "pending-update-payment": "Pending Payment Update",
      "pending-resume": "Pending Resume",
    };

    return (
      <Badge
        color={statusColors[status] || "gray"}
        variant="light"
        size="lg"
      >
        {statusLabels[status] || status}
      </Badge>
    );
  };

  const renderPendingNotification = () => {
    if (!isPendingState) return null;

    const messages = {
      "pending-update-payment": "Your payment update is being processed. Please wait for confirmation.",
      "pending-resume": "Your subscription resumption is being processed. Please wait for confirmation.",
    };

    return (
      <Alert
        icon={<IconAlertCircle size="1rem" />}
        title="Action Pending"
        color="yellow"
        variant="light"
      >
        {messages[status]}
      </Alert>
    );
  };

  const renderActiveActions = () => {
    if (status !== "active" || isPendingState) return null;

    return (
      <Stack gap="md">
        <Title order={4}>Subscription Actions</Title>
        <Group>
          <Button
            color="red"
            variant="light"
            leftSection={<IconX size="1rem" />}
            onClick={() => handleAction("cancel")}
            loading={actionLoading}
          >
            Cancel Subscription
          </Button>
          <Button
            color="blue"
            variant="light"
            leftSection={<IconCreditCard size="1rem" />}
            onClick={openUpdatePayment}
            loading={actionLoading}
          >
            Update Payment
          </Button>
        </Group>
        {subscriptionByThisUser && paymentDetails && (
          <Paper withBorder p="md" radius="md" mt="md">
            <Stack gap="md">
              <Text fw={600}>Current Payment Method</Text>
              <Group gap="lg" align="flex-start">
                {/* Card Info */}
                <Paper
                  withBorder
                  p="md"
                  radius="md"
                  style={{
                    background: "linear-gradient(135deg, var(--mantine-color-dark-7) 0%, var(--mantine-color-dark-5) 100%)",
                    minWidth: 280,
                  }}
                >
                  <Stack gap="md">
                    <Group justify="space-between" align="center">
                      <IconCreditCard size={24} color="var(--mantine-color-gray-4)" />
                      <Text size="xs" c="dimmed" tt="uppercase">
                        Credit Card
                      </Text>
                    </Group>
                    <Text
                      ff="monospace"
                      size="lg"
                      fw={500}
                      c="white"
                      style={{ letterSpacing: 2 }}
                    >
                      {paymentDetails.maskedNumber || "•••• •••• •••• ••••"}
                    </Text>
                    <Group justify="space-between">
                      <Box>
                        <Text size="xs" c="dimmed">
                          Expires
                        </Text>
                        <Text size="sm" fw={500} c="white">
                          {paymentDetails.exp
                            ? `${paymentDetails.exp.slice(0, 2)}/${paymentDetails.exp.slice(2)}`
                            : "-"}
                        </Text>
                      </Box>
                    </Group>
                  </Stack>
                </Paper>

                {/* Billing Details */}
                <Stack gap="sm" style={{ flex: 1 }}>
                  {paymentDetails.billingEmail && (
                    <Group gap="sm">
                      <IconMail size={16} color="var(--mantine-color-gray-5)" />
                      <Box>
                        <Text size="xs" c="dimmed">
                          Billing Email
                        </Text>
                        <Text size="sm" fw={500}>
                          {paymentDetails.billingEmail}
                        </Text>
                      </Box>
                    </Group>
                  )}
                  {paymentDetails.billingName && (
                    <Group gap="sm">
                      <IconUser size={16} color="var(--mantine-color-gray-5)" />
                      <Box>
                        <Text size="xs" c="dimmed">
                          Billing Name
                        </Text>
                        <Text size="sm" fw={500}>
                          {paymentDetails.billingName}
                        </Text>
                      </Box>
                    </Group>
                  )}
                  {paymentDetails.exp && (
                    <Group gap="sm">
                      <IconCalendar size={16} color="var(--mantine-color-gray-5)" />
                      <Box>
                        <Text size="xs" c="dimmed">
                          Expiration Date
                        </Text>
                        <Text size="sm" fw={500}>
                          {paymentDetails.exp.slice(0, 2)}/20{paymentDetails.exp.slice(2)}
                        </Text>
                      </Box>
                    </Group>
                  )}
                </Stack>
              </Group>
            </Stack>
          </Paper>
        )}
      </Stack>
    );
  };

  const renderInactiveActions = () => {
    if (status !== "inactive" || isPendingState) return null;

    return (
      <Stack gap="md">
        <Title order={4}>Create Subscription</Title>
        <Text c="dimmed">
          Select a plan below to create your subscription.
        </Text>
        {loading ? (
          <Loader />
        ) : plans.length > 0 ? (
          <Stack gap="md">
            {plans.map((plan) => (
              <Card
                key={plan.id}
                withBorder
                radius="md"
                p="md"
                style={{
                  cursor: "pointer",
                  borderColor:
                    selectedPlan?.id === plan.id
                      ? "var(--mantine-color-indigo-6)"
                      : undefined,
                }}
                onClick={() => handlePlanSelect(plan)}
              >
                <Group justify="space-between">
                  <div>
                    <Text fw={600}>{plan.name}</Text>
                    <Text size="sm" c="dimmed">
                      {plan.description}
                    </Text>
                  </div>
                  <div style={{ textAlign: "right" }}>
                    <Text fw={700} size="xl">
                      ${plan.amount}
                    </Text>
                    <Text size="xs" c="dimmed">
                      {plan.currency} / month
                    </Text>
                  </div>
                </Group>
              </Card>
            ))}
          </Stack>
        ) : (
          <Text c="dimmed">No plans available</Text>
        )}
      </Stack>
    );
  };

  const renderCancelledActions = () => {
    if (status !== "cancelled" || isPendingState) return null;

    return (
      <Stack gap="md">
        <Title order={4}>Subscription Actions</Title>
        <Group>
          {subscriptionByThisUser ? (
            <>
              <Button
                color="green"
                variant="light"
                leftSection={<IconRefresh size="1rem" />}
                onClick={() => handleAction("resume")}
                loading={actionLoading}
              >
                Resume Subscription
              </Button>
              <Button
                color="blue"
                variant="light"
                leftSection={<IconCreditCard size="1rem" />}
                onClick={openUpdatePayment}
                loading={actionLoading}
              >
                Update Payment (Resume)
              </Button>
            </>
          ) : (
            <Button
              color="blue"
              variant="light"
              leftSection={<IconCreditCard size="1rem" />}
              onClick={openUpdatePayment}
              loading={actionLoading}
            >
              Update Payment (Resume)
            </Button>
          )}
        </Group>
      </Stack>
    );
  };

  return (
    <Stack gap="lg">
      <Stack gap={4}>
        <Title order={2}>Subscription Management</Title>
        <Text c="dimmed">
          Manage your subscription, payment methods, and billing information.
        </Text>
      </Stack>

      {error && (
        <Alert
          icon={<IconX size="1rem" />}
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

      {renderPendingNotification()}

      <Paper withBorder shadow="sm" radius="lg" p="lg">
        <Stack gap="md">
          <Group justify="space-between" align="center">
            <div>
              <Text fw={600} size="lg">
                Current Status
              </Text>
              <Text size="sm" c="dimmed">
                Your subscription status and details
              </Text>
            </div>
            {getStatusBadge()}
          </Group>

          <Divider />

          <Group gap="md">
            <div>
              <Text size="xs" c="dimmed">
                Subscription Owner
              </Text>
              <Text size="sm" fw={500}>
                {subscriptionByThisUser ? "You" : "Another User"}
              </Text>
            </div>
            {entitlement?.activeUntil && (
              <div>
                <Text size="xs" c="dimmed">
                  Active Until
                </Text>
                <Text size="sm" fw={500}>
                  {new Date(entitlement.activeUntil).toLocaleDateString()}
                </Text>
              </div>
            )}
            {entitlement?.planId && (
              <div>
                <Text size="xs" c="dimmed">
                  Plan ID
                </Text>
                <Text size="sm" fw={500}>
                  {entitlement.planId}
                </Text>
              </div>
            )}
          </Group>
        </Stack>
      </Paper>

      {renderActiveActions()}
      {renderInactiveActions()}
      {renderCancelledActions()}

      {/* Show payment form when action is selected */}
      {paymentAction && (
        <Paper withBorder shadow="sm" radius="lg" p="lg">
          <Stack gap="md">
            <div>
              <Title order={4}>
                {paymentAction === "create"
                  ? "Create Subscription"
                  : "Update Payment Method"}
              </Title>
              {paymentAction === "create" && selectedPlan && (
                <Text size="sm" c="dimmed" mt={4}>
                  Selected Plan: <strong>{selectedPlan.name}</strong> - $
                  {selectedPlan.amount} {selectedPlan.currency} per{" "}
                  {selectedPlan.frequency || "month"}
                </Text>
              )}
            </div>

            <Divider />

            <PaymentForm
              user={user}
              planId={selectedPlan?.id}
              action={paymentAction}
              onSuccess={handlePaymentSuccess}
              buttonText={
                paymentAction === "create"
                  ? "Start Subscription"
                  : "Update Payment Method"
              }
            />
          </Stack>
        </Paper>
      )}
    </Stack>
  );
}


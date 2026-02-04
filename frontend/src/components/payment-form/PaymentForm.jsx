// frontend/src/components/PaymentForm.jsx
import { useEffect, useState } from "react";
import { fetchWithAuth } from "../../utils/utils";
import {
  Alert,
  Button,
  Group,
  Stack,
  Text,
  TextInput,
  Loader,
  Paper,
} from "@mantine/core";
import { IconAlertCircle, IconCheck } from "@tabler/icons-react";

const COLLECT_JS_URL =
  "https://deposyt.transactiongateway.com/token/Collect.js";

const TOKENIZATION_KEY = "m8B7kj-XTb9c3-E8vp29-3gJ532";

export default function PaymentForm({
  user,
  planId,
  action = "create",
  onSuccess,
  buttonText,
}) {
  const [email, setEmail] = useState(user?.email || "");
  const [nameOnCard, setNameOnCard] = useState(user?.userName || "");
  const [isLoadingScript, setIsLoadingScript] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const configureCollectJs = () => {
      if (!window.CollectJS || window.__sbCollectConfigured) return;

      window.CollectJS.configure({
        paymentSelector: "#sbPayButton",
        // lightbox is the default variant – no need to specify
        callback: (response) => handleToken(response),
      });

      window.__sbCollectConfigured = true;
      setIsLoadingScript(false);
    };

    const existing = document.getElementById("sb-collectjs");
    if (existing) {
      if (window.CollectJS) {
        configureCollectJs();
      } else {
        existing.addEventListener("load", configureCollectJs);
      }
      return;
    }

    const script = document.createElement("script");
    script.id = "sb-collectjs";
    script.src = COLLECT_JS_URL;
    script.async = true;
    script.setAttribute("data-tokenization-key", TOKENIZATION_KEY);
    // no data-variant → defaults to lightbox

    script.onload = configureCollectJs;
    script.onerror = () => {
      setApiError("Payment form failed to load. Please refresh and try again.");
      setIsLoadingScript(false);
    };

    document.body.appendChild(script);

    return () => {
      script.onload = null;
      script.onerror = null;
    };
  }, []);

  async function handleToken(response) {
    try {
      setApiError(null);
      setSuccessMessage(null);

      if (!response || !response.token) {
        const msg =
          response?.error?.message ||
          "Failed to generate payment token. Please try again.";
        setApiError(msg);
        return;
      }

      const paymentToken = response.token;
      setIsSubmitting(true);

      const endpoint =
        action === "create"
          ? "/api/subscription/create"
          : "/api/subscription/update-payment";

      const body =
        action === "create" ? { paymentToken, planId } : { paymentToken };

      const res = await fetchWithAuth(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });

      if (!res.ok) {
        let message = "Payment failed. Please try again.";
        try {
          const data = await res.json();
          if (data?.message || data?.error) {
            message = data.message || data.error;
          }
        } catch {
          /* ignore */
        }
        throw new Error(message);
      }

      const successMsg =
        action === "create"
          ? "Subscription activated successfully. 🎉"
          : "Payment method updated successfully. 🎉";

      setSuccessMessage(successMsg);

      if (onSuccess) {
        setTimeout(() => onSuccess(), 1500);
      }
    } catch (err) {
      console.error(err);
      setApiError(err.message || "Something went wrong during payment.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Paper withBorder radius="lg" p="md">
      <form onSubmit={(e) => e.preventDefault()}>
        <Stack gap="sm">
          <Text fw={600}>Billing details</Text>

          <TextInput
            label="Email"
            required
            value={email}
            onChange={(e) => setEmail(e.currentTarget.value)}
          />

          <TextInput
            label="Name on card"
            required
            value={nameOnCard}
            onChange={(e) => setNameOnCard(e.currentTarget.value)}
          />

          <Text size="xs" c="dimmed" mt={4}>
            When you click the button below, a secure payment window from our
            provider (Deposyt/NMI) will open to collect your card details.
          </Text>

          {apiError && (
            <Alert
              icon={<IconAlertCircle size={16} />}
              color="red"
              radius="md"
              variant="light"
            >
              {apiError}
            </Alert>
          )}

          {successMessage && (
            <Alert
              icon={<IconCheck size={16} />}
              color="green"
              radius="md"
              variant="light"
            >
              {successMessage}
            </Alert>
          )}

          <Button
            id="sbPayButton"
            type="button"
            mt="md"
            disabled={isLoadingScript || isSubmitting}
            fullWidth
          >
            {isLoadingScript || isSubmitting ? (
              <Group gap={8}>
                <Loader size="xs" />
                <Text size="sm">
                  {isLoadingScript ? "Loading payment…" : "Processing…"}
                </Text>
              </Group>
            ) : (
              buttonText ||
              (action === "create"
                ? "Start subscription"
                : "Update payment method")
            )}
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}

// frontend/src/components/PaymentForm.jsx
import { useEffect, useRef, useState } from "react";
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

// Deposyt Collect.js
const COLLECT_JS_URL =
  "https://deposyt.transactiongateway.com/token/Collect.js";

// Your Deposyt/NMI Collect.js tokenization key (public)
const TOKENIZATION_KEY = "m8B7kj-XTb9c3-E8vp29-3gJ532";

export default function PaymentForm({ user, planId }) {
  const [email, setEmail] = useState(user?.email || "");
  const [nameOnCard, setNameOnCard] = useState(user?.userName || "");
  const [isLoadingScript, setIsLoadingScript] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [apiError, setApiError] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  // Keep latest form data accessible for the Collect.js callback
  const formDataRef = useRef({ email: "", nameOnCard: "" });

  // Keep ref in sync with latest state values
  useEffect(() => {
    formDataRef.current = { email, nameOnCard };
  }, [email, nameOnCard]);

  useEffect(() => {
    if (typeof window === "undefined") return;

    // Already loaded & configured
    if (window.CollectJS && window.__collectJsConfigured) {
      setIsLoadingScript(false);
      return;
    }

    const existingScript = document.querySelector(
      'script[data-collectjs="true"]'
    );

    const configureCollectJs = () => {
      if (!window.CollectJS) return;

      window.CollectJS.configure({
        // This is the BUTTON that triggers tokenization (as in docs)
        paymentSelector: "#sbPayButton",
        variant: "inline",
        fields: {
          // Use ccnumber / ccexp / cvv keys like the NMI examples
          ccnumber: {
            selector: "#sbCcnumber",
            title: "Card Number",
            placeholder: "0000 0000 0000 0000",
          },
          ccexp: {
            selector: "#sbCcexp",
            title: "Expiration",
            placeholder: "MM / YY",
          },
          cvv: {
            display: "show",
            selector: "#sbCvv",
            title: "CVC",
            placeholder: "123",
          },
        },
        // optional: you can style valid/invalid/focus if you want
        // invalidCss: { ... },
        // validCss: { ... },
        // placeholderCss: { ... },
        // focusCss: { ... },

        // Called when tokenization completes
        callback: (response) => {
          handleToken(response);
        },

        // optional, for debugging field-level validation
        // validationCallback: (field, status, message) => {
        //   console.log(field, status, message);
        // },

        fieldsAvailableCallback: () => {
          // Collect.js mounted the iframes into the divs
          setIsLoadingScript(false);
        },

        timeoutDuration: 10000,
        timeoutCallback: () => {
          setApiError(
            "Tokenization took too long. Please check your connection and try again."
          );
          setIsSubmitting(false);
        },
      });

      window.__collectJsConfigured = true;
    };

    if (existingScript) {
      if (window.CollectJS) {
        configureCollectJs();
      } else {
        existingScript.addEventListener("load", configureCollectJs);
      }
      return;
    }

    // Create script tag exactly like NMI/Deposyt docs
    const script = document.createElement("script");
    script.src = COLLECT_JS_URL;
    script.async = true;
    script.setAttribute("data-collectjs", "true");
    script.setAttribute("data-tokenization-key", TOKENIZATION_KEY);
    script.setAttribute("data-variant", "inline");

    script.onload = () => {
      configureCollectJs();
    };
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

  const handleToken = async (response) => {
    try {
      setApiError(null);
      setSuccessMessage(null);

      const paymentToken = response?.token;
      if (!paymentToken) {
        setApiError("Failed to generate payment token. Please try again.");
        return;
      }

      setIsSubmitting(true);

      const res = await fetch("/api/subscription/create", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          paymentToken,
          planId,
        }),
        credentials: "include",
      });

      if (!res.ok) {
        let message = "Payment failed. Please try again.";
        try {
          const data = await res.json();
          if (data?.message || data?.error) {
            message = data.message || data.error;
          }
        } catch {
          // ignore JSON error
        }
        throw new Error(message);
      }

      setSuccessMessage("Subscription activated successfully. 🎉");
    } catch (err) {
      console.error(err);
      setApiError(err.message || "Something went wrong during payment.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Paper withBorder radius="lg" p="md">
      {/* Prevent default submit behavior; Collect.js uses the button click */}
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

          <Stack gap={4}>
            <Text size="sm" fw={500}>
              Card details
            </Text>

            {/* These IDs match what we pass in CollectJS.configure (ccnumber / ccexp / cvv) */}
            <div
              id="sbCcnumber"
              style={{
                border: "1px solid var(--mantine-color-gray-4)",
                borderRadius: "8px",
                padding: "8px 10px",
                minHeight: 40,
              }}
            />
            <Group grow gap="sm" mt={4}>
              <div
                id="sbCcexp"
                style={{
                  border: "1px solid var(--mantine-color-gray-4)",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  minHeight: 40,
                }}
              />
              <div
                id="sbCvv"
                style={{
                  border: "1px solid var(--mantine-color-gray-4)",
                  borderRadius: "8px",
                  padding: "8px 10px",
                  minHeight: 40,
                }}
              />
            </Group>

            <Text size="xs" c="dimmed" mt={4}>
              Card details are securely tokenized by our payment provider
              (Deposyt/NMI). Your card information never reaches our servers.
            </Text>
          </Stack>

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
          >
            {isLoadingScript ? (
              <Group gap={8}>
                <Loader size="xs" />
                <Text size="sm">Loading payment form…</Text>
              </Group>
            ) : isSubmitting ? (
              <Group gap={8}>
                <Loader size="xs" />
                <Text size="sm">Processing payment…</Text>
              </Group>
            ) : (
              "Start subscription"
            )}
          </Button>
        </Stack>
      </form>
    </Paper>
  );
}

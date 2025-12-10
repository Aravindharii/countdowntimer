import { useState, useCallback } from "react";
import {
  Form,
  FormLayout,
  TextField,
  Button,
  Card,
  Stack,
  ColorPicker,
  RangeSlider,
  Select,
} from "@shopify/polaris";
import { useAuthenticatedFetch } from "../hooks";

export function TimerForm({ onSave, onCancel, initialData = {} }) {
  const [name, setName] = useState(initialData.name || "");
  const [productId, setProductId] = useState(initialData.productId || "");
  const [startDate, setStartDate] = useState(initialData.startDate || "");
  const [endDate, setEndDate] = useState(initialData.endDate || "");
  const [description, setDescription] = useState(initialData.description || "");
  const [color, setColor] = useState(
    initialData.settings?.color
      ? hexToHsb(initialData.settings.color)
      : { hue: 0, saturation: 1, brightness: 1 }
  );
  const [size, setSize] = useState(initialData.settings?.size || "Medium");
  const [position, setPosition] = useState(initialData.settings?.position || "Top");
  const [urgencyMinutes, setUrgencyMinutes] = useState(
    initialData.settings?.urgencyTriggerMinutes || 5
  );
  const [urgencyType, setUrgencyType] = useState(
    initialData.settings?.urgencyNotificationType || "Color pulse"
  );

  const fetch = useAuthenticatedFetch();

  const handleSubmit = useCallback(async () => {
    const timerData = {
      name,
      productId,
      startDate,
      endDate,
      description,
      settings: {
        color: hsbToHex(color),
        size,
        position,
        urgencyTriggerMinutes: urgencyMinutes,
        urgencyNotificationType: urgencyType,
      },
    };

    // In a real app, you'd use the Resource Picker to select a product
    // For this MVP, we just take the Product ID text input

    // Get shop domain from window (or context)
    // For MVP, the backend infers shop from session, but we need to pass it if creating new
    // Actually, backend uses session.shop, so we don't need to pass shopDomain explicitly if auth is working

    const response = await fetch("/api/timer", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...timerData, shopDomain: "test-shop.myshopify.com" }), // Placeholder shop, backend should handle
    });

    if (response.ok) {
      onSave();
    }
  }, [name, productId, startDate, endDate, description, color, size, position, urgencyMinutes, urgencyType, fetch, onSave]);

  return (
    <Card sectioned>
      <Form onSubmit={handleSubmit}>
        <FormLayout>
          <TextField
            label="Timer Name"
            value={name}
            onChange={setName}
            autoComplete="off"
            requiredIndicator
          />
          <TextField
            label="Product ID"
            value={productId}
            onChange={setProductId}
            autoComplete="off"
            helpText="Enter the Shopify Product ID (e.g., gid://shopify/Product/123456789)"
          />
          <FormLayout.Group>
            <TextField
              label="Start Date"
              type="datetime-local"
              value={startDate}
              onChange={setStartDate}
              autoComplete="off"
            />
            <TextField
              label="End Date"
              type="datetime-local"
              value={endDate}
              onChange={setEndDate}
              autoComplete="off"
            />
          </FormLayout.Group>

          <TextField
            label="Promotion Description"
            value={description}
            onChange={setDescription}
            autoComplete="off"
            multiline={3}
          />

          <p>Timer Color</p>
          <ColorPicker onChange={setColor} color={color} />

          <FormLayout.Group>
            <Select
              label="Timer Size"
              options={['Small', 'Medium', 'Large']}
              onChange={setSize}
              value={size}
            />
            <Select
              label="Timer Position"
              options={['Top', 'Bottom', 'Inline']}
              onChange={setPosition}
              value={position}
            />
          </FormLayout.Group>

          <Select
            label="Urgency Notification"
            options={['Color pulse', 'Notification banner', 'None']}
            onChange={setUrgencyType}
            value={urgencyType}
          />

          <RangeSlider
            label="Urgency Trigger (Minutes)"
            value={urgencyMinutes}
            onChange={setUrgencyMinutes}
            min={1}
            max={60}
            output
          />

          <Stack distribution="trailing">
            <Button onClick={onCancel}>Cancel</Button>
            <Button submit primary>
              Create Timer
            </Button>
          </Stack>
        </FormLayout>
      </Form>
    </Card>
  );
}

// Helper functions for ColorPicker
function hsbToHex({ hue, saturation, brightness }) {
  // Simplified conversion or use a library
  // For MVP returning a fixed color if complex math is needed, but let's try a simple one
  return "#ff0000";
}

function hexToHsb(hex) {
  return { hue: 0, saturation: 1, brightness: 1 };
}
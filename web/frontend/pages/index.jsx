import { useState, useEffect } from "react";
import {
  Card,
  Page,
  Layout,
  TextContainer,
  Stack,
  Button,
  ResourceList,
  ResourceItem,
  TextStyle,
  EmptyState,
} from "@shopify/polaris";
import { TitleBar } from "@shopify/app-bridge-react";
import { useAuthenticatedFetch } from "../hooks";
import { TimerForm } from "../components/TimerForm";

export default function HomePage() {
  const [timers, setTimers] = useState([]);
  const [isCreating, setIsCreating] = useState(false);
  const fetch = useAuthenticatedFetch();

  const loadTimers = async () => {
    const response = await fetch("/api/timers?shop=test-shop.myshopify.com"); // Backend should infer shop
    if (response.ok) {
      const data = await response.json();
      setTimers(data);
    }
  };

  useEffect(() => {
    loadTimers();
  }, []);

  const handleSave = () => {
    setIsCreating(false);
    loadTimers();
  };

  return (
    <Page narrowWidth>
      <TitleBar
        title="Countdown Timers"
        primaryAction={{
          content: "Create Timer",
          onAction: () => setIsCreating(true),
        }}
      />
      <Layout>
        <Layout.Section>
          {!isCreating && (
            <div style={{ marginBottom: '20px' }}>
              <Button primary onClick={() => setIsCreating(true)}>
                Create Timer
              </Button>
            </div>
          )}
          {isCreating ? (
            <TimerForm onSave={handleSave} onCancel={() => setIsCreating(false)} />
          ) : (
            <Card>
              <ResourceList
                resourceName={{ singular: "timer", plural: "timers" }}
                items={timers}
                renderItem={(item) => {
                  const { id, productId, description, endDate } = item;
                  return (
                    <ResourceItem
                      id={id}
                      accessibilityLabel={`View details for ${description}`}
                    >
                      <Stack>
                        <Stack.Item fill>
                          <h3>
                            <TextStyle variation="strong">{description}</TextStyle>
                          </h3>
                          <div>Product: {productId}</div>
                          <div>Ends: {new Date(endDate).toLocaleString()}</div>
                        </Stack.Item>
                      </Stack>
                    </ResourceItem>
                  );
                }}
                emptyState={
                  <EmptyState
                    heading="Create a countdown timer"
                    action={{
                      content: "Create Timer",
                      onAction: () => setIsCreating(true),
                    }}
                    image="https://cdn.shopify.com/s/files/1/0262/4071/2726/files/emptystate-files.png"
                  >
                    <p>Track sales and promotions with countdown timers.</p>
                  </EmptyState>
                }
              />
            </Card>
          )}
        </Layout.Section>
      </Layout>
    </Page>
  );
}

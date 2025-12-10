// @ts-check
import { join } from "path";
import { readFileSync } from "fs";
import express from "express";
import serveStatic from "serve-static";

import shopify from "./shopify.js";
import productCreator from "./product-creator.js";
import PrivacyWebhookHandlers from "./privacy.js";
import connectDB from "./database.js";
import Timer from "./models/Timer.js";

const PORT = parseInt(
  process.env.BACKEND_PORT || process.env.PORT || "3000",
  10
);

const STATIC_PATH =
  process.env.NODE_ENV === "production"
    ? `${process.cwd()}/frontend/dist`
    : `${process.cwd()}/frontend/`;

const app = express();

// Set up Shopify authentication and webhook handling
app.get(shopify.config.auth.path, shopify.auth.begin());
app.get(
  shopify.config.auth.callbackPath,
  shopify.auth.callback(),
  shopify.redirectToShopifyOrAppRoot()
);
app.post(
  shopify.config.webhooks.path,
  shopify.processWebhooks({ webhookHandlers: PrivacyWebhookHandlers })
);

// Apply CSP headers early
app.use(shopify.cspHeaders());

// If you are adding routes outside of the /api path, remember to
// also add a proxy rule for them in web/frontend/vite.config.js

// Log all incoming requests to debug App Proxy path
app.use((req, res, next) => {
  console.log(`\n[Incoming Request] ${req.method} ${req.url}`);
  next();
});

// Public proxy endpoint for storefront widget

// Public proxy endpoint for storefront widget
// Handle multiple path variations to catch the request regardless of proxy forwarding
app.get(["/api/proxy/timer", "/apps/countdown/api/proxy/timer", "/countdown/api/proxy/timer"], async (req, res) => {
  try {
    console.log('\n========== PROXY TIMER REQUEST ==========');
    console.log('[Proxy] Full request URL:', req.url);
    console.log('[Proxy] Request headers:', JSON.stringify(req.headers, null, 2));
    console.log('[Proxy] Query params:', JSON.stringify(req.query, null, 2));

    const { shop, product } = req.query;

    console.log('[Proxy] Extracted params:', { shop, product });

    if (!shop || !product) {
      console.log('[Proxy] ERROR: Missing required parameters');
      return res.status(400).json({ error: "Missing shop or product parameter" });
    }

    // Mock data for testing
    if (process.env.MOCK_DB === "true") {
      console.log("[Proxy] MOCK_DB=true, serving mock timer data");
      const mockData = {
        shopDomain: shop,
        productId: product,
        startDate: new Date().toISOString(),
        endDate: new Date(Date.now() + 1000 * 60 * 10).toISOString(), // 10 mins from now
        description: "Mock Flash Sale!",
        settings: {
          color: "#ff0000",
          size: "Medium",
          position: "Top",
          urgencyTriggerMinutes: 5,
          urgencyNotificationType: "Color pulse"
        },
        isActive: true
      };
      console.log('[Proxy] Returning mock data:', JSON.stringify(mockData, null, 2));
      return res.json(mockData);
    }

    // Try to find timer with both product ID formats (numeric and GID)
    const productStr = String(product);
    const numericId = productStr.replace('gid://shopify/Product/', '');
    const gidId = productStr.startsWith('gid://') ? productStr : `gid://shopify/Product/${productStr}`;

    console.log('[Proxy] Product ID variations:', {
      original: product,
      productStr,
      numericId,
      gidId
    });

    const query = {
      shopDomain: shop,
      $or: [
        { productId: product },
        { productId: numericId },
        { productId: gidId }
      ],
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    };

    console.log('[Proxy] MongoDB query:', JSON.stringify(query, null, 2));
    console.log('[Proxy] Executing Timer.findOne()...');

    const timer = await Timer.findOne(query);

    console.log('[Proxy] Query result:', timer ? 'FOUND' : 'NOT FOUND');

    if (timer) {
      console.log('[Proxy] Timer details:', {
        _id: timer._id,
        shopDomain: timer.shopDomain,
        productId: timer.productId,
        name: timer.name,
        isActive: timer.isActive,
        startDate: timer.startDate,
        endDate: timer.endDate
      });
    } else {
      // Let's check what timers exist in the database
      console.log('[Proxy] Checking all timers in database...');
      const allTimers = await Timer.find({});
      console.log(`[Proxy] Total timers in DB: ${allTimers.length}`);
      allTimers.forEach((t, idx) => {
        console.log(`[Proxy] Timer ${idx + 1}:`, {
          _id: t._id,
          shopDomain: t.shopDomain,
          productId: t.productId,
          isActive: t.isActive,
          startDate: t.startDate,
          endDate: t.endDate
        });
      });
    }

    if (!timer) {
      console.log('[Proxy] No active timer found - returning 404');
      console.log('========================================\n');
      return res.status(404).json({ error: "No active timer found" });
    }

    console.log('[Proxy] Returning timer data');
    console.log('========================================\n');
    res.set('Content-Type', 'application/json');
    res.status(200).json(timer);
  } catch (error) {
    console.error("[Proxy] ERROR:", error);
    console.error("[Proxy] Error stack:", error.stack);
    console.log('========================================\n');
    res.status(500).json({ error: "Internal server error" });
  }
});

// Parse JSON bodies BEFORE any routes that need it
app.use(express.json());

// Move timer endpoints BEFORE authentication middleware for development
// API endpoint to get timers for a specific shop
app.get("/api/timer", async (req, res) => {
  try {
    const { shop, product } = req.query;

    if (!shop || !product) {
      return res.status(400).json({ error: "Missing shop or product parameter" });
    }

    const timer = await Timer.findOne({
      shopDomain: shop,
      productId: product,
      isActive: true,
      startDate: { $lte: new Date() },
      endDate: { $gte: new Date() }
    });

    if (!timer) {
      return res.status(404).json({ error: "No active timer found" });
    }

    res.json(timer);
  } catch (error) {
    console.error("Timer fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// API endpoint to create a new timer
app.post("/api/timer", async (req, res) => {
  try {
    console.log("Received timer creation request:", JSON.stringify(req.body, null, 2));
    const { shopDomain, productId, name, startDate, endDate, description, settings } = req.body;

    const newTimer = new Timer({
      shopDomain,
      productId,
      name,
      startDate,
      endDate,
      description,
      settings
    });

    console.log("Attempting to save timer:", newTimer);
    await newTimer.save();
    console.log("Timer saved successfully:", newTimer._id);
    res.status(201).json(newTimer);
  } catch (error) {
    console.error("Timer creation error:", error);
    console.error("Error stack:", error.stack);
    res.status(500).json({ error: "Failed to create timer", details: error.message });
  }
});

// API endpoint to get all timers for a shop
app.get("/api/timers", async (req, res) => {
  try {
    const { shop } = req.query;

    if (!shop) {
      return res.status(400).json({ error: "Missing shop parameter" });
    }

    const timers = await Timer.find({ shopDomain: shop });
    res.json(timers);
  } catch (error) {
    console.error("Timers fetch error:", error);
    res.status(500).json({ error: "Internal server error" });
  }
});

// Apply authentication only to routes that need Shopify session
// Timer routes are intentionally left unauthenticated for development

app.get("/api/products/count", shopify.validateAuthenticatedSession(), async (_req, res) => {
  const client = new shopify.api.clients.Graphql({
    session: res.locals.shopify.session,
  });

  const countData = await client.request(`
    query shopifyProductCount {
      productsCount {
        count
      }
    }
  `);

  res.status(200).send({ count: countData.data.productsCount.count });
});

app.post("/api/products", shopify.validateAuthenticatedSession(), async (_req, res) => {
  let status = 200;
  let error = null;

  try {
    await productCreator(res.locals.shopify.session);
  } catch (e) {
    const errorMessage = e instanceof Error ? e.message : String(e);
    console.log(`Failed to process products/create: ${errorMessage}`);
    status = 500;
    error = errorMessage;
  }
  res.status(status).send({ success: status === 200, error });
});

app.use(serveStatic(STATIC_PATH, { index: false }));

app.use("/*", shopify.ensureInstalledOnShop(), async (_req, res, _next) => {
  return res
    .status(200)
    .set("Content-Type", "text/html")
    .send(
      readFileSync(join(STATIC_PATH, "index.html"))
        .toString()
        .replace("%VITE_SHOPIFY_API_KEY%", process.env.SHOPIFY_API_KEY || "")
    );
});



// Connect to MongoDB
connectDB();

app.listen(PORT);

import os
import re

PROJECT_ROOT = os.getcwd()
WEB_INDEX_PATH = os.path.join(PROJECT_ROOT, "web/index.js")

# Code to inject at the top of web/index.js
IMPORT_STATEMENTS = """
import connectDB from "./database.js";
import Timer from "./models/Timer.js";
"""

# API Routes to add before app.listen or export
API_ROUTES = """
// Connect to MongoDB
connectDB();

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
    const { shopDomain, productId, startDate, endDate, description, settings } = req.body;

    const newTimer = new Timer({
      shopDomain,
      productId,
      startDate,
      endDate,
      description,
      settings
    });

    await newTimer.save();
    res.status(201).json(newTimer);
  } catch (error) {
    console.error("Timer creation error:", error);
    res.status(500).json({ error: "Failed to create timer" });
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
"""

def integrate_backend():
    print("🔧 Integrating MongoDB into web/index.js...")
    
    if not os.path.exists(WEB_INDEX_PATH):
        print(f"❌ Error: {WEB_INDEX_PATH} not found")
        return
    
    with open(WEB_INDEX_PATH, 'r') as f:
        content = f.read()
    
    # Check if already integrated
    if "connectDB" in content:
        print("⚠️  MongoDB integration already exists in web/index.js")
        return
    
    # Add imports at the top (after existing imports)
    import_insertion_point = content.find("import express from")
    if import_insertion_point != -1:
        # Find end of import block
        lines = content.split('\n')
        import_end_line = 0
        for i, line in enumerate(lines):
            if line.strip().startswith('import'):
                import_end_line = i
        
        lines.insert(import_end_line + 1, IMPORT_STATEMENTS.strip())
        content = '\n'.join(lines)
    
    # Add API routes before app.listen or export default
    listen_pattern = r'(app\.listen\(|export default app)'
    match = re.search(listen_pattern, content)
    
    if match:
        insertion_point = match.start()
        content = content[:insertion_point] + "\n" + API_ROUTES + "\n" + content[insertion_point:]
    
    # Write back
    with open(WEB_INDEX_PATH, 'w') as f:
        f.write(content)
    
    print("✅ MongoDB integration complete!")
    print("\n📝 Next steps:")
    print("1. Make sure MongoDB is running (mongod)")
    print("2. Run: npm run dev")
    print("3. Visit your Shopify app admin panel")

if __name__ == "__main__":
    if not os.path.exists(os.path.join(PROJECT_ROOT, "shopify.app.toml")):
        print("⚠️  Run this from your Shopify app root directory")
    else:
        integrate_backend()

import os

# Configuration: Define the project structure and file contents based on PRD
PROJECT_ROOT = os.getcwd()

# 1. MongoDB Schema for Timer Data [web:16][web:10]
timer_model_content = """
import mongoose from "mongoose";

const TimerSchema = new mongoose.Schema({
  shopDomain: { type: String, required: true, index: true },
  productId: { type: String, required: true },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  description: { type: String },
  settings: {
    color: { type: String, default: "#ff0000" },
    fontSize: { type: String, default: "16px" },
    urgencyTriggerMinutes: { type: Number, default: 5 }
  },
  isActive: { type: Boolean, default: true }
});

export default mongoose.models.Timer || mongoose.model("Timer", TimerSchema);
"""

# 2. Database Connection Helper
db_connect_content = """
import mongoose from "mongoose";

const connectDB = async () => {
  if (mongoose.connections[0].readyState) return;
  
  try {
    await mongoose.connect(process.env.MONGODB_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log("MongoDB Connected");
  } catch (error) {
    console.error("MongoDB Connection Failed:", error);
  }
};

export default connectDB;
"""

# 3. React Component for Admin Panel (Timer Form) [web:7]
react_form_content = """
import { useState, useCallback } from "react";
import { Card, Form, FormLayout, TextField, Button, DatePicker } from "@shopify/polaris";

export default function TimerForm({ onSubmit }) {
  const [formData, setFormData] = useState({
    description: "",
    color: "#ff0000",
    startDate: new Date(),
    endDate: new Date()
  });

  const handleSubmit = useCallback(() => {
    onSubmit(formData);
  }, [formData, onSubmit]);

  return (
    <Card sectioned>
      <Form onSubmit={handleSubmit}>
        <FormLayout>
          <TextField
            label="Promotion Description"
            value={formData.description}
            onChange={(val) => setFormData({ ...formData, description: val })}
          />
          <TextField
            label="Timer Color (Hex)"
            value={formData.color}
            onChange={(val) => setFormData({ ...formData, color: val })}
          />
          {/* Add DatePickers here for Start/End Date */}
          <Button submit primary>Create Timer</Button>
        </FormLayout>
      </Form>
    </Card>
  );
}
"""

# 4. Preact Widget Logic (Theme Extension) [web:11][web:20]
# This script injects the Preact app logic into the asset file
widget_js_content = """
import { h, render } from 'preact';
import { useState, useEffect } from 'preact/hooks';

const CountdownWidget = ({ productId, shopDomain }) => {
  const [timeLeft, setTimeLeft] = useState(null);
  const [timerData, setTimerData] = useState(null);

  useEffect(() => {
    // Fetch timer config from your App Proxy or public API
    fetch(`https://your-app-url.com/api/timer?shop=${shopDomain}&product=${productId}`)
      .then(res => res.json())
      .then(data => setTimerData(data));
  }, [productId]);

  if (!timerData) return null;

  return (
    <div style={{ color: timerData.settings.color, padding: '10px', border: '1px solid #ddd' }}>
      <h3>{timerData.description}</h3>
      <div className="timer-display">
        {/* Timer calculation logic goes here */}
        Calculating...
      </div>
    </div>
  );
};

// Mount the widget to the DOM element created by the Liquid block
const target = document.getElementById('countdown-timer-root');
if (target) {
  const productId = target.dataset.productId;
  const shopDomain = target.dataset.shopDomain;
  render(<CountdownWidget productId={productId} shopDomain={shopDomain} />, target);
}
"""

# 5. Liquid Block for Theme Extension [web:12][web:15]
liquid_block_content = """
{% schema %}
{
  "name": "Countdown Timer",
  "target": "section",
  "settings": []
}
{% endschema %}

<div id="countdown-timer-root" 
     data-product-id="{{ product.id }}" 
     data-shop-domain="{{ shop.permanent_domain }}">
</div>

<script src="{{ 'timer-widget.js' | asset_url }}" defer="defer"></script>
"""

# Map file paths (relative to project root) to content
files_to_create = {
    "web/database.js": db_connect_content,
    "web/models/Timer.js": timer_model_content,
    "web/frontend/components/TimerForm.jsx": react_form_content,
    "extensions/countdown-timer/assets/timer-widget.js": widget_js_content,
    "extensions/countdown-timer/blocks/timer.liquid": liquid_block_content,
}

def create_files():
    print(f"🚀 Starting automation for project: {os.path.basename(PROJECT_ROOT)}")
    
    for relative_path, content in files_to_create.items():
        full_path = os.path.join(PROJECT_ROOT, relative_path)
        directory = os.path.dirname(full_path)
        
        # Create directory if it doesn't exist
        if not os.path.exists(directory):
            os.makedirs(directory)
            print(f"   Created directory: {directory}")
            
        # Write file content
        with open(full_path, "w", encoding="utf-8") as f:
            f.write(content.strip())
        print(f"✅ Generated: {relative_path}")

    print("\\n🎉 Automation complete! Next steps:")
    print("1. Update 'web/index.js' to use the new 'connectDB' and 'Timer' model.")
    print("2. Run 'npm run dev' to start your Shopify app.")

if __name__ == "__main__":
    # Safety check to ensure we are in a Shopify app folder
    if not os.path.exists(os.path.join(PROJECT_ROOT, "shopify.app.toml")):
        print("⚠️  Error: 'shopify.app.toml' not found.")
        print("Please run this script inside your initialized Shopify app root folder.")
    else:
        create_files()

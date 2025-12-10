import mongoose from "mongoose";

const TimerSchema = new mongoose.Schema({
  shopDomain: { type: String, required: true, index: true },
  productId: { type: String, required: true },
  name: { type: String },
  startDate: { type: Date, required: true },
  endDate: { type: Date, required: true },
  description: { type: String },
  settings: {
    color: { type: String, default: "#ff0000" },
    fontSize: { type: String, default: "16px" },
    size: { type: String, default: "Medium" },
    position: { type: String, default: "Top" },
    urgencyTriggerMinutes: { type: Number, default: 5 },
    urgencyNotificationType: { type: String, default: "Color pulse" }
  },
  isActive: { type: Boolean, default: true }
});

export default mongoose.models.Timer || mongoose.model("Timer", TimerSchema);
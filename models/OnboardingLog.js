import mongoose from "mongoose";

const OnboardingLogSchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true
  },
  action: {
    type: String,
    required: true
  },
  details: {
    type: String,
    default: ""
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("OnboardingLog", OnboardingLogSchema);

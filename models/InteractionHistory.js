import mongoose from "mongoose";

const InteractionHistorySchema = new mongoose.Schema({
  userEmail: {
    type: String,
    required: true
  },
  query: {
    type: String,
    required: true
  },
  response: {
    type: String,
    default: ""
  },
  similarityScore: {
    type: Number,
    default: 0
  },
  timestamp: {
    type: Date,
    default: Date.now
  }
});

export default mongoose.model("InteractionHistory", InteractionHistorySchema);

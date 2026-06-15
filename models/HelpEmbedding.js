import mongoose from "mongoose";

const HelpEmbeddingSchema = new mongoose.Schema({
  title: {
    type: String,
    required: true,
    unique: true
  },
  text: {
    type: String,
    required: true
  },
  tags: {
    type: [String],
    default: []
  },
  vector: {
    type: [Number],
    required: true
  }
});

export default mongoose.model("HelpEmbedding", HelpEmbeddingSchema);

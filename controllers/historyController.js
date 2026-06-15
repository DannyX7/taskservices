import InteractionHistory from "../models/InteractionHistory.js";

// Fetch chat interaction history
export const getInteractionHistory = async (req, res) => {
  try {
    const history = await InteractionHistory.find({}).sort({ timestamp: -1 }).limit(100);
    res.status(200).json({ code: 200, history });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
};

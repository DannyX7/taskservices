import OnboardingLog from "../models/OnboardingLog.js";

// Add user activity log
export const addOnboardingLog = async (req, res) => {
  try {
    const { email, action, details } = req.body;
    if (!email || !action) {
      return res.status(400).json({ code: 400, message: "Email and action are required." });
    }

    const log = new OnboardingLog({
      userEmail: email,
      action: action,
      details: details || ""
    });

    await log.save();
    res.status(200).json({ code: 200, message: "Log captured successfully in MongoDB." });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
};

// Get all logs (for manager/admin view)
export const getAllOnboardingLogs = async (req, res) => {
  try {
    const logs = await OnboardingLog.find({}).sort({ timestamp: -1 }).limit(100);
    res.status(200).json({ code: 200, logs });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
};

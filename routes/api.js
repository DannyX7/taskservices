import express from "express";
import { seedHelpArticles, queryHelpSimilarity } from "../controllers/helpController.js";
import { addOnboardingLog, getAllOnboardingLogs } from "../controllers/logController.js";
import { getInteractionHistory } from "../controllers/historyController.js";

const router = express.Router();

// Help & Vector Search routes
router.post("/help/seed", seedHelpArticles);
router.post("/help/query", queryHelpSimilarity);

// Onboarding Logs routes
router.post("/logs/add", addOnboardingLog);
router.get("/logs/all", getAllOnboardingLogs);

// Interaction History routes
router.get("/history/all", getInteractionHistory);

export default router;

import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import { connectDB } from "./config/db.js";
import apiRouter from "./routes/api.js";

dotenv.config();

const app = express();

// Middlewares
app.use(cors());
app.use(express.json());

// Database Connection
connectDB().then(async () => {
  try {
    const HelpEmbedding = (await import("./models/HelpEmbedding.js")).default;
    const count = await HelpEmbedding.countDocuments({});
    if (count === 0) {
      console.log("No help articles found in MongoDB. Auto-seeding default articles...");
      const { buildDocVectors } = await import("./services/vectorSearchService.js");
      
      const DEFAULT_ARTICLES = [
        {
          title: "How to complete onboarding",
          text: "To complete your onboarding workflow, log in to your developer portal. Go to the 'My Onboarding' checklist menu from the sidebar. Here, you will see a list of steps mapped to your profile. Toggle the status dropdown for any step (e.g. from Pending to In Progress or Completed). Setting a step status to Completed will automatically update the completed date and record it on the manager dashboard.",
          tags: ["complete", "onboarding", "checklist", "status", "developer", "progress"]
        },
        {
          title: "Steps to configure profile",
          text: "To configure your user profile details, navigate to the 'My Profile' menu in the sidebar. In the profile screen, you will see your registered name, email address, phone number, and access role. You can edit your profile information by typing in the input fields and clicking the save button. This will update the user record instantly in the PostgreSQL database.",
          tags: ["configure", "profile", "user", "edit", "email", "phone", "save"]
        },
        {
          title: "Assigning onboarding steps as manager",
          text: "As an onboarding coordinator or manager, you can assign onboarding tasks to developers. Navigate to the 'Onboarding Manager' tab in the sidebar. Fill in the 'Step Name', 'Step Description', select a target date, and select the developer's email address from the dropdown list. Clicking the 'Assign Step' button will create a step in onboarding_steps and link it in progress_tracking.",
          tags: ["assign", "manager", "steps", "onboarding", "developer", "target date"]
        },
        {
          title: "Managing user accounts as admin",
          text: "As a Root Administrator, you can run CRUD operations on user accounts. Navigate to the 'User Manager' console in the sidebar. You can click 'Add New User' to create a custom account (Developer, Manager, or Admin), click the pencil icon to edit existing credentials, or click the trash can icon to delete a user from the system.",
          tags: ["manage", "users", "admin", "crud", "accounts", "create", "delete", "edit"]
        }
      ];

      const { vectorMap } = buildDocVectors(DEFAULT_ARTICLES);
      const articlesToSave = DEFAULT_ARTICLES.map((art, index) => ({
        ...art,
        vector: vectorMap[index].vector
      }));

      await HelpEmbedding.insertMany(articlesToSave);
      console.log("Auto-seeded help articles with vectors successfully!");
    } else {
      console.log(`Found ${count} help articles in MongoDB. Skipping auto-seeding.`);
    }
  } catch (err) {
    console.error("Auto-seeding error:", err);
  }
});

// Mount Routes
app.use("/", apiRouter);

// Default endpoint
app.get("/", (req, res) => {
  res.json({ code: 200, message: "Onboarding Node.js/MongoDB Service is running." });
});

const PORT = process.env.PORT || 8002;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});

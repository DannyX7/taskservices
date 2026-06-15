import HelpEmbedding from "../models/HelpEmbedding.js";
import InteractionHistory from "../models/InteractionHistory.js";
import { buildDocVectors, queryVectorSimilarity } from "../services/vectorSearchService.js";

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

// Seed help documents with calculated vectors
export const seedHelpArticles = async (req, res) => {
  try {
    await HelpEmbedding.deleteMany({});
    
    // We compute the document vectors dynamically for seeding
    const { vectorMap } = buildDocVectors(DEFAULT_ARTICLES);

    const articlesToSave = DEFAULT_ARTICLES.map((art, index) => ({
      ...art,
      vector: vectorMap[index].vector
    }));

    await HelpEmbedding.insertMany(articlesToSave);

    res.status(200).json({
      code: 200,
      message: "Help articles with semantic vectors seeded successfully in MongoDB."
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
};

// Perform local TF-IDF semantic vector search matching
export const queryHelpSimilarity = async (req, res) => {
  try {
    const { query, email } = req.body;
    if (!query || !email) {
      return res.status(400).json({ code: 400, message: "Query and email are required." });
    }

    // Retrieve all articles from MongoDB
    const articles = await HelpEmbedding.find({});
    if (articles.length === 0) {
      return res.status(404).json({ code: 404, message: "No help articles found. Please run seed API first." });
    }

    // Rebuild vectors from db contents to fetch vocab, idf weights, and document embeddings
    const { vocabulary, idf, vectorMap } = buildDocVectors(articles);

    // Compute similarity score
    const results = queryVectorSimilarity(query, vocabulary, idf, vectorMap);

    // Take the best match (top score)
    const bestMatch = results[0];
    const matchedTitle = bestMatch.score > 0.05 ? bestMatch.title : "No relevant help article found";
    const matchedText = bestMatch.score > 0.05 ? bestMatch.text : "I couldn't find a specific help article matching your question. Try asking about 'completing onboarding' or 'configuring profile'.";

    // Log this query in interaction_history
    const history = new InteractionHistory({
      userEmail: email,
      query: query,
      response: matchedTitle,
      similarityScore: bestMatch.score
    });
    await history.save();

    res.status(200).json({
      code: 200,
      query: query,
      bestMatch: {
        title: matchedTitle,
        text: matchedText,
        score: bestMatch.score
      }
    });
  } catch (error) {
    res.status(500).json({ code: 500, message: error.message });
  }
};

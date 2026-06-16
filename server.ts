import express from "express";
import path from "path";
import fs from "fs";
import { GoogleGenAI } from "@google/genai";
import { createServer as createViteServer } from "vite";
import { AppConfig, UserResponse, PhotoAsset, ServerState } from "./src/types";

// Setup server and configuration persistence
const PORT = 3000;
const DATABASE_FILE = path.join(process.cwd(), "database.json");

// Default Configuration values according to user specification
const DEFAULT_CONFIG: AppConfig = {
  landingPage: {
    heading: "Hii Riyaaa 🌸",
    subHeading: "I made something special just for you ❤️",
    button: "Start Our Journey",
    animation: "3D Teddy Waving + Floating Hearts"
  },
  hobbiesSection: {
    title: "Tell Me More About You 💕",
    question: "Which hobbies describe you the best?",
    options: [
      "Dancing 💃",
      "Traveling ✈️",
      "Eating 🍕",
      "Sleeping 😴",
      "Use All Of The Above ✨"
    ],
    responses: {
      "Dancing 💃": "You spread happiness and positive energy wherever you go.",
      "Traveling ✈️": "You love creating memories and exploring beautiful places.",
      "Eating 🍕": "You know how to enjoy the little joys of life.",
      "Sleeping 😴": "You value comfort, peace and relaxation.",
      "Use All Of The Above ✨": "You are a beautiful combination of fun, adventure, comfort and happiness."
    }
  },
  journeyTimeline: [
    { stage: "Strangers 👋", description: "Two people who didn't know each other yet." },
    { stage: "Friends 🌸", description: "The beginning of endless conversations and smiles." },
    { stage: "Best Friends 💕", description: "Sharing secrets, raw laughter, and pure trust." },
    { stage: "Besties Forever! 🌟", description: "A precious bond that stays near and dear, no matter what." }
  ],
  specialSection: {
    title: "Why Riyaaa Is Special ✨",
    cards: [
      "Your Smile 😊",
      "Your Kindness 💖",
      "Your Personality 🌸",
      "Your Energy ✨",
      "Your Hobbies 💃✈️🍕😴",
      "The Happiness You Bring ❤️"
    ]
  },
  proposalSection: {
    background: "Pink Sky + Rose Petals + Floating Hearts + Sparkles",
    message: "Riyaaa ❤️\n\nEvery conversation with you has become the best part of my day.\n\nI believe the most beautiful bonds in life start with a strong, caring, and genuine friendship.\n\nFrom starting as strangers... to becoming friends... to becoming best friends...\n\nI don't know what the future holds,\nbut I know I want us to build an unforgettable bond together.\n\nWill you be my Best Friend? 💖",
    buttons: {
      yes: "Yes 💕",
      thinkAgain: "Think Again 😝"
    },
    successMessage: "You just made me the happiest best friend alive! Best Friends Forever! 💕🌟"
  },
  backgroundMusicUrl: "https://pub-c5e31b5cdafb419a86617dd337458250.r2.dev/love-story-piano.mp3"
};

// Create initial database file if it doesn't exist
function initDatabase(): ServerState {
  if (fs.existsSync(DATABASE_FILE)) {
    try {
      const data = fs.readFileSync(DATABASE_FILE, "utf-8");
      const parsed = JSON.parse(data) as ServerState;
      
      // Auto-migrate old "girlfriend" configs to "Best Friend" focus
      if (parsed.config && parsed.config.proposalSection && parsed.config.proposalSection.message.includes("girlfriend")) {
        parsed.config.journeyTimeline = DEFAULT_CONFIG.journeyTimeline;
        parsed.config.proposalSection = DEFAULT_CONFIG.proposalSection;
        
        // Save the migrated config immediately
        try {
          fs.writeFileSync(DATABASE_FILE, JSON.stringify(parsed, null, 2), "utf-8");
        } catch (err) {
          console.error("Failed to write migrated database.json:", err);
        }
      }
      return parsed;
    } catch (e) {
      console.error("Failed to parse database.json, resetting...", e);
    }
  }

  const initialState: ServerState = {
    config: DEFAULT_CONFIG,
    responses: [],
    photos: [
      {
        id: "1",
        url: "https://images.unsplash.com/photo-1518199266791-5375a83190b7?q=80&w=640",
        caption: "A universe of flower petals for you 🌸",
        createdAt: new Date().toISOString()
      },
      {
        id: "2",
        url: "https://images.unsplash.com/photo-1516589178581-6cd7833ae3b2?q=80&w=640",
        caption: "Sending cozy cute thoughts ❤️",
        createdAt: new Date().toISOString()
      }
    ],
    analytics: {
      pageViews: 0,
      sessions: {}
    }
  };

  fs.writeFileSync(DATABASE_FILE, JSON.stringify(initialState, null, 2), "utf-8");
  return initialState;
}

// In-Memory state synced with disk
let dbState = initDatabase();

function saveDatabase() {
  try {
    fs.writeFileSync(DATABASE_FILE, JSON.stringify(dbState, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save database.json:", e);
  }
}

// Lazy init Gemini SDK
let aiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  if (!aiClient) {
    const key = process.env.GEMINI_API_KEY;
    if (key) {
      aiClient = new GoogleGenAI({
        apiKey: key,
        httpOptions: {
          headers: {
            'User-Agent': 'aistudio-build',
          }
        }
      });
    }
  }
  return aiClient;
}

async function startServer() {
  const app = express();
  
  // Parse larger JSON files (for photo uploads as base64 images)
  app.use(express.json({ limit: "15mb" }));
  app.use(express.urlencoded({ extended: true, limit: "15mb" }));

  // Helper middleware for password checks
  const adminPassword = "riyaaa_special_love"; // Very romantic secret password that the admin can use
  const verifyAdmin = (req: express.Request, res: express.Response, next: express.NextFunction) => {
    const pwd = req.headers["x-admin-password"];
    if (pwd === adminPassword) {
      next();
    } else {
      res.status(401).json({ error: "Unauthorized. Cute password mismatch!" });
    }
  };

  // 🌹 API ROUTES FIRST 🌹

  // Get active configurations and photos
  app.get("/api/config", (req, res) => {
    res.json({
      config: dbState.config,
      photos: dbState.photos,
      pageViews: dbState.analytics.pageViews
    });
  });

  // Track visitor events (load, click hobby, click yes/no)
  app.post("/api/action", (req, res) => {
    const { sessionId, type, payload } = req.body;
    if (!sessionId) {
      return res.status(400).json({ error: "Session identity required" });
    }

    // Update analytics page view counter
    if (type === "page_view") {
      dbState.analytics.pageViews += 1;
      if (!dbState.analytics.sessions[sessionId]) {
        dbState.analytics.sessions[sessionId] = [];
      }
      dbState.analytics.sessions[sessionId].push(new Date().toISOString());
    }

    // Find or create response entry for this visitor session
    let userResponse = dbState.responses.find(r => r.sessionId === sessionId);
    if (!userResponse) {
      userResponse = {
        id: Math.random().toString(36).substr(2, 9),
        timestamp: new Date().toISOString(),
        sessionId,
        hobbies: [],
        proposalStatus: "none",
        stagesVisited: ["Landing Page"]
      };
      dbState.responses.push(userResponse);
    }

    // Add visiting progress stages
    if (type === "visit_stage") {
      const stage = String(payload);
      if (!userResponse.stagesVisited.includes(stage)) {
        userResponse.stagesVisited.push(stage);
      }
    }

    // Update user hobbies selection
    if (type === "select_hobbies") {
      const selected = Array.isArray(payload) ? payload : [payload];
      userResponse.hobbies = selected;
    }

    // Update proposal choice
    if (type === "proposal_answer") {
      const status = payload as "yes" | "think_again" | "none";
      userResponse.proposalStatus = status;
    }

    // Submit custom cute feedback/note
    if (type === "submit_note") {
      userResponse.customNote = String(payload);
    }

    saveDatabase();
    res.json({ success: true, response: userResponse });
  });

  // Fetch full responses and detailed metrics for the Admin Panel dashboard
  app.get("/api/admin/data", verifyAdmin, (req, res) => {
    res.json({
      responses: dbState.responses,
      config: dbState.config,
      photos: dbState.photos,
      analytics: {
        pageViews: dbState.analytics.pageViews,
        totalSessions: Object.keys(dbState.analytics.sessions).length,
        yesCount: dbState.responses.filter(r => r.proposalStatus === "yes").length,
        thinkAgainCount: dbState.responses.filter(r => r.proposalStatus === "think_again").length,
        stagesStats: dbState.responses.reduce((acc, curr) => {
          curr.stagesVisited.forEach(st => {
            acc[st] = (acc[st] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>),
        hobbiesStats: dbState.responses.reduce((acc, curr) => {
          curr.hobbies.forEach(hb => {
            acc[hb] = (acc[hb] || 0) + 1;
          });
          return acc;
        }, {} as Record<string, number>)
      }
    });
  });

  // Update App Config
  app.post("/api/admin/config", verifyAdmin, (req, res) => {
    const newConfig = req.body.config as AppConfig;
    if (newConfig) {
      dbState.config = { ...dbState.config, ...newConfig };
      saveDatabase();
      res.json({ success: true, config: dbState.config });
    } else {
      res.status(400).json({ error: "Invalid configuration body" });
    }
  });

  // Reset analytics/responses
  app.post("/api/admin/reset", verifyAdmin, (req, res) => {
    dbState.responses = [];
    dbState.analytics.pageViews = 0;
    dbState.analytics.sessions = {};
    saveDatabase();
    res.json({ success: true, message: "Responses and page views reset successfully!" });
  });

  // Photo Management (Add new photo)
  app.post("/api/photo/add", verifyAdmin, (req, res) => {
    const { url, caption } = req.body;
    if (!url) {
      return res.status(400).json({ error: "Photo URL or base64 structure required" });
    }

    const newPhoto: PhotoAsset = {
      id: Math.random().toString(36).substr(2, 9),
      url,
      caption: caption || "",
      createdAt: new Date().toISOString()
    };

    dbState.photos.unshift(newPhoto); // Always add to top of gallery
    saveDatabase();
    res.json({ success: true, photo: newPhoto });
  });

  // Photo Management (Delete photo)
  app.post("/api/photo/delete", verifyAdmin, (req, res) => {
    const { id } = req.body;
    if (!id) {
      return res.status(400).json({ error: "Photo ID required" });
    }

    dbState.photos = dbState.photos.filter(p => p.id !== id);
    saveDatabase();
    res.json({ success: true });
  });

  // AI-Powered Sweet Compliment API
  app.post("/api/gemini/generate-compliment", async (req, res) => {
    const { hobbies } = req.body;
    const hobbiesList = Array.isArray(hobbies) && hobbies.length > 0
      ? hobbies.join(", ")
      : "her incredible, charming and sweet nature";

    try {
      const ai = getGeminiClient();
      if (!ai) {
        // Fallback if no Gemini key configured or active
        const sweetFallbacks = [
          `Riyaaa, your light is brighter than all the stars combined. Even when you are sleeping or dancing, you make the world beautiful. ✨`,
          `Riyaaa, you have this rare and warm ability to make anyone smile instantly. You are a treasure of kindness. ❤️`,
          `Your personality is so warm, like a soft cup of cocoa. The universe is luckier to have your positive dancing energy. 🌸`
        ];
        const randomFallback = sweetFallbacks[Math.floor(Math.random() * sweetFallbacks.length)];
        return res.json({ compliment: randomFallback });
      }

      const response = await ai.models.generateContent({
        model: "gemini-3.5-flash",
        contents: `Write an extremely sweet, romantic, heartfelt, and poetic compliment (strictly maximum 2 short sentences) for Riyaaa. Mention her cute hobbies/presence: [${hobbiesList}]. Avoid generic templates, speak about her glowing aura, make it feel ultra-romantic and genuine like a digital love note, using cute emojis. Include her name 'Riyaaa' naturally.`,
        config: {
          temperature: 1.0,
          systemInstruction: "You are the world's most romantic, poetically sweet AI assistant. Your goal is to write custom, heartwarming love notes and beautiful validations specifically tailored for a gorgeous girl named Riyaaa."
        }
      });

      const extractedText = response.text || "Riyaaa, you make my heart skip a beat with everything you do. ❤️";
      res.json({ compliment: extractedText.trim() });
    } catch (e: any) {
      console.error("Gemini Compliment API error:", e);
      res.json({
        compliment: "Riyaaa, you are simply the most beautiful, fun-loving, and soothing soul in my universe. 💕"
      });
    }
  });

  // Vite middleware setup for Development vs Production
  if (process.env.NODE_ENV !== "production") {
    console.log("Vite dev middleware loading...");
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    console.log("Running in Production, serving static assets...");
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      // Use fallback serving index.html for React SPA
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  // Bind to 0.0.0.0 and port 3000
  app.listen(PORT, "0.0.0.0", () => {
    console.log(`Riyaaa Special server has successfully started at http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((e) => {
  console.error("Critical: Failed to launch fullstack server:", e);
});

import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import { GoogleGenAI, Type } from "@google/genai";
import dotenv from "dotenv";

dotenv.config();

const app = express();
const PORT = 3000;

// Increase JSON body limit for captured evidence base64 frames
app.use(express.json({ limit: "50mb" }));
app.use(express.urlencoded({ extended: true, limit: "50mb" }));

// Lazy initialization for Gemini API client
let geminiClient: GoogleGenAI | null = null;
function getGeminiClient(): GoogleGenAI | null {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    return null;
  }
  if (!geminiClient) {
    geminiClient = new GoogleGenAI({
      apiKey: apiKey,
      httpOptions: {
        headers: {
          "User-Agent": "aistudio-build",
        },
      },
    });
  }
  return geminiClient;
}

// Health endpoint
app.get("/api/health", (req, res) => {
  res.json({
    status: "ok",
    service: "SnapOps Vision Server",
    hasGeminiKey: !!process.env.GEMINI_API_KEY,
    timestamp: new Date().toISOString(),
  });
});

// AI Perception & Inspection Endpoint (DevelopmentAIAdapter backend)
app.post("/api/ai/inspect", async (req, res) => {
  const startTime = Date.now();
  try {
    const { imageBase64, currentStep, workpackContext } = req.body;

    if (!imageBase64) {
      return res.status(400).json({ error: "Missing imageBase64 parameter" });
    }

    const ai = getGeminiClient();
    if (!ai) {
      return res.status(503).json({
        error: "GEMINI_API_KEY is not configured on the server. Please switch to 'local' offline AI runtime in SnapOps Settings.",
        code: "MISSING_SERVER_KEY",
      });
    }

    // Clean base64 string if it contains data URI prefix
    const cleanBase64 = imageBase64.replace(/^data:image\/\w+;base64,/, "");

    const prompt = `You are SnapOps Vision, an industrial-grade visual inspection and SOP verification copilot.
Analyze this captured camera frame against the current Standard Operating Procedure (SOP) step and equipment context.

Context:
WorkPack: "${workpackContext?.name || "Industrial Equipment Inspection"}"
Equipment Type: "${workpackContext?.equipmentType || "Industrial Machinery"}"
Current Step Title: "${currentStep?.title || "Component Verification"}"
Current Step Instruction: "${currentStep?.instruction || "Inspect visible components"}"
Required Observations: ${JSON.stringify(currentStep?.requiredObservations || [])}
Validation Rules: ${JSON.stringify(currentStep?.validationRules || [])}

Perform strict multimodal perception:
1. Identify equipment/machinery type and physical condition.
2. Read visible text, labels, model numbers, serial numbers, warning signs, ratings, or voltage indicators.
3. Determine if the required conditions for this specific step are satisfied (PASS), violated (FAIL), or uncertain (ACTION_REQUIRED).
4. Provide concrete, actionable operator guidance on what to do next or how to adjust camera position.

Return your response strictly adhering to the JSON schema.`;

    const response = await ai.models.generateContent({
      model: "gemini-3.8-flash",
      contents: {
        parts: [
          {
            inlineData: {
              mimeType: "image/jpeg",
              data: cleanBase64,
            },
          },
          { text: prompt },
        ],
      },
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            equipmentIdentified: { type: Type.STRING, description: "Identified equipment make/model or component name" },
            detectedState: {
              type: Type.STRING,
              description: "Status: 'Detected' | 'Likely' | 'Uncertain' | 'Not detected'",
            },
            verificationStatus: {
              type: Type.STRING,
              description: "'PASS' | 'WARNING' | 'ACTION_REQUIRED'",
            },
            extractedText: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "All legible text snippets, serials, ratings, or labels seen in image",
            },
            serialOrModelNumber: { type: Type.STRING, description: "Detected serial number or model code if visible" },
            safetyLabelsDetected: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Any safety/warning labels detected e.g. 'HIGH VOLTAGE', 'DANGER', 'CAUTION'",
            },
            observations: {
              type: Type.ARRAY,
              items: { type: Type.STRING },
              description: "Key physical and visual observations regarding components, wiring, switches, or wear",
            },
            guidance: {
              type: Type.STRING,
              description: "Direct concise operator instruction (e.g. 'Move camera closer to the rating plate')",
            },
            confidence: {
              type: Type.NUMBER,
              description: "Confidence value between 0.0 and 1.0",
            },
            rulesEvaluated: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  ruleName: { type: Type.STRING },
                  satisfied: { type: Type.BOOLEAN },
                  detail: { type: Type.STRING },
                },
                required: ["ruleName", "satisfied", "detail"],
              },
            },
          },
          required: [
            "equipmentIdentified",
            "detectedState",
            "verificationStatus",
            "extractedText",
            "observations",
            "guidance",
            "confidence",
          ],
        },
      },
    });

    const parsed = JSON.parse(response.text || "{}");
    const latencyMs = Date.now() - startTime;

    res.json({
      success: true,
      data: parsed,
      telemetry: {
        latencyMs,
        provider: "DevelopmentAIAdapter (Gemini 3.8 Flash)",
        timestamp: new Date().toISOString(),
      },
    });
  } catch (error: any) {
    console.error("AI inspection error:", error);
    res.status(500).json({
      success: false,
      error: error.message || "Failed to process visual frame",
      telemetry: {
        latencyMs: Date.now() - startTime,
        provider: "DevelopmentAIAdapter",
        error: true,
      },
    });
  }
});

async function startServer() {
  // Vite middleware setup
  if (process.env.NODE_ENV !== "production") {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: "spa",
    });
    app.use(vite.middlewares);
  } else {
    const distPath = path.join(process.cwd(), "dist");
    app.use(express.static(distPath));
    app.get("*", (req, res) => {
      res.sendFile(path.join(distPath, "index.html"));
    });
  }

  app.listen(PORT, "0.0.0.0", () => {
    console.log(`[SnapOps Vision] Server running on http://0.0.0.0:${PORT}`);
  });
}

startServer();

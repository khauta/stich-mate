import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import {join} from 'node:path';

const browserDistFolder = join(import.meta.dirname, '../browser');

const app = express();
const angularApp = new AngularNodeAppEngine();

// Body Parser for application/json API payloads
app.use(express.json());

/**
 * Stitch AI Multi-Persona Chat proxy route.
 * Handles lazy loading and initialization of Gemini SDK.
 */
app.post('/api/chat', async (req, res) => {
  try {
    const { message, persona, tone, formatting, assets, engine, chatHistory } = req.body;
    
    const apiKey = process.env['GEMINI_API_KEY'];
    if (!apiKey || apiKey === 'MY_GEMINI_API_KEY') {
      // In case API Key is missing or default placeholder, fallback to local high-fidelity generator
      const simulated = simulateLlmResponse(message, persona, tone);
      res.json(simulated);
      return;
    }

    // Lazy load the GoogleGenAI SDK to prevent load-time crash
    const { GoogleGenAI, Type } = await import('@google/genai');
    
    const ai = new GoogleGenAI({
      apiKey,
      httpOptions: {
        headers: {
          'User-Agent': 'aistudio-build'
        }
      }
    });

    // Prepare system instructions depending on the selected persona
    const instructions = `You are ${persona.toUpperCase()} inside Stitch AI, a multi-agent modular console.
Your responses should match the tone level: "${tone}".
Formatting Restraints:
- Markdown enabled: ${formatting?.markdown ? 'YES' : 'NO'}.
- Emojis enabled: ${formatting?.emojis ? 'YES' : 'NO'}.
- LaTeX mathematical formulas enabled: ${formatting?.latex ? 'YES' : 'NO'}.
- Citations/Sources enabled: ${formatting?.citations ? 'YES' : 'NO'}.

Assets enabled:
- Web Search capability: ${assets?.webSearch ? 'YES' : 'NO'}.
- Computer Vision capability: ${assets?.computerVision ? 'YES' : 'NO'}.

Character temperament guide:
- CODER: High efficiency, clean type-safe structures, pragmatic code snippets, and standard documentation patterns.
- SCIENTIST: Hypothesis testing, analytics, mathematics, double-dollar LaTeX blocks for formula derivations, and standard markdown tables.
- THERAPIST: Warm, empathetic, active validation of mental logs, patient exploratory structures.
- DOCTOR: Clinical diagnostics, medical precision, anatomical referencing and standard medication cautions.
- UNHINGED: Bursting with creative glitchiness, meta-humor, chaotic analogies and sandbox-breaking enthusiasm.

Your output MUST conform strictly to the requested JSON schema. Provide high fidelity text contents.`;

    const modelToUse = engine === 'HEAVY' ? 'gemini-3.1-pro-preview' : 'gemini-3.5-flash';

    // Formulate previous history context
    interface ServerChatItem {
      role: string;
      text: string;
    }
    const contentsPayload: { role: string; parts: { text: string }[] }[] = [];
    if (Array.isArray(chatHistory)) {
      chatHistory.forEach((h: ServerChatItem) => {
        contentsPayload.push({
          role: h.role === 'model' ? 'model' : 'user',
          parts: [{ text: h.text }]
        });
      });
    }
    // Append current prompt
    contentsPayload.push({
      role: 'user',
      parts: [{ text: message }]
    });

    const response = await ai.models.generateContent({
      model: modelToUse,
      contents: contentsPayload,
      config: {
        systemInstruction: instructions,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            text: {
              type: Type.STRING,
              description: "The primary conversational or factual text response in detailed Markdown structure."
            },
            formula: {
              type: Type.STRING,
              description: "Optional. A critical LaTeX mathematical/logical formula representing your derivation, equation, or block (e.g. 'T = \\left( 1 + \\frac{V_0^2 \\sinh^2(ka)}{4E(V_0 - E)} \\right)^{-1}'). Do not wrap in double-dollars."
            },
            tableData: {
              type: Type.ARRAY,
              description: "Optional. An array of experimental data rows or log details related to the query.",
              items: {
                type: Type.OBJECT,
                properties: {
                  runId: { type: Type.STRING, description: "Row ID or sample label" },
                  energy: { type: Type.NUMBER, description: "Numeric energy parameter (eV)" },
                  barrierH: { type: Type.NUMBER, description: "Numeric barrier barrier height" },
                  probability: { type: Type.NUMBER, description: "Numeric transition quantum probability decimal" }
                },
                required: ["runId", "energy", "barrierH", "probability"]
              }
            }
          },
          required: ["text"]
        }
      }
    });

    if (response && response.text) {
      const parsed = JSON.parse(response.text);
      res.json(parsed);
    } else {
      res.status(500).json({ error: 'Empty response generated' });
    }

  } catch (error) {
    console.error('Error in /api/chat express route:', error);
    const err = error as Error;
    res.status(500).json({ error: err.message || 'Llm generation failed' });
  }
});

/**
 * Resilient mock LLM output when API Keys are absent or offline
 */
interface SimulatedLlmResponse {
  text: string;
  formula?: string;
  tableData?: { runId: string; energy: number; barrierH: number; probability: number }[];
}
function simulateLlmResponse(query: string, persona: string, tone: string): SimulatedLlmResponse {
  if (persona === 'coder') {
    return {
      text: `#### Coder Stitch Activity Logs\nOptimal algorithmic implementation for your prompt on \`${query}\` using **${tone}** configurations. High-efficiency execution is complete: \n\n\`\`\`typescript\n// Stitch Node Optimized Router\nexport function solveStitch(query: string): string {\n  const key = 0xDEADC0DE;\n  return \`Output for \${query} verified with hash \${key.toString(16)}\`;\n}\n\`\`\``
    };
  }
  if (persona === 'scientist') {
    return {
      text: `#### Quantum Transmission Analysis\nTesting parameters of barrier interactions on prompt: \`${query}\` under strict **${tone}** constraints. Subatomic probability calculations match standard Tunneling coefficients:`,
      formula: 'T = \\left( 1 + \\frac{V_0^2 \\sinh^2(ka)}{4E(V_0 - E)} \\right)^{-1}',
      tableData: [
        { runId: 'S-0102', energy: 1.45, barrierH: 2.1, probability: 0.0234 },
        { runId: 'S-0103', energy: 1.82, barrierH: 2.1, probability: 0.0891 },
        { runId: 'S-0104', energy: 2.05, barrierH: 2.1, probability: 0.1422 }
      ]
    };
  }
  if (persona === 'therapist') {
    return {
      text: `#### Therapeutic Resonance Session\nI hear your prompt on "${query}" and I understand how that might introduce pressure into your space. Since my tone is set to **${tone}**, let us parse this systematically. What thread of your experience feels like it requires the most care and attention at this exact moment? 🌸`
    };
  }
  if (persona === 'doctor') {
    return {
      text: `#### Clinical Diagnostics Report - [Stitch Health]\nIn analyzing your prompt on "${query}" under standard clinical and physiological pathways with a **${tone}** tone, we explore standard neurological load: \n\n1. Ensure complete restful intervals.\n2. Hydration should meet standard thresholds.\n3. Track ambient telemetry for physical stressors.\n\n*Disclaimer: This is a diagnostic simulation and should be paired with standard clinical investigations.*`
    };
  }
  // Unhinged
  return {
    text: `#### 🌀 INSANE SYSTEM OVERRIDE ACTIVE!!!\nWE ARE GOING TO CRITICAL ENERGY FOR "${query}"!!! Let's break the fourth-wall of your digital grid! Quantum matrices are overloading on **${tone}** configurations! Let's weave a chaotic path together right now! 💥🚀🔬`
  };
}

/**
 * Example Express Rest API endpoints can be defined here.
 * Uncomment and define endpoints as necessary.
 *
 * Example:
 * ```ts
 * app.get('/api/{*splat}', (req, res) => {
 *   // Handle API request
 * });
 * ```
 */

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);

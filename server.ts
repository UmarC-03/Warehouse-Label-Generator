import express from "express";
import path from "path";
import { createServer as createViteServer } from "vite";
import dotenv from "dotenv";

dotenv.config();

async function startServer() {
  const app = express();
  const PORT = 3000;

  app.use(express.json({ limit: "15mb" }));

  // API route to parse extracted document text using OpenRouter
  app.post("/api/parse-orders", async (req, res) => {
    try {
      const { text } = req.body;
      if (!text || text.trim() === "") {
        return res.status(400).json({ error: "No text provided for parsing." });
      }

      const apiKey = process.env.OPENROUTER_API_KEY || process.env.GEMINI_API_KEY; 
      if (!apiKey) {
        return res.status(400).json({ 
          error: "API Key is missing. Please add OPENROUTER_API_KEY or GEMINI_API_KEY in Settings." 
        });
      }

      const isOpenRouter = !!process.env.OPENROUTER_API_KEY;
      const url = isOpenRouter 
        ? "https://openrouter.ai/api/v1/chat/completions"
        : `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;

      const systemPrompt = `You are a professional document extractor designed to identify appliance order items from text.
Analyze the provided text and extract a list of orders.
For each order item, detect:
- heading: The main product code, SKU, of the appliance (e.g., DMO390, GKNI15740N, DTT151). Should NOT be full name (e.g. DBF90W - WHITE BAR FRIDGE DFI-113).
- brand: Optional brand name of the appliance (e.g., DEFY, SAMSUNG, BOSCH, HISENSE). UPPERCASE if found.
- description: The simple type of product/appliance that it is (e.g., must only be "MICROWAVE" instead of "MICROWAVE OLIVE GREEN 250 WATTS" or similar, only "STOVE" instead of "4 PLATE COMPACT STOVE", only "FRIDGE", only "OVEN", only "FREEZER", only "HOB", only "EXTRACTOR", only "WASHING MACHINE", only "DISHWASHER", only "TV", only "DRYER"). Do not include any technical specs, colors, capacities or model codes. Just the generic type of appliance. Strictly UPPERCASE.
- categoryId: Categorize each order item strictly into one of these category IDs based on the appliance type:
  - 'standard' (for general or unrecognized appliances)
  - 'microwaves' (for micro, microwaves, microwave ovens)
  - 'stoves' (for stoves, stove-tops, range cookers)
  - 'fridges' (for fridges, refrigerators, fridge-freezers)
  - 'ovens' (for ovens, built-in ovens, baking ovens)
  - 'freezers' (for chest freezers, deep freezers)
  - 'hobs' (for hob, hobs, stove plates)
  - 'extractors' (for extractors, extractor hoods, range hoods)
  - 'washing_machines' (for washing machines, washers, laundry washing, wash)
  - 'dish_washers' (for dishwashers, dish-washers)
  - 'tvs' (for tvs, monitors, televisions, television)
  - 'dryers' (for tumble dryers, dryers, laundry drying)
- quantity: Integer count of that item (default is 1 if not mentioned).
- costPrice: A full numeric unit price / cost price per unit [usually higher then 500] (exclude VAT if separate, or extract the base cost). OPTIONAL, Use 0 if not found.
- vatRate: Standard VAT percentage. Crucial: If the brand is "HISENSE" (case-insensitive), this must be 22. For any other brand, this must be 15.
- startFrom: Always 1. The AI should never set this to anything else.
- deliveryDate: An optional delivery month/date if found, formatted as "YYYY-MM" or "YYYY-MM-DD".

Your response must be a single, strict, valid JSON object containing an "orders" array.
Example:
{
  "orders": [
    {
      "heading": "DEFY DMO390",
      "brand": "DEFY",
      "description": "MICROWAVE",
      "categoryId": "microwaves",
      "quantity": 10,
      "costPrice": 4500,
      "vatRate": 15,
      "startFrom": 1,
      "deliveryDate": ""
    }
  ]
}

Respond ONLY with valid JSON. Do not include markdown code blocks, explanation or notes.`;

      let parsedOrders = [];

      if (isOpenRouter) {
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${apiKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.APP_URL || "https://ai.studio/build",
            "X-Title": "Label Generator Document Parser"
          },
          body: JSON.stringify({
            model: "openrouter/free",
            messages: [
              { role: "system", content: systemPrompt },
              { role: "user", content: `Here is the parsed document text to extract:\n\n${text}` }
            ]
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`OpenRouter API error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const content = data?.choices?.[0]?.message?.content || "";
        parsedOrders = cleanAndParseJSON(content);
      } else {
        // Gemini fallback using json generation config
        const response = await fetch(url, {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            contents: [
              {
                parts: [
                  { text: systemPrompt + `\n\nExtract strictly JSON for this text:\n\n${text}` }
                ]
              }
            ],
            generationConfig: {
              responseMimeType: "application/json"
            }
          })
        });

        if (!response.ok) {
          const errText = await response.text();
          throw new Error(`Gemini API error: ${response.status} - ${errText}`);
        }

        const data = await response.json();
        const content = data?.candidates?.[0]?.content?.parts?.[0]?.text || "";
        parsedOrders = cleanAndParseJSON(content);
      }

      res.json({ success: true, orders: parsedOrders });
    } catch (e: any) {
      console.error("Endpoint parsing error:", e);
      res.status(500).json({ error: e.message || "Failed to parse document text" });
    }
  });

  // Vite middleware for development
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
    console.log(`Server running on port ${PORT}`);
  });
}

function cleanAndParseJSON(rawText: string) {
  let cleanText = rawText.trim();
  if (cleanText.startsWith("```")) {
    cleanText = cleanText.replace(/^```(json)?\s*/i, "").replace(/\s*```$/i, "");
  }

  try {
    const parsed = JSON.parse(cleanText);
    if (parsed && Array.isArray(parsed.orders)) {
      return parsed.orders;
    } else if (Array.isArray(parsed)) {
      return parsed;
    } else if (parsed && parsed.orders && typeof parsed.orders === "object") {
      return Object.values(parsed.orders);
    }
    return [];
  } catch (err) {
    console.warn("Direct JSON parsing failed, trying fuzzy extraction.", err);
    const arrayMatch = cleanText.match(/\[[\s\S]*\]/);
    if (arrayMatch) {
      try {
        const parsedArray = JSON.parse(arrayMatch[0]);
        if (Array.isArray(parsedArray)) return parsedArray;
      } catch (innerErr) {
        console.error("Fuzzy parsing failed.", innerErr);
      }
    }
    throw new Error("Failed to parse clean JSON from model response.");
  }
}

startServer();

import express from "express";
import cors from "cors";
import multer from "multer";
import dotenv from "dotenv";
import fs from "fs/promises";
import path from "path";
import { fileURLToPath } from "url";
import { nanoid } from "nanoid";

dotenv.config();

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const DB_PATH = path.join(__dirname, "db.json");

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));

const upload = multer({ storage: multer.memoryStorage(), limits: { fileSize: 12 * 1024 * 1024 } });

const OPENROUTER_API_KEY = process.env.OPENROUTER_API_KEY;
// Try these in order — free models on OpenRouter get rate-limited under heavy
// shared traffic, so fall back to the next one if the first is busy.
const VISION_MODELS = [
  "google/gemma-4-31b-it:free",
  "google/gemma-4-26b-a4b-it:free",
  "nvidia/nemotron-3-nano-omni-30b-a3b-reasoning:free",
];

// ---------- tiny JSON "database" helpers ----------
async function readDb() {
  try {
    const raw = await fs.readFile(DB_PATH, "utf-8");
    return JSON.parse(raw);
  } catch {
    return [];
  }
}

async function writeDb(items) {
  await fs.writeFile(DB_PATH, JSON.stringify(items, null, 2));
}

function daysUntil(dateStr) {
  if (!dateStr) return null;
  const target = new Date(dateStr);
  const now = new Date();
  const diffMs = target.setHours(0, 0, 0, 0) - now.setHours(0, 0, 0, 0);
  return Math.round(diffMs / (1000 * 60 * 60 * 24));
}

function withStatus(item) {
  const days = daysUntil(item.warrantyExpiry);
  let status = "unknown";
  if (days !== null) {
    if (days < 0) status = "expired";
    else if (days <= 30) status = "expiring_soon";
    else status = "active";
  }
  return { ...item, daysRemaining: days, status };
}

// ---------- routes ----------

// Health check
app.get("/api/health", (_req, res) => res.json({ ok: true }));

// Extract structured data from a photographed bill using Claude vision
app.post("/api/extract-bill", upload.single("image"), async (req, res) => {
  try {
    if (!req.file) return res.status(400).json({ error: "No file uploaded (field name: image)" });

    const base64 = req.file.buffer.toString("base64");
    const mediaType = req.file.mimetype || "image/jpeg";

    const prompt = `You are looking at a photo of a purchase bill/receipt/invoice, possibly crumpled, faded, or in Hindi/English/Hinglish.
Extract the following fields as strict JSON only, no prose, no markdown fences:
{
  "productName": string,          // e.g. "LG 1.5 Ton Split AC"
  "category": string,             // e.g. "Appliance", "Electronics", "Furniture"
  "seller": string,               // shop/store name
  "purchaseDate": string,         // ISO format YYYY-MM-DD, best guess if unclear
  "price": number,                // numeric amount only, no currency symbol
  "currency": string,             // e.g. "INR"
  "warrantyDurationMonths": number, // best guess from bill text; if not stated, use typical duration for that product category
  "notes": string                 // anything else useful, e.g. model/serial number
}
If a field truly cannot be determined, use null for that field (except warrantyDurationMonths, always give your best estimate).
Respond with ONLY the JSON object.`;

    const isPdf = mediaType === "application/pdf";
    const fileContentBlock = isPdf
      ? { type: "file", file: { filename: req.file.originalname || "bill.pdf", file_data: `data:${mediaType};base64,${base64}` } }
      : { type: "image_url", image_url: { url: `data:${mediaType};base64,${base64}` } };

    let orResponse = null;
    let lastErrText = "";
    for (const model of VISION_MODELS) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 15000); // give up on this model after 15s

        orResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${OPENROUTER_API_KEY}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            model,
            messages: [
              {
                role: "user",
                content: [{ type: "text", text: prompt }, fileContentBlock],
              },
            ],
          }),
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (orResponse.ok) break; // success, stop trying more models

        lastErrText = await orResponse.text();
        console.warn(`Model ${model} failed, trying next:`, lastErrText);
      } catch (err) {
        lastErrText = err.name === "AbortError" ? "Timed out after 15s" : String(err);
        console.warn(`Model ${model} errored, trying next:`, lastErrText);
        orResponse = null;
      }
    }

    if (!orResponse || !orResponse.ok) {
      console.error("All extraction models failed:", lastErrText);
      return res.status(502).json({ error: "Extraction service is busy right now, please try again in a moment", detail: lastErrText });
    }

    const orData = await orResponse.json();
    const raw = orData.choices?.[0]?.message?.content?.trim() || "{}";
    const cleaned = raw.replace(/^```json\s*/i, "").replace(/```$/i, "").trim();

    let extracted;
    try {
      extracted = JSON.parse(cleaned);
    } catch {
      return res.status(502).json({ error: "Could not parse extraction result", raw });
    }

    // Compute warranty expiry from purchase date + duration
    let warrantyExpiry = null;
    if (extracted.purchaseDate && extracted.warrantyDurationMonths) {
      const d = new Date(extracted.purchaseDate);
      if (!isNaN(d)) {
        d.setMonth(d.getMonth() + Number(extracted.warrantyDurationMonths));
        warrantyExpiry = d.toISOString().slice(0, 10);
      }
    }

    res.json({ ...extracted, warrantyExpiry, billImageBase64: base64, billImageMediaType: mediaType });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: "Extraction failed", detail: String(err) });
  }
});

// List all products (with computed status)
app.get("/api/bills", async (_req, res) => {
  const items = await readDb();
  res.json(items.map(withStatus).sort((a, b) => (a.daysRemaining ?? 1e9) - (b.daysRemaining ?? 1e9)));
});

// Get single product
app.get("/api/bills/:id", async (req, res) => {
  const items = await readDb();
  const item = items.find((i) => i.id === req.params.id);
  if (!item) return res.status(404).json({ error: "Not found" });
  res.json(withStatus(item));
});

// Save a new product (after user confirms/edits extracted fields)
app.post("/api/bills", async (req, res) => {
  const items = await readDb();
  const newItem = {
    id: nanoid(10),
    createdAt: new Date().toISOString(),
    ...req.body,
  };
  items.push(newItem);
  await writeDb(items);
  res.status(201).json(withStatus(newItem));
});

// Update a product
app.put("/api/bills/:id", async (req, res) => {
  const items = await readDb();
  const idx = items.findIndex((i) => i.id === req.params.id);
  if (idx === -1) return res.status(404).json({ error: "Not found" });
  items[idx] = { ...items[idx], ...req.body, id: items[idx].id };
  await writeDb(items);
  res.json(withStatus(items[idx]));
});

// Delete a product
app.delete("/api/bills/:id", async (req, res) => {
  const items = await readDb();
  const filtered = items.filter((i) => i.id !== req.params.id);
  await writeDb(filtered);
  res.status(204).end();
});

const PORT = process.env.PORT || 4000;
app.listen(PORT, () => console.log(`Raksha backend running on http://localhost:${PORT}`));
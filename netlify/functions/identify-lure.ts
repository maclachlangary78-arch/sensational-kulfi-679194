import type { Config } from "@netlify/functions";
import Anthropic from "@anthropic-ai/sdk";
import { LURE_CATALOG, SKIRT_COLOURS } from "../../src/lib/catalog.js";
import { corsHeaders, error, getDeviceId, json, optText } from "../lib/http.js";

const MAX_BYTES = 2 * 1024 * 1024;
const anthropic = new Anthropic();

// The built-in catalogue is sent with every request so the model answers with names the picker already knows.
const CATALOGUE = LURE_CATALOG.map((b) => {
  const models = b.models
    .map((m: { model: string; sizes?: { value: string }[] }) => `  - ${b.brand} ${m.model}: sizes ${(m.sizes || []).map((s) => s.value).join(", ") || "any"}`)
    .join("\n");
  return `${b.brand} (colours: ${b.colours.join(", ")})\n${models}`;
}).join("\n");

const PROMPT = `You identify offshore trolling / game fishing lures from a photo taken by an angler.

Known lures (brand, model and the maker's sizes):
${CATALOGUE}

Common skirt colours: ${SKIRT_COLOURS.join(", ")}

Rules:
- If the lure matches a known model, set brand and model exactly as written above, and pick size from that model's list.
- If it's a different lure, give your best brand and model name, or leave them empty if you really can't tell.
- Colour: use a known colour name when it fits, otherwise a short description like "Blue/Pink".
- Size: only fill it if you can estimate it (e.g. from a packet, label or something for scale). Leave it empty otherwise.
- Leave any field empty rather than guessing wildly — the angler fills in the rest.
- If the photo isn't a fishing lure, set isLure to false.
Call the suggest_lure tool with your answer.`;

const TOOL = {
  name: "suggest_lure",
  description: "Report the identified lure. Use empty strings for anything you can't tell.",
  input_schema: {
    type: "object" as const,
    properties: {
      isLure: { type: "boolean", description: "Whether the photo shows a fishing lure" },
      brand: { type: "string", description: "Maker, e.g. Pakula" },
      model: { type: "string", description: "Model name without the brand, e.g. Sprocket" },
      colour: { type: "string", description: "Colour name, e.g. Lumo or Black/Purple" },
      size: { type: "string", description: 'Size, e.g. 310mm or 10"' },
      confidence: { type: "string", enum: ["high", "medium", "low"] },
      note: { type: "string", description: "One short sentence for the angler, e.g. what to double-check" },
    },
    required: ["isLure", "brand", "model", "colour", "size", "confidence", "note"],
  },
};

// Suggests a lure's brand, model, colour and size from a JPEG the app has already resized on the device.
export default async (req: Request) => {
  if (req.method === "OPTIONS") return new Response(null, { headers: corsHeaders });
  if (req.method !== "POST") return error("Method not allowed", 405);
  if (!getDeviceId(req)) return error("Missing device ID", 401);

  const buf = await req.arrayBuffer();
  if (buf.byteLength === 0 || buf.byteLength > MAX_BYTES) return error("Photo must be under 2 MB");

  try {
    const message = await anthropic.messages.create({
      model: "claude-sonnet-5",
      max_tokens: 1024,
      system: PROMPT,
      tools: [TOOL],
      tool_choice: { type: "tool", name: TOOL.name },
      messages: [
        {
          role: "user",
          content: [
            { type: "image", source: { type: "base64", media_type: "image/jpeg", data: Buffer.from(buf).toString("base64") } },
            { type: "text", text: "What lure is this?" },
          ],
        },
      ],
    });
    const block = message.content.find((b) => b.type === "tool_use");
    const out = (block && block.type === "tool_use" ? block.input : {}) as Record<string, unknown>;
    return json({
      isLure: out.isLure !== false,
      brand: optText(out.brand, 40) || "",
      model: optText(out.model, 60) || "",
      colour: optText(out.colour, 28) || "",
      size: optText(out.size, 30) || "",
      confidence: ["high", "medium", "low"].includes(out.confidence as string) ? out.confidence : "low",
      note: optText(out.note, 200) || "",
    });
  } catch (err) {
    console.error("identify-lure failed", err);
    return error("Couldn't identify the lure right now — try again", 502);
  }
};

export const config: Config = { path: "/api/identify-lure" };

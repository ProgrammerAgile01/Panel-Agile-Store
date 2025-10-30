import { type NextRequest, NextResponse } from "next/server";

export const runtime = "nodejs";

/** =========================
 *  Local translator (fallback)
 *  — ringan, deterministik; EN <-> ID
 *  ========================= */
const PROPER_NOUNS = [
  "Agile Store",
  "Rent Vix Pro",
  "Absen Fast",
  "Salesman Apps",
  "Ayo Hidupkan Rumah Ibadah",
  "Nata Banyu",
];

const GLOSSARY_EN2ID: Record<string, string> = {
  "Explore Products": "Lihat Produk",
  "Start Free": "Mulai Gratis",
  "Start Now": "Mulai Sekarang",
  "Learn More": "Pelajari Lebih Lanjut",
  "Get Started": "Mulai",
  "Choose Plan": "Pilih Paket",
  "Our Products": "Produk Kami",
  "Why Agile Store": "Mengapa Agile Store",
  "How It Works": "Cara Kerjanya",
  "Simple Pricing for Everyone": "Harga Sederhana untuk Semua",
  "Ready to boost your business with Agile Store?":
    "Siap meningkatkan bisnis Anda dengan Agile Store?",
  "Trusted by 100+ businesses and organizations":
    "Dipercaya oleh 100+ bisnis dan organisasi",
  Email: "Email",
  Phone: "Telepon",
  Address: "Alamat",
  Primary: "Utama",
  Secondary: "Sekunder",
  Monthly: "Bulanan",
  Yearly: "Tahunan",
  Feature: "Fitur",
  Features: "Fitur",
  Description: "Deskripsi",
  Manage: "Kelola",
  Management: "Manajemen",
  Affordable: "Terjangkau",
  Pricing: "Harga",
  Scalable: "Dapat Diskalakan",
  Support: "Dukungan",
  Setup: "Penyiapan",
  "Start using instantly": "Langsung gunakan",
  "Choose your product": "Pilih produk Anda",
  "Select a package": "Pilih paket",
};

const GLOSSARY_ID2EN: Record<string, string> = Object.fromEntries(
  Object.entries(GLOSSARY_EN2ID).map(([en, id]) => [id, en])
);

const STRICT = String(process.env.TRANSLATE_STRICT ?? "0") === "1";
const reUrl = /\bhttps?:\/\/[^\s]+/i;
const reCodey = /^([A-Z0-9\-_]{2,}|[a-z0-9\-_]{2,})(\.[A-Za-z0-9\-_]+)*$/;
const reMostlySymbols = /^[\W_]+$/;
const reDigitsOnly = /^[\d\s.,:/\-+()]+$/;

function applyCasing(base: string, original: string): string {
  if (!base) return base;
  if (original && original.toUpperCase() === original)
    return base.toUpperCase();
  const words = original.split(" ").filter(Boolean);
  const isTitle =
    words.length > 0 && words.every((w) => w[0] === w[0]?.toUpperCase());
  if (isTitle) {
    return base
      .split(" ")
      .map((w) => (w ? w[0].toUpperCase() + w.slice(1).toLowerCase() : w))
      .join(" ");
  }
  if (/^[A-Z]/.test(original)) {
    return base.length ? base[0].toUpperCase() + base.slice(1) : base;
  }
  return base;
}

function preserveProperNouns(s: string) {
  let out = s;
  for (const pn of PROPER_NOUNS) {
    const safe = pn.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
    out = out.replace(new RegExp(safe, "gi"), pn);
  }
  return out;
}

function dictLookup(word: string, dir: "en2id" | "id2en"): string | null {
  const table = dir === "en2id" ? GLOSSARY_EN2ID : GLOSSARY_ID2EN;
  if (table[word]) return table[word];
  const lower = word.toLowerCase();
  const hit = Object.keys(table).find((k) => k.toLowerCase() === lower);
  return hit ? applyCasing(table[hit], word) : null;
}

function translateSimple(source: string, dir: "en2id" | "id2en") {
  const raw = source?.toString() ?? "";
  if (!raw) return "";

  if (
    reUrl.test(raw) ||
    reMostlySymbols.test(raw) ||
    reDigitsOnly.test(raw) ||
    (STRICT && reCodey.test(raw))
  ) {
    return raw;
  }

  let s = preserveProperNouns(raw);
  const tokens = s.split(/(\s+)/);
  const out: string[] = [];
  for (let i = 0; i < tokens.length; i++) {
    const t = tokens[i];
    if (i % 2 === 1) {
      out.push(t);
      continue;
    }
    let consumed = false;
    const tryN = (n: number) => {
      if (i + 2 * (n - 1) >= tokens.length) return null;
      let phrase = "";
      for (let k = 0; k < n; k++) phrase += (k ? " " : "") + tokens[i + 2 * k];
      const hit = dictLookup(phrase, dir);
      if (hit) {
        out.push(applyCasing(hit, phrase));
        i += 2 * (n - 1);
        consumed = true;
        return hit;
      }
      return null;
    };
    tryN(3) ?? tryN(2);
    if (consumed) continue;
    const one = dictLookup(t, dir);
    out.push(one ? applyCasing(one, t) : t);
  }
  return out.join("");
}

/** =========================
 *  Gemini provider (optional)
 *  — hanya dipakai kalau GEMINI_API_KEY ada
 *  ========================= */
async function translateWithGeminiBatch(
  texts: string[],
  targetLanguage: string
) {
  const apiKey = process.env.GEMINI_API_KEY?.trim();
  if (!apiKey) {
    throw new Error("Translation service not configured");
  }

  // Kita minta output JSON array, supaya 1:1 dengan input
  const prompt =
    `Translate the following Indonesian texts to ${targetLanguage}. ` +
    `Return ONLY a JSON array of strings (no extra text), in the exact same order and length as the input.\n` +
    `texts = ${JSON.stringify(texts)}`;

  const resp = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-1.5-flash-latest:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        contents: [{ parts: [{ text: prompt }] }],
        generationConfig: {
          temperature: 0.1,
          maxOutputTokens: 2048,
          topP: 0.8,
          topK: 10,
        },
      }),
    }
  );

  if (!resp.ok) {
    const errText = await resp.text().catch(() => "Unknown error");
    throw new Error(`Translation service error: ${resp.status} - ${errText}`);
  }

  const data = await resp.json().catch(() => ({} as any));
  const raw = data?.candidates?.[0]?.content?.parts?.[0]?.text?.trim() ?? "";

  // Bisa jadi dibungkus ```json ... ```
  const jsonStr = raw.replace(/^\s*```(?:json)?\s*|\s*```\s*$/g, "");
  let arr: any;
  try {
    arr = JSON.parse(jsonStr);
  } catch {
    // fallback: kalau ternyata bukan array, jadikan satuan untuk tiap teks (biar tidak meledak di FE)
    return texts.map(() => raw || "");
  }
  if (!Array.isArray(arr) || arr.length !== texts.length) {
    // fallback lembut agar FE tetap jalan
    return texts.map((_, i) => String(arr?.[i] ?? texts[i]));
  }
  return arr.map((x: any) => String(x ?? ""));
}

/** =========================
 *  API handler
 *  ========================= */
export async function POST(request: NextRequest) {
  try {
    // --- parsing body (sama gaya: try/catch, error 400) ---
    let body: any;
    try {
      body = await request.json();
    } catch (parseError) {
      console.error("Failed to parse request body:", parseError);
      return NextResponse.json(
        { error: "Invalid request body", data: [], success: false },
        { status: 400 }
      );
    }

    // Terima baik kontrak lama {from,to,texts[]} maupun gaya contoh {text,targetLanguage}
    const from = String(body?.from ?? "id").toLowerCase();
    const to = String(body?.to ?? body?.targetLanguage ?? "en").toLowerCase();

    // Normalisasi jadi array
    let texts: string[] = [];
    if (Array.isArray(body?.texts)) {
      texts = body.texts
        .map((x: any) => String(x ?? ""))
        .filter((s: string) => s.length);
    } else if (typeof body?.text === "string") {
      const t = body.text.trim();
      if (t) texts = [t];
    }

    if (!Array.isArray(texts) || texts.length === 0) {
      return NextResponse.json(
        {
          error: "texts must be a non-empty array (or provide 'text' string)",
          data: [],
          success: false,
        },
        { status: 400 }
      );
    }

    // --- provider switch: Gemini jika tersedia, else local ---
    const haveGemini = !!process.env.GEMINI_API_KEY?.trim();
    let out: string[] | null = null;

    if (haveGemini) {
      // panggil Gemini; jika error → fallback lokal (dan kita log)
      try {
        out = await translateWithGeminiBatch(
          texts,
          to.startsWith("en") ? "English" : to
        );
      } catch (e) {
        console.error("Gemini translate error:", e);
        out = null;
      }
    }

    if (!out) {
      // local fallback (EN <-> ID saja)
      let dir: "en2id" | "id2en";
      if (from.startsWith("en") && to.startsWith("id")) dir = "en2id";
      else if (from.startsWith("id") && to.startsWith("en")) dir = "id2en";
      else {
        // kalau bukan pasangan didukung, kembalikan input (fail-soft)
        return NextResponse.json({
          error: `local translator only supports en<->id (got ${from}->${to})`,
          data: texts,
          original: texts,
          success: false,
        });
      }
      out = texts.map((t) => translateSimple(t, dir));
    }

    // bersihkan kutip jika ada (mirip contoh kamu)
    const cleaned = out.map((s) => s.replace(/^["']|["']$/g, "").trim());

    return NextResponse.json({
      data: cleaned,
      original: texts,
      success: true,
      provider: haveGemini ? "gemini-or-fallback" : "local",
    });
  } catch (error) {
    console.error("Translation API error:", error);

    // fallback: kembalikan teks asli bila bisa diambil ulang
    let fallback: string[] = [];
    try {
      const cloned = await request.clone().json();
      if (Array.isArray(cloned?.texts)) {
        fallback = cloned.texts.map((x: any) => String(x ?? ""));
      } else if (typeof cloned?.text === "string") {
        fallback = [cloned.text];
      }
    } catch {
      // ignore
    }

    return NextResponse.json(
      {
        error: "Internal server error",
        data: fallback.length ? fallback : [],
        original: fallback.length ? fallback : [],
        success: false,
      },
      { status: 500 }
    );
  }
}

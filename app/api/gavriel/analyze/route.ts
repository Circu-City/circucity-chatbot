import { NextResponse } from "next/server";
import OpenAI from "openai";
import { z } from "zod";
import prisma from "@/lib/db";
import { getSession, getTokenFromRequest, verifyToken } from "@/lib/auth";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Maximum image size: 10MB raw (~13.5MB in base64)
const MAX_BASE64_LENGTH = 14 * 1024 * 1024;

const inputSchema = z.object({
  imageDataUrl: z.string().min(1, "Product photo data is required").max(MAX_BASE64_LENGTH, "Image exceeds maximum size limit of 10MB"),
  condition: z.enum(["new", "like_new", "used", "refurb"]).optional().default("used"),
  tone: z.enum(["professional", "luxury", "casual", "trendy"]).optional().default("professional"),
  marketplaces: z.array(z.string().max(50)).max(10).optional().default(["shopify", "ebay", "amazon"]),
  currency: z.string().max(10).optional().default("EUR"),
});

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
  baseURL: process.env.OPENAI_BASE_URL || "https://api.groq.com/openai/v1",
});

// Helper to validate image format and magic bytes
function validateImageBuffer(dataUrl: string): { valid: boolean; mimeType: string; error?: string } {
  const match = dataUrl.match(/^data:(image\/(jpeg|png|webp|jpg));base64,(.+)$/s);
  if (!match) {
    return { valid: false, mimeType: "", error: "Invalid image format. Must be a base64 encoded data URI (JPEG, PNG, or WebP)." };
  }

  const mimeType = match[1];
  const b64Data = match[3];

  let buffer: Buffer;
  try {
    buffer = Buffer.from(b64Data, "base64");
  } catch {
    return { valid: false, mimeType, error: "Malformed base64 image data." };
  }

  if (buffer.length < 16) {
    return { valid: false, mimeType, error: "Image file is empty or corrupted." };
  }

  // Check magic bytes:
  // JPEG: FF D8 FF
  // PNG: 89 50 4E 47
  // WebP: 52 49 46 46 (RIFF) ... 57 45 42 50 (WEBP)
  const isJpeg = buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;
  const isPng = buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;
  const isWebp = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;

  if (!isJpeg && !isPng && !isWebp) {
    return { valid: false, mimeType, error: "Uploaded file does not match a supported image signature (JPEG, PNG, WebP)." };
  }

  return { valid: true, mimeType };
}

// Plan tier quotas (listings per month)
const TIER_QUOTAS: Record<string, number> = {
  free: 15,          // Free Beta tier
  growth: 500,       // Growth Tier
  pro: 2000,         // Professional Tier
  professional: 2000,
  enterprise: 999999,// Enterprise Unlimited
};

export async function POST(req: Request) {
  try {
    // 1. Authentication Enforcement
    let session = await getSession();
    if (!session) {
      const authHeader = req.headers.get("Authorization");
      if (authHeader?.startsWith("Bearer ")) {
        const token = authHeader.substring(7);
        session = verifyToken(token);
      }
    }

    if (!session?.id) {
      return NextResponse.json(
        { success: false, error: "Authentication required. Please sign in to access Gavriel AI Vision." },
        { status: 401 }
      );
    }

    // 2. Input Validation
    const body = await req.json();
    const parsed = inputSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { success: false, error: parsed.error.issues[0]?.message || "Invalid input parameters" },
        { status: 400 }
      );
    }

    const { imageDataUrl, condition, tone, marketplaces, currency } = parsed.data;

    // Validate binary image integrity
    const imgValidation = validateImageBuffer(imageDataUrl);
    if (!imgValidation.valid) {
      return NextResponse.json(
        { success: false, error: imgValidation.error },
        { status: 422 }
      );
    }

    // 3. Quota & Subscription Check
    const user = await prisma.user.findUnique({
      where: { id: session.id },
      include: {
        stores: {
          include: {
            subscriptions: {
              where: { status: { in: ["active", "trialing"] } },
              orderBy: { createdAt: "desc" },
              take: 1,
            },
          },
          take: 1,
        },
      },
    });

    if (!user) {
      return NextResponse.json({ success: false, error: "User account not found." }, { status: 404 });
    }

    // Determine current plan
    const activeSub = user.stores?.[0]?.subscriptions?.[0];
    const plan = activeSub?.plan?.toLowerCase() || "free";
    const quotaLimit = TIER_QUOTAS[plan] ?? 15;

    // Calculate usage in the current 30-day billing window
    const now = new Date();
    const periodStart = new Date(now.getFullYear(), now.getMonth(), 1);

    const usageCount = await prisma.listingRecord.count({
      where: {
        userId: user.id,
        createdAt: { gte: periodStart },
      },
    });

    if (usageCount >= quotaLimit) {
      return NextResponse.json(
        {
          success: false,
          error: `Monthly listing quota exceeded (${usageCount}/${quotaLimit} used on ${plan.toUpperCase()} plan). Please upgrade your tier for higher volume.`,
          plan,
          usage: usageCount,
          limit: quotaLimit,
        },
        { status: 402 }
      );
    }

    // 4. Vision Model Execution
    const conditionMap: Record<string, string> = {
      new: "Brand New with Original Packaging / Tags",
      like_new: "Like New / Mint condition, flawless aesthetic",
      used: "Pre-owned / Vintage, authentic wear",
      refurb: "Certified Refurbished / Fully Restored & Tested",
    };

    const promptText = `Inspect the provided product image and perform an e-commerce catalog visual inspection.
User-declared condition: "${conditionMap[condition] || condition}"
Target copywriting tone: "${tone}"
Target selling marketplaces: "${marketplaces.join(", ")}"
Currency: "${currency}"

Analyze the visual pixels carefully and output a strict JSON object with this exact structure:
{
  "productName": "High-intent e-commerce title accurately describing the exact brand, model, and item type visible in the image",
  "brand": "Exact brand name visible on the item or inferred from design (or 'Unbranded' / 'Artisan' if no brand exists)",
  "categoryHierarchy": "Full taxonomy path (e.g., 'Footwear > Sneakers > Running' or 'Apparel > Outerwear > Jackets')",
  "primaryCategory": "Top-level category name",
  "conditionGrading": "Detailed visual condition assessment based on visible wear, creasing, patina, or pristine factory finish",
  "defectReport": "Specific flaws, marks, discoloration, scuffs visible in the photo, or 'No structural defects detected'",
  "materials": "Inferred physical materials visible in the image (e.g., 'Full-grain leather and rubber outsole')",
  "estimatedDimensions": "Estimated physical specs or sizing",
  "pricePricing": {
    "currency": "${currency}",
    "fastLiquidationPrice": 45,
    "optimalMarginPrice": 79,
    "premiumValuationPrice": 115,
    "suggestedRange": "€45 - €115",
    "marketRationale": "Valuation rationale based on recent marketplace comps across ${marketplaces.join(", ")}"
  },
  "confidenceScore": 95,
  "keyFeatures": [
    "Feature 1 observed from image",
    "Feature 2 observed from image",
    "Feature 3 observed from image",
    "Feature 4 observed from image"
  ],
  "searchKeywords": [
    "keyword 1", "keyword 2", "keyword 3", "keyword 4", "keyword 5", "keyword 6", "keyword 7", "keyword 8"
  ]
}

Respond ONLY with valid JSON conforming strictly to the above schema. Do not include markdown code ticks.`;

    const response = await client.chat.completions.create({
      model: "qwen/qwen3.8-27b",
      messages: [
        {
          role: "user",
          content: [
            { type: "text", text: promptText },
            {
              type: "image_url",
              image_url: {
                url: imageDataUrl,
              },
            },
          ],
        },
      ],
      temperature: 0.2,
      max_tokens: 1500,
    });

    const content = response.choices[0]?.message?.content;
    if (!content) {
      return NextResponse.json(
        { success: false, error: "Vision model did not return a response. Please try with a different photo." },
        { status: 502 }
      );
    }

    // Strip markdown formatting if present
    const cleanJsonStr = content.replace(/^```(?:json)?\s*/i, "").replace(/\s*```$/i, "").trim();

    let analysisResult;
    try {
      analysisResult = JSON.parse(cleanJsonStr);
    } catch {
      return NextResponse.json(
        { success: false, error: "Unable to parse structured analysis from vision inspection." },
        { status: 502 }
      );
    }

    // 5. Record Usage / Create Listing Record in DB
    let storeId = user.stores?.[0]?.id;
    if (!storeId) {
      const newStore = await prisma.store.create({
        data: {
          userId: user.id,
          name: `${user.name || "My"}'s Store`,
        },
      });
      storeId = newStore.id;
    }

    const listingRecord = await prisma.listingRecord.create({
      data: {
        storeId,
        userId: user.id,
        platform: marketplaces[0] || "omni",
        status: "analyzed",
        title: analysisResult.productName || "Product Listing",
        listingJson: JSON.stringify(analysisResult),
      },
    });

    return NextResponse.json({
      success: true,
      data: analysisResult,
      meta: {
        recordId: listingRecord.id,
        quotaUsed: usageCount + 1,
        quotaLimit,
        plan,
      },
    });
  } catch (error: any) {
    console.error("[Gavriel Analyze] Vision analysis error:", error);
    return NextResponse.json(
      { success: false, error: "An unexpected error occurred during visual product inspection. Please try again." },
      { status: 500 }
    );
  }
}

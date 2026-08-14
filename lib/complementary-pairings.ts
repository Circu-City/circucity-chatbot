// Deliberately independent duplicate of circucity_eco's lib/complementary-pairings.ts.
// The chatbot's synced Product rows (see lib/product-catalog-cache.ts) only carry
// name/description/category — no `attributes.type` — so this copy only needs the
// category-level fallback table and the keyword classifier, not the fine-grained
// TYPE_PAIRINGS/attributes.type machinery from the marketplace app.

export const CATEGORY_PAIRINGS: Record<string, string[]> = {
  "Sustainable Fashion": ["Sustainable Fashion", "Recycled Items"],
  "Eco Home": ["Recycled Items", "Green Gadgets"],
  "Recycled Items": ["Eco Home", "Sustainable Fashion"],
  "Green Gadgets": ["Eco Home", "Electronics"],
  "Skincare": ["Sustainable Fashion", "Eco Home"],
  "Electronics": ["Green Gadgets"],
  "General": ["General"],
  "Organic Food": ["Eco Home", "General"],
};

// Same functional groupings as circucity_eco's classifier, condensed to what's
// needed here: only used to bucket a product into a broad "type" for matching
// against other products' names/descriptions when they share a category.
const TYPE_KEYWORDS: Record<string, RegExp> = {
  top: /\b(t-?shirts?|shirts?|hoodies?|sweaters?|jumpers?|blouses?|tank tops?|cardigans?)\b/i,
  bottom: /\b(jeans|pants|trousers|shorts|skirts?|leggings)\b/i,
  dress: /\bdress(es)?\b/i,
  outerwear: /\b(jackets?|coats?|parkas?|blazers?|windbreakers?)\b/i,
  shoes: /\b(shoes?|sneakers?|snickers?|sandals?|slides?|boots?|loafers?|flip.?flops?)\b/i,
  bag: /\b(bags?|totes?|backpacks?|purses?|handbags?)\b/i,
  jewelry: /\b(bracelets?|necklaces?|rings?|earrings?|jewel(le)?ry|pendants?)\b/i,
  accessory: /\b(scarves|scarfs?|belts?|hats?|caps?|gloves?|wristbands?|sunglasses|beanies?)\b/i,
  home_decor: /\b(vases?|plant pots?|planters?|candles?|ornaments?|frames?|sculptures?)\b/i,
  home_kitchen: /\b(cutting boards?|mugs?|plates?|bowls?|water bottles?|drinking|glass(es|ware)?|kitchen|cookware|utensils?)\b/i,
  home_textile: /\b(towels?|blankets?|cushions?|pillows?|rugs?|curtains?|napkins?|wraps?)\b/i,
  home_furniture: /\b(chairs?|tables?|desks?|sofas?|couch(es)?|shel(f|ves|ving)|furniture|stools?)\b/i,
  home_lighting: /\b(lamps?|lights?|led|lighting|lanterns?)\b/i,
  gadget_power: /\b(chargers?|power banks?|batter(y|ies)|solar.?powered)\b/i,
  gadget_sensor: /\b(sensors?|monitors?|trackers?|thermostats?)\b/i,
  skincare_cleanser: /\b(cleansers?|face wash|facial wash)\b/i,
  skincare_moisturizer: /\b(moisturi[sz]ers?|creams?|lotions?)\b/i,
  skincare_treatment: /\b(serums?|treatments?|balms?|lip balm)\b/i,
  skincare_soap: /\b(soaps?|shampoos?)\b/i,
  device: /\b(phones?|iphones?|smartphones?|laptops?|tablets?|computers?|notebooks?)\b/i,
  device_accessory: /\b(earbuds?|earphones?|headphones?|cases?|cables?|adapters?)\b/i,
};

export function classifyTypeFromText(name: string, description?: string | null): string {
  const text = `${name} ${description || ""}`;
  for (const [type, re] of Object.entries(TYPE_KEYWORDS)) {
    if (re.test(text)) return type;
  }
  return "other";
}

/**
 * Given a product's category (and its name/description for a rough type guess),
 * return the list of category names its complements are likely to live in.
 */
export function getComplementCategories(categoryName?: string | null): string[] {
  if (!categoryName) return [];
  return CATEGORY_PAIRINGS[categoryName] ?? [categoryName];
}

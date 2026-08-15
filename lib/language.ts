const MARKERS: Record<string, string[]> = {
  sv: ["hej", "jag", "är", "och", "inte", "till", "kan", "leverans", "retur", "köpa", "köp", "beställa", "finns", "vad", "hur", "skicka", "frakt", "pris", "rabatt", "tack", "tröja", "klänning", "skor", "skrivbordslampa", "mig", "vill", "skulle", "produkt"],
  de: ["guten tag", "guten", "hallo", "ich", "wie", "was", "kann", "nicht", "und", "der", "die", "das", "lieferung", "retoure", "kaufen", "bestellen", "gibt es", "danke", "versand", "preis", "rabatt", "mir", "möchte", "ihr"],
  fr: ["bonjour", "bonsoir", "je", "comment", "quelle", "quel", "quoi", "pas", "livraison", "retour", "acheter", "commander", "merci", "remboursement", "délai", "prix", "moi", "voudrais", "est-ce", "combien"],
  es: ["hola", "buenos días", "cómo", "qué", "no", "entrega", "devolución", "comprar", "pedido", "gracias", "envío", "precio", "cuánto", "cuál", "quiero", "me gustaría", "hay"],
  nl: ["hallo", "ik", "hoe", "wat", "kan", "niet", "levering", "retour", "kopen", "bestellen", "dank", "verzending", "prijs", "wil", "graag", "is er"],
  it: ["ciao", "buongiorno", "io", "come", "che", "cosa", "non", "consegna", "resa", "comprare", "ordinare", "grazie", "spedizione", "prezzo", "vorrei", "c'è"],
  pt: ["olá", "ola", "eu", "como", "que", "não", "nao", "entrega", "devolução", "devolucao", "comprar", "encomendar", "obrigado", "envio", "preço", "preco", "gostaria"],
  da: ["hej", "jeg", "og", "ikke", "til", "kan", "levering", "retur", "købe", "kobe", "bestille", "findes", "hvad", "hvordan", "tak", "fragt", "pris", "mig", "vil gerne"],
  no: ["hei", "jeg", "og", "ikke", "til", "kan", "levering", "retur", "kjøpe", "kjope", "bestille", "finnes", "hva", "hvordan", "takk", "frakt", "pris", "meg", "vil gjerne"],
  fi: ["hei", "moi", "minä", "mina", "ja", "ei", "voiko", "toimitus", "palautus", "ostaa", "tilata", "mitä", "mita", "miten", "kiitos", "hinta", "voisitteko"],
  pl: ["cześć", "czesc", "witam", "ja", "jak", "co", "nie", "dostawa", "zwrot", "kupić", "kupic", "zamówić", "zamowic", "dziękuję", "dziekuje", "cena", "czy"],
};

const STRONG_CHARS: Record<string, RegExp> = {
  sv: /[åäö]/i,
  de: /[äöüß]/i,
  fr: /[àâçéèêëîïôùûüÿœ]/i,
  es: /[ñ¿¡]/i,
  pt: /[ãõç]/i,
  da: /[æøå]/i,
  no: /[æøå]/i,
  fi: /[äö]/i,
  pl: /[ąćęłńóśźż]/i,
};

const LANGUAGE_NAMES: Record<string, string> = {
  en: "English",
  sv: "Swedish (svenska)",
  de: "German (Deutsch)",
  fr: "French (français)",
  es: "Spanish (español)",
  nl: "Dutch (Nederlands)",
  it: "Italian (italiano)",
  pt: "Portuguese (português)",
  da: "Danish (dansk)",
  no: "Norwegian (norsk)",
  fi: "Finnish (suomi)",
  pl: "Polish (polski)",
};

export function detectLanguage(text: string): string {
  const t = text.toLowerCase();
  const tokens = new Set(t.split(/[^a-zåäöüßàâçéèêëîïôùûüÿœñãõæøąćęłńóśźż'-]+/).filter(Boolean));
  const scores: Record<string, number> = {};

  for (const [lang, words] of Object.entries(MARKERS)) {
    let score = 0;
    for (const w of words) {
      if (tokens.has(w)) score++;
    }
    if (score > 0) scores[lang] = score;
  }

  const strong = STRONG_CHARS;
  for (const [lang, re] of Object.entries(strong)) {
    if (re.test(t)) scores[lang] = (scores[lang] || 0) + 2;
  }

  const entries = Object.entries(scores).sort((a, b) => b[1] - a[1]);
  return entries.length ? entries[0][0] : "en";
}

export function languageName(lang: string): string {
  return LANGUAGE_NAMES[lang] || LANGUAGE_NAMES.en;
}

export function languageInstruction(lang: string): string {
  if (lang === "en") {
    return "LANGUAGE: The customer is writing in English. Always respond in English.";
  }
  return `LANGUAGE: The customer is writing in ${languageName(lang)}. You MUST respond in ${languageName(lang)} — use the same language as the customer, never switch to English. Product names and technical terms may stay in English when no natural translation exists, but your sentences, greetings, and policy explanations must be in ${languageName(lang)}.`;
}

export function translateQueryForSearch(query: string, lang: string): string {
  if (lang === "en") return query;
  return query;
}
(function () {
  if (window.__ccAiWidgetInstance || document.getElementById("cc-ai-widget")) {
    console.warn("[CircuCity AI] Duplicate widget load skipped");
    return;
  }
  window.__ccAiWidgetInstance = true;
  console.log("[CircuCity AI] Widget v2 loaded");
  var CHATBOT_BASE = "https://chatbot.circucity.com";
  var API_KEY = "{{API_KEY}}";
  var WS_ID = "{{WS_ID}}";
  var WS_NAME = {{WS_NAME}};
  var BOT_NAME = {{BOT_NAME}};
  var GREETING = {{GREETING}};
  var NO_BUBBLE = {{NO_BUBBLE}};
  var PRIMARY_COLOR = "{{PRIMARY_COLOR}}";
  var PRIMARY_RGB = "{{PRIMARY_RGB}}";
  var VOICE_ENABLED = "{{VOICE_ENABLED}}" === "true";
  var PROACTIVE_ENABLED = "{{PROACTIVE_ENABLED}}" === "true";
  var AUTO_OPEN = "{{AUTO_OPEN}}" === "true";
  var AUTO_OPEN_DELAY = parseInt("{{AUTO_OPEN_DELAY}}", 10) || 5;
  var SHOW_BRANDING = "{{SHOW_BRANDING}}" !== "false";
  var HANDOFF_ENABLED = "{{HANDOFF_ENABLED}}" !== "false";
  var SESSION_KEY = "cc_session_id";
  var VISITOR_KEY = "cc_visitor_id";
  var LEAD_KEY = "cc_lead_info";
  var SOUND_KEY = "cc_sound_muted";
  var CSAT_KEY = "cc_csat_done_";
  var AUTO_OPEN_KEY = "cc_auto_opened";

  // --- i18n: pick the widget language from the visitor's browser ---
  var CC_LANG = (function () {
    var raw = (navigator.language || navigator.userLanguage || "en").toLowerCase();
    if (raw.indexOf("sv") === 0) return "sv";
    if (raw.indexOf("de") === 0) return "de";
    if (raw.indexOf("fr") === 0) return "fr";
    if (raw.indexOf("es") === 0) return "es";
    if (raw.indexOf("nl") === 0) return "nl";
    if (raw.indexOf("it") === 0) return "it";
    if (raw.indexOf("pt") === 0) return "pt";
    if (raw.indexOf("da") === 0) return "da";
    if (raw.indexOf("no") === 0 || raw.indexOf("nb") === 0) return "no";
    if (raw.indexOf("fi") === 0) return "fi";
    if (raw.indexOf("pl") === 0) return "pl";
    return "en";
  })();

  var CC_STRINGS = {
    en: {
      leadTitle: "Before we start — how can we reach you?",
      typeMsg: "Type your message...",
      attachMsg: "Add a message or send the file...",
      askQuestion: "Ask a question...",
      welcome: "Hi there!",
      askAnything: "Ask me anything about our store, products, or orders.",
      welcomeBack: "Welcome back! Looking for something specific today?",
      findProduct: "Can I help you find the perfect product today?",
      helpNow: "Hi! Need help finding something?",
      specificHelp: "Looking for something specific? I'm here to help.",
      dontLeave: "Don't leave yet! Can I help you find something?",
      questions: "Have questions? I'd be happy to answer them.",
      yourName: "Your name",
      emailOpt: "Email (optional)",
      email: "Email",
      phoneOpt: "Phone (optional)",
      needHelp: "What do you need help with?",
      skip: "Add a name or email, or skip.",
      send: "Send message",
      search: "Search",
      clearSearch: "Clear search",
      editSearch: "Edit search",
      newChat: "New chat",
      newConversation: "New conversation",
      noPast: "No past conversations yet.",
      chatWith: "Chat with ",
      openChat: "Open chat with ",
      closeChat: "Close chat",
      minimize: "Minimize chat",
      talkHuman: "Talk to a human",
      handoff: "Need a human? Tap the person icon above.",
      cancel: "Cancel",
      retry: "Retry",
      dismiss: "Dismiss",
      poweredBy: "Powered by",
      attachFile: "Attach file",
      removeFile: "Remove file",
      readAloud: "Read aloud",
      toggleSound: "Toggle sound",
      voiceInput: "Voice input",
      emoji: "Emoji",
      browseStore: "Browse store",
      basedOn: "Based on:",
      lookingFor: "Looking for:",
      addToCart: "Add to cart",
      addedToCart: "Added to cart: ",
      restock: "Restock alert saved for ",
      enterTerm: "Enter a search term",
      helpEmpty: "No help articles yet. Ask a question above.",
      busy: "Busy, retrying...",
      retrying: "Retrying...",
      connErr: "Connection error. Please try again.",
      connLost: "Connection lost. Please try again.",
      tooFast: "Chat is busy right now. Please try again shortly.",
      unavailable: "Chat temporarily unavailable. Please try again shortly.",
      badRequest: "Sorry, I couldn't process your message. Please try again.",
      genericErr: "Sorry, something went wrong. Please try again.",
      feedbackThanks: "Thanks for your feedback!",
      helpful: "Helpful",
      notHelpful: "Not helpful",
      quickShip: "How does shipping work?",
      quickReturn: "What's the return policy?",
      quickSell: "What do you sell?",
      quickHours: "What are your hours?",
      quickDiscount: "Do you have any discounts or offers?",
      quickGift: "I need a gift idea",
      quickSupport: "How do I get support?",
      quickPay: "How do I pay?",
      quickPopular: "What are your most popular items?",
      quickCheckout: "Can you help with checkout?",
      quickLocation: "Where are you located?",
      quickIntl: "Do you ship internationally?",
      quickSizes: "What sizes are available?",
      quickSuggestion: "Need a recommendation? Just ask!",
    },
    sv: {
      leadTitle: "Innan vi börjar — hur kan vi nå dig?",
      typeMsg: "Skriv ditt meddelande...",
      attachMsg: "Skriv ett meddelande eller skicka filen...",
      askQuestion: "Ställ en fråga...",
      welcome: "Hej där!",
      askAnything: "Fråga mig vad som helst om vår butik, produkter eller beställningar.",
      welcomeBack: "Välkommen tillbaka! Letar du efter något specifikt idag?",
      findProduct: "Kan jag hjälpa dig hitta den perfekta produkten idag?",
      helpNow: "Hej! Behöver du hjälp att hitta något?",
      specificHelp: "Letar du efter något specifikt? Jag finns här för att hjälpa.",
      dontLeave: "Gå inte ännu! Kan jag hjälpa dig hitta något?",
      questions: "Har du frågor? Jag svarar gärna på dem.",
      yourName: "Ditt namn",
      emailOpt: "E-post (valfritt)",
      email: "E-post",
      phoneOpt: "Telefon (valfritt)",
      needHelp: "Vad behöver du hjälp med?",
      skip: "Lägg till namn eller e-post, eller hoppa över.",
      send: "Skicka meddelande",
      search: "Sök",
      clearSearch: "Rensa sökning",
      editSearch: "Ändra sökning",
      newChat: "Ny chatt",
      newConversation: "Ny konversation",
      noPast: "Inga tidigare konversationer ännu.",
      chatWith: "Chatta med ",
      openChat: "Öppna chatt med ",
      closeChat: "Stäng chatt",
      minimize: "Minimera chatt",
      talkHuman: "Prata med en människa",
      handoff: "Behöver du hjälp från en människa? Tryck på personikonen ovan.",
      cancel: "Avbryt",
      retry: "Försök igen",
      dismiss: "Stäng",
      poweredBy: "Drivs av",
      attachFile: "Bifoga fil",
      removeFile: "Ta bort fil",
      readAloud: "Läs upp",
      toggleSound: "Ljud på/av",
      voiceInput: "Röstinmatning",
      emoji: "Emoji",
      browseStore: "Bläddra i butiken",
      basedOn: "Baserat på:",
      lookingFor: "Letar efter:",
      addToCart: "Lägg i varukorg",
      addedToCart: "Tillagd i varukorgen: ",
      restock: "Påminnelse om återlager sparas för ",
      enterTerm: "Ange en sökterm",
      helpEmpty: "Inga hjälpartiklar ännu. Ställ en fråga ovan.",
      busy: "Upptagen, försöker igen...",
      retrying: "Försöker igen...",
      connErr: "Anslutningsfel. Försök igen.",
      connLost: "Anslutningen bröts. Försök igen.",
      tooFast: "Chatten är upptagen just nu. Försök igen om en stund.",
      unavailable: "Chatten är tillfälligt otillgänglig. Försök igen om en stund.",
      badRequest: "Tyvärr kunde jag inte behandla ditt meddelande. Försök igen.",
      genericErr: "Tyvärr, något gick fel. Försök igen.",
      feedbackThanks: "Tack för din feedback!",
      helpful: "Hjälpsam",
      notHelpful: "Inte hjälpsam",
      quickShip: "Hur fungerar leveransen?",
      quickReturn: "Vad är returpolicyn?",
      quickSell: "Vad säljer ni?",
      quickHours: "Vilka är era öppettider?",
      quickDiscount: "Har ni några rabatter eller erbjudanden?",
      quickGift: "Jag behöver en presentidé",
      quickSupport: "Hur får jag support?",
      quickPay: "Hur betalar jag?",
      quickPopular: "Vilka är era mest populära produkter?",
      quickCheckout: "Kan du hjälpa mig med kassan?",
      quickLocation: "Var ligger ni?",
      quickIntl: "Skickar ni till andra länder?",
      quickSizes: "Vilka storlekar finns?",
      quickSuggestion: "Behöver du en rekommendation? Fråga bara!",
    },
    de: {
      leadTitle: "Bevor wir beginnen — wie können wir Sie erreichen?",
      typeMsg: "Nachricht eingeben...",
      attachMsg: "Nachricht eingeben oder Datei senden...",
      askQuestion: "Frage stellen...",
      welcome: "Hallo!",
      askAnything: "Fragen Sie mich alles zu unserem Shop, unseren Produkten oder Bestellungen.",
      welcomeBack: "Willkommen zurück! Suchen Sie heute etwas Bestimmtes?",
      findProduct: "Kann ich Ihnen heute helfen, das perfekte Produkt zu finden?",
      helpNow: "Hallo! Suchen Sie etwas?",
      specificHelp: "Auf der Suche nach etwas Bestimmtem? Ich bin hier, um zu helfen.",
      dontLeave: "Noch nicht gehen! Kann ich Ihnen helfen, etwas zu finden?",
      questions: "Haben Sie Fragen? Ich beantworte sie gerne.",
      yourName: "Ihr Name",
      emailOpt: "E-Mail (optional)",
      email: "E-Mail",
      phoneOpt: "Telefon (optional)",
      needHelp: "Wobei brauchen Sie Hilfe?",
      skip: "Name oder E-Mail hinzufügen oder überspringen.",
      send: "Nachricht senden",
      search: "Suchen",
      clearSearch: "Suche löschen",
      editSearch: "Suche bearbeiten",
      newChat: "Neuer Chat",
      newConversation: "Neue Konversation",
      noPast: "Noch keine früheren Gespräche.",
      chatWith: "Chat mit ",
      openChat: "Chat öffnen mit ",
      closeChat: "Chat schließen",
      minimize: "Chat minimieren",
      talkHuman: "Mit einem Menschen sprechen",
      handoff: "Brauchen Sie einen Menschen? Tippen Sie oben auf das Personensymbol.",
      cancel: "Abbrechen",
      retry: "Erneut versuchen",
      dismiss: "Schließen",
      poweredBy: "Bereitgestellt von",
      attachFile: "Datei anhängen",
      removeFile: "Datei entfernen",
      readAloud: "Vorlesen",
      toggleSound: "Ton ein/aus",
      voiceInput: "Spracheingabe",
      emoji: "Emoji",
      browseStore: "Shop durchstöbern",
      basedOn: "Basierend auf:",
      lookingFor: "Suche nach:",
      addToCart: "In den Warenkorb",
      addedToCart: "Zum Warenkorb hinzugefügt: ",
      restock: "Benachrichtigung bei Wiederverfügbarkeit für ",
      enterTerm: "Suchbegriff eingeben",
      helpEmpty: "Noch keine Hilfeartikel. Stellen Sie oben eine Frage.",
      busy: "Beschäftigt, versuche erneut...",
      retrying: "Wird erneut versucht...",
      connErr: "Verbindungsfehler. Bitte erneut versuchen.",
      connLost: "Verbindung getrennt. Bitte erneut versuchen.",
      tooFast: "Der Chat ist gerade beschäftigt. Bitte versuchen Sie es gleich noch einmal.",
      unavailable: "Chat vorübergehend nicht verfügbar. Bitte versuchen Sie es gleich noch einmal.",
      badRequest: "Entschuldigung, ich konnte Ihre Nachricht nicht verarbeiten. Bitte erneut versuchen.",
      genericErr: "Entschuldigung, etwas ist schiefgelaufen. Bitte erneut versuchen.",
      feedbackThanks: "Danke für Ihr Feedback!",
      helpful: "Hilfreich",
      notHelpful: "Nicht hilfreich",
      quickShip: "Wie funktioniert der Versand?",
      quickReturn: "Wie lautet die Rückgabepolitik?",
      quickSell: "Was verkaufen Sie?",
      quickHours: "Was sind Ihre Öffnungszeiten?",
      quickDiscount: "Gibt es Rabatte oder Angebote?",
      quickGift: "Ich brauche eine Geschenkidee",
      quickSupport: "Wie erhalte ich Support?",
      quickPay: "Wie bezahle ich?",
      quickPopular: "Was sind Ihre beliebtesten Produkte?",
      quickCheckout: "Können Sie mir beim Checkout helfen?",
      quickLocation: "Wo befinden Sie sich?",
      quickIntl: "Versenden Sie international?",
      quickSizes: "Welche Größen sind verfügbar?",
      quickSuggestion: "Brauchen Sie eine Empfehlung? Fragen Sie einfach!",
    },
    fr: {
      leadTitle: "Avant de commencer — comment vous joindre ?",
      typeMsg: "Écrivez votre message...",
      attachMsg: "Écrivez un message ou envoyez le fichier...",
      askQuestion: "Posez une question...",
      welcome: "Bonjour !",
      askAnything: "Posez-moi des questions sur notre boutique, nos produits ou vos commandes.",
      welcomeBack: "Ravi de vous revoir ! Vous cherchez quelque chose de précis aujourd'hui ?",
      findProduct: "Puis-je vous aider à trouver le produit parfait aujourd'hui ?",
      helpNow: "Bonjour ! Besoin d'aide pour trouver quelque chose ?",
      specificHelp: "Vous cherchez quelque chose de précis ? Je suis là pour vous aider.",
      dontLeave: "Ne partez pas ! Puis-je vous aider à trouver quelque chose ?",
      questions: "Des questions ? Je serai ravi d'y répondre.",
      yourName: "Votre nom",
      emailOpt: "E-mail (facultatif)",
      email: "E-mail",
      phoneOpt: "Téléphone (facultatif)",
      needHelp: "Avec quoi avez-vous besoin d'aide ?",
      skip: "Ajoutez un nom ou un e-mail, ou ignorez.",
      send: "Envoyer le message",
      search: "Rechercher",
      clearSearch: "Effacer la recherche",
      editSearch: "Modifier la recherche",
      newChat: "Nouveau chat",
      newConversation: "Nouvelle conversation",
      noPast: "Aucune conversation précédente pour le moment.",
      chatWith: "Discuter avec ",
      openChat: "Ouvrir le chat avec ",
      closeChat: "Fermer le chat",
      minimize: "Réduire le chat",
      talkHuman: "Parler à un humain",
      handoff: "Besoin d'un humain ? Touchez l'icône de personne ci-dessus.",
      cancel: "Annuler",
      retry: "Réessayer",
      dismiss: "Fermer",
      poweredBy: "Propulsé par",
      attachFile: "Joindre un fichier",
      removeFile: "Supprimer le fichier",
      readAloud: "Lire à voix haute",
      toggleSound: "Son activé/désactivé",
      voiceInput: "Saisie vocale",
      emoji: "Emoji",
      browseStore: "Parcourir la boutique",
      basedOn: "Basé sur :",
      lookingFor: "Vous cherchez :",
      addToCart: "Ajouter au panier",
      addedToCart: "Ajouté au panier : ",
      restock: "Alerte de réapprovisionnement enregistrée pour ",
      enterTerm: "Saisissez un terme de recherche",
      helpEmpty: "Aucun article d'aide pour le moment. Posez une question ci-dessus.",
      busy: "Occupé, nouvelle tentative...",
      retrying: "Nouvelle tentative...",
      connErr: "Erreur de connexion. Veuillez réessayer.",
      connLost: "Connexion perdue. Veuillez réessayer.",
      tooFast: "Le chat est occupé pour le moment. Veuillez réessayer dans un instant.",
      unavailable: "Chat temporairement indisponible. Veuillez réessayer dans un instant.",
      badRequest: "Désolé, je n'ai pas pu traiter votre message. Veuillez réessayer.",
      genericErr: "Désolé, une erreur est survenue. Veuillez réessayer.",
      feedbackThanks: "Merci pour votre retour !",
      helpful: "Utile",
      notHelpful: "Pas utile",
      quickShip: "Comment fonctionne la livraison ?",
      quickReturn: "Quelle est la politique de retour ?",
      quickSell: "Que vendez-vous ?",
      quickHours: "Quels sont vos horaires ?",
      quickDiscount: "Avez-vous des réductions ou offres ?",
      quickGift: "J'ai besoin d'une idée cadeau",
      quickSupport: "Comment obtenir de l'aide ?",
      quickPay: "Comment payer ?",
      quickPopular: "Quels sont vos produits les plus populaires ?",
      quickCheckout: "Pouvez-vous m'aider avec le paiement ?",
      quickLocation: "Où êtes-vous situé ?",
      quickIntl: "Livrez-vous à l'international ?",
      quickSizes: "Quelles tailles sont disponibles ?",
      quickSuggestion: "Besoin d'une recommandation ? Demandez-moi !",
    },
    es: {
      leadTitle: "Antes de empezar — ¿cómo podemos contactarte?",
      typeMsg: "Escribe tu mensaje...",
      attachMsg: "Escribe un mensaje o envía el archivo...",
      askQuestion: "Haz una pregunta...",
      welcome: "¡Hola!",
      askAnything: "Pregúntame sobre nuestra tienda, productos o pedidos.",
      welcomeBack: "¡Bienvenido de nuevo! ¿Buscas algo específico hoy?",
      findProduct: "¿Puedo ayudarte a encontrar el producto perfecto hoy?",
      helpNow: "¡Hola! ¿Necesitas ayuda para encontrar algo?",
      specificHelp: "¿Buscas algo específico? Estoy aquí para ayudarte.",
      dontLeave: "¡No te vayas! ¿Puedo ayudarte a encontrar algo?",
      questions: "¿Tienes preguntas? Estaré encantado de responderlas.",
      yourName: "Tu nombre",
      emailOpt: "Correo electrónico (opcional)",
      email: "Correo electrónico",
      phoneOpt: "Teléfono (opcional)",
      needHelp: "¿Con qué necesitas ayuda?",
      skip: "Añade un nombre o correo, u omítelo.",
      send: "Enviar mensaje",
      search: "Buscar",
      clearSearch: "Borrar búsqueda",
      editSearch: "Editar búsqueda",
      newChat: "Nuevo chat",
      newConversation: "Nueva conversación",
      noPast: "Aún no hay conversaciones anteriores.",
      chatWith: "Chatear con ",
      openChat: "Abrir chat con ",
      closeChat: "Cerrar chat",
      minimize: "Minimizar chat",
      talkHuman: "Hablar con una persona",
      handoff: "¿Necesitas ayuda humana? Toca el icono de persona arriba.",
      cancel: "Cancelar",
      retry: "Reintentar",
      dismiss: "Cerrar",
      poweredBy: "Impulsado por",
      attachFile: "Adjuntar archivo",
      removeFile: "Eliminar archivo",
      readAloud: "Leer en voz alta",
      toggleSound: "Sonido activado/desactivado",
      voiceInput: "Entrada de voz",
      emoji: "Emoji",
      browseStore: "Explorar tienda",
      basedOn: "Basado en:",
      lookingFor: "Buscando:",
      addToCart: "Añadir al carrito",
      addedToCart: "Añadido al carrito: ",
      restock: "Alerta de reposición guardada para ",
      enterTerm: "Introduce un término de búsqueda",
      helpEmpty: "Aún no hay artículos de ayuda. Haz una pregunta arriba.",
      busy: "Ocupado, reintentando...",
      retrying: "Reintentando...",
      connErr: "Error de conexión. Inténtalo de nuevo.",
      connLost: "Conexión perdida. Inténtalo de nuevo.",
      tooFast: "El chat está ocupado ahora mismo. Inténtalo de nuevo en un momento.",
      unavailable: "Chat temporalmente no disponible. Inténtalo de nuevo en un momento.",
      badRequest: "Lo siento, no pude procesar tu mensaje. Inténtalo de nuevo.",
      genericErr: "Lo siento, algo salió mal. Inténtalo de nuevo.",
      feedbackThanks: "¡Gracias por tus comentarios!",
      helpful: "Útil",
      notHelpful: "No útil",
      quickShip: "¿Cómo funciona el envío?",
      quickReturn: "¿Cuál es la política de devoluciones?",
      quickSell: "¿Qué vendéis?",
      quickHours: "¿Cuáles son vuestros horarios?",
      quickDiscount: "¿Tenéis descuentos u ofertas?",
      quickGift: "Necesito una idea de regalo",
      quickSupport: "¿Cómo obtengo soporte?",
      quickPay: "¿Cómo pago?",
      quickPopular: "¿Cuáles son vuestros productos más populares?",
      quickCheckout: "¿Puedes ayudarme con el pago?",
      quickLocation: "¿Dónde estáis ubicados?",
      quickIntl: "¿Enviáis internacionalmente?",
      quickSizes: "¿Qué tallas están disponibles?",
      quickSuggestion: "¿Necesitas una recomendación? ¡Solo pregunta!",
    },
  };

  function t(key) {
    var table = CC_STRINGS[CC_LANG] || CC_STRINGS.en;
    if (table && table[key]) return table[key];
    if (CC_STRINGS.en[key]) return CC_STRINGS.en[key];
    return key;
  }

  var savedSessionId = (function () {
    try {
      return localStorage.getItem(SESSION_KEY);
    } catch (e) {
      return null;
    }
  })();

  // Unlike sessionId (rotated on "New chat"), visitorId is generated once and kept
  // forever so a visitor's past conversations can be looked up as a group.
  var savedVisitorId = (function () {
    try {
      return localStorage.getItem(VISITOR_KEY);
    } catch (e) {
      return null;
    }
  })();

  var leadInfo = (function () {
    try {
      return JSON.parse(localStorage.getItem(LEAD_KEY) || "null");
    } catch (e) {
      return null;
    }
  })();

  var soundMuted = (function () {
    try {
      return localStorage.getItem(SOUND_KEY) === "1";
    } catch (e) {
      return false;
    }
  })();

  var userName = (leadInfo && leadInfo.name) || null;
  var userEmail = (leadInfo && leadInfo.email) || null;
  var requestCounter = 0;
  var audioCtx = null;
  var soundUnlocked = false;

  function unlockAudio() {
    if (soundUnlocked) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = audioCtx || new AC();
      if (audioCtx.state === "suspended") audioCtx.resume();
      soundUnlocked = true;
    } catch (e) {}
  }

  function playNotifySound() {
    if (soundMuted || !soundUnlocked) return;
    try {
      var AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return;
      audioCtx = audioCtx || new AC();
      if (audioCtx.state === "suspended") audioCtx.resume();
      var o = audioCtx.createOscillator();
      var g = audioCtx.createGain();
      o.type = "sine";
      o.frequency.setValueAtTime(880, audioCtx.currentTime);
      o.frequency.exponentialRampToValueAtTime(660, audioCtx.currentTime + 0.12);
      g.gain.setValueAtTime(0.0001, audioCtx.currentTime);
      g.gain.exponentialRampToValueAtTime(0.08, audioCtx.currentTime + 0.02);
      g.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + 0.2);
      o.connect(g);
      g.connect(audioCtx.destination);
      o.start();
      o.stop(audioCtx.currentTime + 0.22);
    } catch (e) {}
  }

  function track(event, data) {
    try {
      var payload = JSON.stringify({
        apiKey: API_KEY,
        sessionId: sessionIdGlobal,
        event: event,
        data: data || undefined,
      });
      if (navigator.sendBeacon) {
        navigator.sendBeacon(
          CHATBOT_BASE + "/api/client/track",
          new Blob([payload], { type: "application/json" }),
        );
      } else {
        fetch(CHATBOT_BASE + "/api/client/track", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: payload,
          keepalive: true,
        }).catch(function () {});
      }
    } catch (e) {}
  }

  var sessionIdGlobal = savedSessionId || null;
  var visitorIdGlobal =
    savedVisitorId || "vis_" + Date.now() + "_" + Math.random().toString(36).substr(2, 12);
  try {
    localStorage.setItem(VISITOR_KEY, visitorIdGlobal);
  } catch (e) {}
  var widgetToken = null;
  function requestWidgetToken() {
    try {
      return fetch(CHATBOT_BASE + "/api/widget/session", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ apiKey: API_KEY, sessionId: sessionIdGlobal || "visitor" }),
      })
        .then(function (r) { return r.ok ? r.json() : null; })
        .then(function (j) { if (j && j.token) widgetToken = j.token; return widgetToken; })
        .catch(function () { return null; });
    } catch (e) {
      return Promise.resolve(null);
    }
  }
  function widgetAuthHeaders() {
    return widgetToken ? { Authorization: "Bearer " + widgetToken } : {};
  }

  function detectUserName() {
    try {
      if (!window.Clerk || !window.Clerk.user) {
        try {
          if (!document.querySelector("[data-clerk-user-name]")) {
            localStorage.removeItem("cc_user_name");
          }
        } catch (e) {}
      }
    } catch (e) {}
    var stored = null;
    try {
      stored = localStorage.getItem("cc_user_name");
    } catch (e) {}
    if (stored) return stored;
    if (userName) return userName;
    var sel = [
      "[data-customer-name]",
      "[data-user-name]",
      "[data-account-name]",
      ".customer-name",
      ".user-name",
      "[data-clerk-user-name]",
    ];
    for (var i = 0; i < sel.length; i++) {
      var el = document.querySelector(sel[i]);
      if (el && el.textContent.trim())
        return el.textContent.trim().replace(/^(Welcome|Hello|Hi)[,\s]*/i, "");
    }
    try {
      if (window.Clerk && window.Clerk.user)
        return (
          window.Clerk.user.firstName ||
          window.Clerk.user.fullName ||
          window.Clerk.user.username
        );
    } catch (e) {}
    return null;
  }

  var PROACTIVE_MESSAGES = [
    t("helpNow"),
    t("specificHelp"),
    t("findProduct"),
    t("questions"),
    "Not sure what you need? Tell me a bit and I'll help narrow it down.",
    t("quickSuggestion"),
  ];

  var SUGGESTION_CHIPS = [
    t("quickSell"),
    t("quickGift"),
    t("quickPopular"),
    t("quickDiscount"),
    t("quickShip"),
    t("talkHuman"),
  ];

  var EMOJIS = [
    "😀", "😊", "😍", "🤔", "👍", "👎", "❤️", "🔥",
    "🎉", "🙏", "😂", "😅", "🙌", "💯", "✨", "👏",
    "😢", "😮", "🤝", "⭐", "🛒", "📦", "💬", "👋",
  ];

  function detectPageType() {
    var path = window.location.pathname.toLowerCase();
    var url = window.location.href.toLowerCase();
    if (path.indexOf("/checkout") !== -1 || url.indexOf("/checkout") !== -1) return "checkout";
    if (path.indexOf("/cart") !== -1 || url.indexOf("/cart") !== -1) return "cart";
    if (
      path.indexOf("/product/") !== -1 ||
      path.indexOf("/products/") !== -1 ||
      path.indexOf("/p/") !== -1
    )
      return "product";
    if (path.indexOf("/category/") !== -1 || path.indexOf("/collections/") !== -1)
      return "category";
    if (path.indexOf("/search") !== -1 || url.indexOf("?s=") !== -1 || url.indexOf("?q=") !== -1)
      return "search";
    return "home";
  }

  function getInactivityDelay(pageType) {
    switch (pageType) {
      case "checkout":
        return 45;
      case "cart":
        return 60;
      case "product":
        return 120;
      case "category":
        return 120;
      default:
        return 180;
    }
  }

  var proactiveUsedMessages = [];
  var proactiveCooldown = false;
  var inactivityTimer = null;
  var userInteractedWithChat = false;
  var userActivityTimer = null;
  var proactiveShownThisSession = false;
  var proactiveDismissed = (function () {
    try {
      return sessionStorage.getItem("cc_proactive_dismissed") === "1";
    } catch (e) {
      return false;
    }
  })();
  var pageUrl = window.location.href;
  var pageType = detectPageType();
  var exitIntentTriggered = false;
  var scrollDepthTriggered = false;
  var returnVisitor = false;
  var visitCount = 0;
  var scrollThreshold = 50;

  try {
    var lastVisit = localStorage.getItem("cc_last_visit");
    visitCount = parseInt(localStorage.getItem("cc_visit_count") || "0", 10);
    if (lastVisit) {
      returnVisitor = true;
      var hoursSinceLast = (Date.now() - parseInt(lastVisit, 10)) / 3600000;
      if (hoursSinceLast < 24) returnVisitor = false;
    }
    visitCount++;
    localStorage.setItem("cc_visit_count", String(visitCount));
    localStorage.setItem("cc_last_visit", String(Date.now()));
  } catch (e) {}

  function handleExitIntent(e) {
    if (exitIntentTriggered || userInteractedWithChat || !PROACTIVE_ENABLED) return;
    if (e.clientY > 0) return;
    exitIntentTriggered = true;
    triggerProactiveWithMsg(t("dontLeave"));
    fetch(CHATBOT_BASE + "/api/flows/trigger", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        apiKey: API_KEY,
        event: "exit_intent",
        data: { url: window.location.href },
        sessionId: sessionIdGlobal,
      }),
    }).catch(function () {});
  }

  function handleScrollDepth() {
    if (scrollDepthTriggered || userInteractedWithChat) return;
    var scrollPercent =
      ((window.scrollY + window.innerHeight) / document.documentElement.scrollHeight) * 100;
    if (scrollPercent >= scrollThreshold) {
      scrollDepthTriggered = true;
      triggerProactiveWithMsg(
        "Not sure what you're looking for? Tell me and I'll help you find it.",
      );
      fetch(CHATBOT_BASE + "/api/flows/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: API_KEY,
          event: "scroll_depth",
          data: { url: window.location.href, percent: Math.round(scrollPercent) },
          sessionId: sessionIdGlobal,
        }),
      }).catch(function () {});
    }
  }

  function triggerProactiveWithMsg(msg) {
    if (proactiveCooldown || userInteractedWithChat || proactiveDismissed) return;
    showProactiveBubble(msg);
    proactiveCooldown = true;
    setTimeout(function () {
      proactiveCooldown = false;
    }, 120000);
  }

  if (returnVisitor && visitCount > 1 && !userInteractedWithChat && PROACTIVE_ENABLED) {
    setTimeout(function () {
      if (!userInteractedWithChat && !proactiveShownThisSession) {
        proactiveShownThisSession = true;
        triggerProactiveWithMsg(t("welcomeBack"));
      }
    }, 3000);
  }

  var cartDetected = false;
  var cartAbandonedShown = false;

  function detectCart() {
    try {
      var cartKeys = [
        "woocommerce_cart_hash",
        "cart",
        "shopify_cart",
        "cartItems",
        "cart_items",
      ];
      for (var ck = 0; ck < cartKeys.length; ck++) {
        for (var lk = 0; lk < localStorage.length; lk++) {
          var key = localStorage.key(lk);
          if (key && key.indexOf(cartKeys[ck]) !== -1) {
            var val = localStorage.getItem(key);
            if (val && val.length > 5) return true;
          }
        }
      }
      var cartSelectors = [
        ".cart-count",
        ".cart__count",
        "[data-cart-count]",
        ".cart-badge",
        ".cart-quantity",
      ];
      for (var cs = 0; cs < cartSelectors.length; cs++) {
        var el = document.querySelector(cartSelectors[cs]);
        if (el) {
          var count = parseInt(el.textContent.trim(), 10);
          if (count > 0) return true;
        }
      }
      if (
        window.location.pathname.indexOf("/cart") === 0 ||
        window.location.pathname.indexOf("/checkout") === 0
      )
        return true;
    } catch (e) {}
    return false;
  }

  cartDetected = detectCart();
  if (cartDetected && !userInteractedWithChat && PROACTIVE_ENABLED) {
    setTimeout(function () {
      if (!userInteractedWithChat && !cartAbandonedShown && !proactiveCooldown) {
        cartAbandonedShown = true;
        triggerProactiveWithMsg(
          "I see you have items in your cart! Need any help with your order?",
        );
      }
    }, 20000);
  }

  function resetInactivityTimer() {
    if (!PROACTIVE_ENABLED || userInteractedWithChat || proactiveCooldown || proactiveDismissed) return;
    if (inactivityTimer) clearTimeout(inactivityTimer);
    var delay = getInactivityDelay(pageType) * 1000;
    inactivityTimer = setTimeout(function () {
      triggerProactive();
    }, delay);
  }

  function triggerProactive() {
    if (!PROACTIVE_ENABLED || userInteractedWithChat || proactiveCooldown || proactiveDismissed) return;
    var available = PROACTIVE_MESSAGES.filter(function (m) {
      return proactiveUsedMessages.indexOf(m) === -1;
    });
    if (available.length === 0) {
      proactiveUsedMessages = [];
      available = PROACTIVE_MESSAGES.slice();
    }
    var msg = available[Math.floor(Math.random() * available.length)];
    proactiveUsedMessages.push(msg);
    showProactiveBubble(msg);
    proactiveCooldown = true;
    setTimeout(function () {
      proactiveCooldown = false;
      resetInactivityTimer();
    }, 120000);
  }

  var proactiveBubbleTimer = null;
  var onProactiveShow = null;

  function showProactiveBubble(msg) {
    if (proactiveDismissed) return;
    var existing = document.getElementById("cc-ai-proactive");
    if (existing) existing.parentNode.removeChild(existing);

    var el = document.createElement("div");
    el.id = "cc-ai-proactive";
    el.className = "cc-ai-proactive-bubble";
    el.setAttribute("role", "status");

    var messageText = document.createElement("span");
    messageText.className = "cc-ai-proactive-text";
    messageText.textContent = msg;
    el.appendChild(messageText);

    var dismissButton = document.createElement("button");
    dismissButton.type = "button";
    dismissButton.className = "cc-ai-proactive-close";
    dismissButton.setAttribute("aria-label", "Dismiss chat message");
    dismissButton.title = "Dismiss";
    dismissButton.innerHTML = "&times;";
    dismissButton.addEventListener("click", function (event) {
      event.preventDefault();
      event.stopPropagation();
      proactiveDismissed = true;
      try {
        sessionStorage.setItem("cc_proactive_dismissed", "1");
      } catch (e) {}
      if (proactiveBubbleTimer) clearTimeout(proactiveBubbleTimer);
      if (el.parentNode) el.parentNode.removeChild(el);
    });
    el.appendChild(dismissButton);

    var pos = "{{POSITION}}" || "bottom-right";
    if (pos === "bottom-left") {
      el.style.bottom = "90px";
      el.style.left = "20px";
    } else if (pos === "top-right") {
      el.style.top = "90px";
      el.style.right = "20px";
    } else if (pos === "top-left") {
      el.style.top = "90px";
      el.style.left = "20px";
    } else {
      el.style.bottom = "90px";
      el.style.right = "20px";
    }

    el.addEventListener("click", function () {
      if (typeof window.__ccAiShowChat === "function") window.__ccAiShowChat();
      else if (typeof window.__ccAiToggle === "function") window.__ccAiToggle();
      if (el.parentNode) el.parentNode.removeChild(el);
    });

    document.body.appendChild(el);
    if (typeof onProactiveShow === "function") onProactiveShow(msg);
    playNotifySound();

    if (proactiveBubbleTimer) clearTimeout(proactiveBubbleTimer);
    proactiveBubbleTimer = setTimeout(function () {
      if (el.parentNode) el.parentNode.removeChild(el);
    }, 15000);
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, "&amp;")
      .replace(/</g, "&lt;")
      .replace(/>/g, "&gt;")
      .replace(/"/g, "&quot;")
      .replace(/'/g, "&#39;");
  }

  function safeUrl(url) {
    try {
      var u = String(url || "").trim();
      if (/^(https?:|mailto:)/i.test(u)) return u;
    } catch (e) {}
    return null;
  }

  function renderMarkdownSafe(content, container) {
    container.textContent = "";
    var text = String(content || "");
    var lines = text.split("\n");
    var ul = null;

    function flushInline(parent, line) {
      var re = /(\[([^\]]+)\]\(([^)]+)\)|\*\*(.+?)\*\*|\*(.+?)\*|`([^`]+)`)/g;
      var last = 0;
      var m;
      while ((m = re.exec(line)) !== null) {
        if (m.index > last) parent.appendChild(document.createTextNode(line.slice(last, m.index)));
        if (m[2] && m[3]) {
          var href = safeUrl(m[3]);
          if (href) {
            var a = document.createElement("a");
            a.href = href;
            a.target = "_blank";
            a.rel = "noopener noreferrer";
            a.textContent = m[2];
            parent.appendChild(a);
          } else {
            parent.appendChild(document.createTextNode(m[2]));
          }
        } else if (m[4]) {
          var strong = document.createElement("strong");
          strong.textContent = m[4];
          parent.appendChild(strong);
        } else if (m[5]) {
          var em = document.createElement("em");
          em.textContent = m[5];
          parent.appendChild(em);
        } else if (m[6]) {
          var code = document.createElement("code");
          code.textContent = m[6];
          parent.appendChild(code);
        }
        last = m.index + m[0].length;
      }
      if (last < line.length) parent.appendChild(document.createTextNode(line.slice(last)));
    }

    for (var i = 0; i < lines.length; i++) {
      var line = lines[i];
      var bullet = line.match(/^\s*[-*]\s+(.+)/);
      if (bullet) {
        if (!ul) {
          ul = document.createElement("ul");
          container.appendChild(ul);
        }
        var li = document.createElement("li");
        flushInline(li, bullet[1]);
        ul.appendChild(li);
        continue;
      }
      ul = null;
      if (i > 0) container.appendChild(document.createElement("br"));
      flushInline(container, line);
    }
  }

  async function init() {
    if (!API_KEY) {
      console.warn("[CircuCity AI] No API key provided");
      return;
    }

    try {
      var verifyRes = await fetch(CHATBOT_BASE + "/api/verify", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ api_key: API_KEY, workspace_id: WS_ID || undefined }),
      });
      if (verifyRes.ok) {
        var verifyData = await verifyRes.json();
        if (verifyData && verifyData.workspace) {
          WS_NAME = verifyData.workspace.businessName || WS_NAME;
          BOT_NAME = (verifyData.embed && verifyData.embed.botName) || BOT_NAME;
          var storedGreeting = verifyData.workspace.greetingMessage;
          var suggested = verifyData.workspace.suggestedPrompts;
          if (suggested) {
            try {
              var parsed = typeof suggested === "string" ? JSON.parse(suggested) : suggested;
              if (Array.isArray(parsed) && parsed.length > 0) {
                PROACTIVE_MESSAGES = parsed.concat(PROACTIVE_MESSAGES).slice(0, 6);
                if (parsed.length >= 3) {
                  var suggestionsOverride = [];
                  for (var si = 0; si < parsed.length && si < 4; si++) {
                    suggestionsOverride.push(parsed[si]);
                  }
                  if (suggestionsOverride.length > 0) SUGGESTION_CHIPS = suggestionsOverride;
                }
              }
            } catch (e) {}
          }
          if (storedGreeting) {
            GREETING = storedGreeting;
          }
          PRIMARY_COLOR = (verifyData.embed && verifyData.embed.primaryColor) || PRIMARY_COLOR;
        }
      }
    } catch (err) {
      console.warn("[CircuCity AI] Verify fetch error:", err.message || err);
    }

    userName = detectUserName() || userName;
    if (userName) {
      try {
        localStorage.setItem("cc_user_name", userName);
      } catch (e) {}
    }

    var style = document.createElement("style");
    style.dataset.ccAiStyle = "1";
    style.textContent =
      ":root{--cc-primary:" +
      PRIMARY_COLOR +
      ";--cc-primary-rgb:" +
      PRIMARY_RGB +
      ";}" +
      `{{CSS_CONTENT}}`;
    document.head.appendChild(style);

    // Fire page visit flow trigger
    (function () {
      fetch(CHATBOT_BASE + "/api/flows/trigger", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          apiKey: API_KEY,
          event: "page_visit",
          data: { url: window.location.href, title: document.title },
          sessionId: sessionIdGlobal,
        }),
      }).catch(function () {});
    })();

    var BOT_AVATAR_SVG =
      '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>';
    var SEARCH_ICON =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><circle cx="11" cy="11" r="7"/><path d="M21 21l-4.35-4.35"/></svg>';
    var SEND_ICON =
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
    var HOME_ICON =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M3 10.5L12 3l9 7.5"/><path d="M5 9.5V21h14V9.5"/></svg>';
    var MSG_ICON =
      '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21 15a2 2 0 01-2 2H7l-4 4V5a2 2 0 012-2h14a2 2 0 012 2z"/></svg>';
    var THUMB_UP_ICON =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M14 9V5a3 3 0 0 0-3-3l-4 9v11h11.28a2 2 0 0 0 2-1.7l1.38-9a2 2 0 0 0-2-2.3zM7 22H4a2 2 0 0 1-2-2v-7a2 2 0 0 1 2-2h3"/></svg>';
    var THUMB_DOWN_ICON =
      '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 15v4a3 3 0 0 0 3 3l4-9V2H5.72a2 2 0 0 0-2 1.7l-1.38 9a2 2 0 0 0 2 2.3zm7-13h2.67A2.31 2.31 0 0 1 22 4v7a2.31 2.31 0 0 1-2.33 2H17"/></svg>';

    var isOpen = false;
    var sessionId =
      savedSessionId || "sess_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
    sessionIdGlobal = sessionId;
    try {
      localStorage.setItem(SESSION_KEY, sessionId);
    } catch (e) {}
    var messages = [];
    var loadedHistory = null;
    var historyLoaded = false;
    var isSending = false;
    var activeController = null;
    var botMsgCount = 0;
    var unreadCount = 0;

    var widget = document.createElement("div");
    widget.id = "cc-ai-widget";

    var bubble = null;
    var badge = null;
    var launcher = null;
    if (!NO_BUBBLE) {
      launcher = document.createElement("div");
      launcher.id = "cc-ai-launcher";
      launcher.setAttribute("role", "button");
      launcher.setAttribute("aria-label", "Open chat with " + BOT_NAME);
      launcher.setAttribute("tabindex", "0");

      var pill = document.createElement("div");
      pill.id = "cc-ai-launcher-pill";
      pill.textContent = "Chat with " + (BOT_NAME || "us");
      launcher.appendChild(pill);

      bubble = document.createElement("div");
      bubble.id = "cc-ai-bubble";
      bubble.title = "Chat with " + WS_NAME;
      bubble.innerHTML =
        '<span id="cc-ai-bubble-icon">' +
        '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor">' +
        '<path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/>' +
        "</svg>" +
        "</span>";
      badge = document.createElement("span");
      badge.id = "cc-ai-badge";
      badge.setAttribute("aria-live", "polite");
      bubble.appendChild(badge);
      launcher.appendChild(bubble);
      launcher.setAttribute("role", "button");
      launcher.setAttribute("aria-label", "Open chat with " + BOT_NAME);
      widget.appendChild(launcher);
    }

    var windowEl = document.createElement("div");
    windowEl.id = "cc-ai-window";
    windowEl.setAttribute("role", "dialog");
    windowEl.setAttribute("aria-label", BOT_NAME + " chat");

    var header = document.createElement("div");
    header.id = "cc-ai-header";
    header.innerHTML =
      '<div class="cc-header-left">' +
      '<div class="bot-avatar">' +
      BOT_AVATAR_SVG +
      "</div>" +
      '<div class="cc-header-info">' +
      '<div class="cc-header-name">' +
      escapeHtml(BOT_NAME) +
      "</div>" +
      '<div class="status"><span class="status-dot"></span> Online · replies instantly</div>' +
      "</div></div>" +
      '<div class="cc-header-actions">' +
      (HANDOFF_ENABLED
        ?       '<button id="cc-ai-handoff-btn" class="cc-header-btn" type="button" title="' + t("talkHuman") + '">' +
          '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg></button>'
        : "") +
      '<button id="cc-ai-sound" class="cc-header-btn' +
      (soundMuted ? "" : " active") +
      '" type="button" title="' + t("toggleSound") + '">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg></button>' +
      '<button id="cc-ai-new-chat" class="cc-header-btn" type="button" title="' + t("newConversation") + '">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M12 5v14M5 12h14"/></svg></button>' +
      '<button id="cc-ai-close" class="cc-header-btn" type="button" title="' + t("minimize") + '" aria-label="' + t("closeChat") + '">' +
      '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M18 15l-6-6-6 6"/></svg></button>' +
      "</div>";
    windowEl.appendChild(header);

    var leadEl = document.createElement("div");
    leadEl.id = "cc-ai-lead";
    leadEl.innerHTML =
      '<div class="cc-form-title">' + t("leadTitle") + '</div>' +
      '<div class="cc-form-row"><input id="cc-lead-name" type="text" placeholder="' + t("yourName") + '" autocomplete="name" /></div>' +
      '<div class="cc-form-row"><input id="cc-lead-email" type="email" placeholder="' + t("emailOpt") + '" autocomplete="email" /></div>' +
      '<div class="cc-form-actions">' +
      '<button type="button" class="cc-btn cc-btn-primary" id="cc-lead-start">' + t("send") + '</button>' +
      '<button type="button" class="cc-btn cc-btn-ghost" id="cc-lead-skip">' + t("skip") + '</button>' +
      "</div>";
    windowEl.appendChild(leadEl);

    var handoffEl = document.createElement("div");
    handoffEl.id = "cc-ai-handoff";
    handoffEl.innerHTML =
      '<div class="cc-form-title">' + t("talkHuman") + '</div>' +
      '<div class="cc-form-row"><input id="cc-ho-name" type="text" placeholder="' + t("yourName") + '" /></div>' +
      '<div class="cc-form-row"><input id="cc-ho-email" type="email" placeholder="' + t("email") + '" /></div>' +
      '<div class="cc-form-row"><input id="cc-ho-phone" type="tel" placeholder="' + t("phoneOpt") + '" /></div>' +
      '<div class="cc-form-row"><textarea id="cc-ho-issue" rows="2" placeholder="' + t("needHelp") + '"></textarea></div>' +
      '<div class="cc-form-actions">' +
      '<button type="button" class="cc-btn cc-btn-primary" id="cc-ho-submit">Request callback</button>' +
      '<button type="button" class="cc-btn cc-btn-ghost" id="cc-ho-cancel">Cancel</button>' +
      "</div>";
    windowEl.appendChild(handoffEl);

    var bodyEl = document.createElement("div");
    bodyEl.id = "cc-ai-body";
    windowEl.appendChild(bodyEl);

    var messagesEl = document.createElement("div");
    messagesEl.id = "cc-ai-messages";
    messagesEl.setAttribute("aria-live", "polite");
    messagesEl.setAttribute("aria-relevant", "additions");
    bodyEl.appendChild(messagesEl);

    var suggestions = document.createElement("div");
    suggestions.id = "cc-ai-suggestions";
    suggestions.innerHTML =
      '<div class="suggestions-label">Suggested</div><div class="suggestions-container"></div>';
    bodyEl.appendChild(suggestions);

    var homeEl = document.createElement("div");
    homeEl.id = "cc-ai-home";
    homeEl.innerHTML =
      '<div class="cc-home-card cc-home-card--inverse">' +
      '<div class="cc-home-hero">' +
      '<div class="cc-home-avatar">' +
      BOT_AVATAR_SVG +
      "</div>" +
      "</div>" +
      '<div class="cc-home-welcome">' +
      '<h2 class="cc-home-title">' +
      (BOT_NAME ? "Hi, I'm " + escapeHtml(BOT_NAME) + " \u{1F44B}" : t("welcome")) +
      "</h2>" +
      "</div>" +
      '<p class="cc-home-text">' +
      (GREETING ? escapeHtml(GREETING) : t("askAnything")) +
      "</p>" +
      "</div>" +
      '<div class="cc-home-cards" id="cc-home-cards"></div>';
    bodyEl.appendChild(homeEl);

    // Messages (past conversations) and Help (FAQ) views. Populated for real in
    // later phases; ship as simple placeholders so the nav bar has somewhere to go.
    var messagesListEl = document.createElement("div");
    messagesListEl.id = "cc-ai-messages-list";
    messagesListEl.innerHTML = '<div class="cc-conv-empty">' + t("noPast") + '</div>';
    bodyEl.appendChild(messagesListEl);

    var helpEl = document.createElement("div");
    helpEl.id = "cc-ai-help";
    helpEl.innerHTML =
      '<div class="cc-kb-search">' +
      '<input id="cc-kb-input" type="text" placeholder="' + t("askQuestion") + '" autocomplete="off" />' +
      '<button type="button" id="cc-kb-search-btn" aria-label="' + t("search") + '">' + SEARCH_ICON + "</button>" +
      "</div>" +
      '<div id="cc-faq-list" class="cc-faq-list"></div>';
    bodyEl.appendChild(helpEl);

    function fillHomeChips() {
      var container = document.getElementById("cc-home-cards");
      if (!container) { setTimeout(fillHomeChips, 0); return; }
      container.innerHTML = "";
      var list = (SUGGESTION_CHIPS || []).slice(0, 3);
      list.forEach(function (sg) {
        var card = document.createElement("div");
        card.className = "cc-home-card cc-home-card--chat";
        card.setAttribute("role", "button");
        card.setAttribute("tabindex", "0");
        card.innerHTML =
          '<div class="cc-home-card-icon">' + MSG_ICON + "</div>" +
          '<div class="cc-home-card-text">' +
          '<div class="cc-home-card-title"></div>' +
          '<div class="cc-home-card-sub">Ask ' + escapeHtml(BOT_NAME || "us") + "</div>" +
          "</div>";
        card.querySelector(".cc-home-card-title").textContent = sg;
        var activate = function () {
          if (sg.toLowerCase().indexOf("human") !== -1 && HANDOFF_ENABLED) {
            showView("chat");
            openHandoff();
            return;
          }
          showView("chat");
          addMessage("user", sg);
          sendMessageToBot(sg);
        };
        card.addEventListener("click", activate);
        card.addEventListener("keydown", function (e) {
          if (e.key === "Enter" || e.key === " ") { e.preventDefault(); activate(); }
        });
        container.appendChild(card);
      });
    }
    fillHomeChips();


    var csatEl = document.createElement("div");
    csatEl.id = "cc-ai-csat";
    csatEl.innerHTML =
      '<div class="cc-form-title" style="text-align:center">How was your experience?</div>' +
      '<div class="cc-stars" id="cc-stars">' +
      '<button type="button" class="cc-star" data-v="1" aria-label="1 star">★</button>' +
      '<button type="button" class="cc-star" data-v="2" aria-label="2 stars">★</button>' +
      '<button type="button" class="cc-star" data-v="3" aria-label="3 stars">★</button>' +
      '<button type="button" class="cc-star" data-v="4" aria-label="4 stars">★</button>' +
      '<button type="button" class="cc-star" data-v="5" aria-label="5 stars">★</button>' +
      "</div>" +
      '<div class="cc-form-actions" style="justify-content:center">' +
      '<button type="button" class="cc-btn cc-btn-ghost" id="cc-csat-skip">Maybe later</button>' +
      "</div>";
    bodyEl.appendChild(csatEl);

    var inputArea = document.createElement("div");
    inputArea.id = "cc-ai-input-area";

    var emojiPanel = document.createElement("div");
    emojiPanel.id = "cc-ai-emoji-panel";
    emojiPanel.setAttribute("role", "listbox");
    EMOJIS.forEach(function (em) {
      var b = document.createElement("button");
      b.type = "button";
      b.textContent = em;
      b.setAttribute("aria-label", "Insert " + em);
      b.addEventListener("click", function () {
        input.value += em;
        input.focus();
        autoGrow();
        emojiPanel.classList.remove("open");
      });
      emojiPanel.appendChild(b);
    });
    inputArea.appendChild(emojiPanel);

    var inputWrapper = document.createElement("div");
    inputWrapper.id = "cc-ai-input-wrapper";

    var input = document.createElement("textarea");
    input.id = "cc-ai-input";
    input.rows = 1;
    input.placeholder = t("typeMsg");
    input.setAttribute("aria-label", "Message");
    inputWrapper.appendChild(input);

    var currentFile = null;
    var currentFileData = null;

    var filePreview = document.createElement("div");
    filePreview.id = "cc-ai-file-preview";
    filePreview.innerHTML =
      '<img class="cc-file-thumb" id="cc-file-thumb" alt="" style="display:none" />' +
      '<span class="cc-file-icon" id="cc-file-icon">📎</span>' +
      '<span id="cc-file-preview-name"></span>' +
      '<button id="cc-file-preview-remove" type="button" aria-label="' + t("removeFile") + '">&times;</button>';

    var fileInput = document.createElement("input");
    fileInput.type = "file";
    fileInput.id = "cc-file-input";
    fileInput.style.display = "none";
    fileInput.accept = "image/*,.pdf,.doc,.docx,.txt,.csv,.md";

    var attachBtn = document.createElement("button");
    attachBtn.id = "cc-ai-attach";
    attachBtn.type = "button";
    attachBtn.title = t("attachFile");
    attachBtn.setAttribute("aria-label", t("attachFile"));
    attachBtn.innerHTML =
      '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M21.44 11.05l-9.19 9.19a6 6 0 01-8.49-8.49l9.19-9.19a4 4 0 015.66 5.66l-9.2 9.19a2 2 0 01-2.83-2.83l8.49-8.48"/></svg>';
    attachBtn.addEventListener("click", function () {
      fileInput.click();
    });

    function clearFile() {
      currentFile = null;
      currentFileData = null;
      filePreview.style.display = "none";
      fileInput.value = "";
      var thumb = document.getElementById("cc-file-thumb");
      var icon = document.getElementById("cc-file-icon");
      if (thumb) {
        thumb.style.display = "none";
        thumb.removeAttribute("src");
      }
      if (icon) icon.style.display = "inline";
      input.placeholder = t("typeMsg");
    }

    function setFile(file) {
      if (!file) return;
      if (file.size > 10 * 1024 * 1024) {
        showToast("File too large. Maximum size is 10MB.", "error");
        return;
      }
      currentFile = file;
      var reader = new FileReader();
      reader.onload = function (ev) {
        currentFileData = ev.target.result;
        document.getElementById("cc-file-preview-name").textContent = file.name;
        filePreview.style.display = "flex";
        var thumb = document.getElementById("cc-file-thumb");
        var icon = document.getElementById("cc-file-icon");
        if (file.type && file.type.indexOf("image/") === 0 && thumb) {
          thumb.src = currentFileData;
          thumb.style.display = "block";
          if (icon) icon.style.display = "none";
        } else {
          if (thumb) thumb.style.display = "none";
          if (icon) icon.style.display = "inline";
        }
        input.placeholder = t("attachMsg");
      };
      reader.readAsDataURL(file);
    }

    fileInput.addEventListener("change", function (e) {
      var file = e.target.files && e.target.files[0];
      if (file) setFile(file);
    });

    input.addEventListener("paste", function (e) {
      var items = e.clipboardData && e.clipboardData.items;
      if (!items) return;
      for (var i = 0; i < items.length; i++) {
        if (items[i].type.indexOf("image/") === 0) {
          var f = items[i].getAsFile();
          if (f) {
            e.preventDefault();
            setFile(f);
            break;
          }
        }
      }
    });

    inputArea.addEventListener("dragover", function (e) {
      e.preventDefault();
    });
    inputArea.addEventListener("drop", function (e) {
      e.preventDefault();
      var f = e.dataTransfer && e.dataTransfer.files && e.dataTransfer.files[0];
      if (f) setFile(f);
    });

    var composer = document.createElement("div");
    composer.id = "cc-ai-composer";
    composer.appendChild(fileInput);
    composer.appendChild(attachBtn);

    var emojiBtn = document.createElement("button");
    emojiBtn.id = "cc-ai-emoji";
    emojiBtn.type = "button";
    emojiBtn.title = "Emoji";
    emojiBtn.setAttribute("aria-label", "Emoji picker");
    emojiBtn.textContent = "☺";
    emojiBtn.style.fontSize = "16px";
    emojiBtn.addEventListener("click", function () {
      emojiPanel.classList.toggle("open");
    });
    composer.appendChild(emojiBtn);
    composer.appendChild(inputWrapper);

    if (VOICE_ENABLED) {
      var micBtn = document.createElement("button");
      micBtn.id = "cc-ai-mic";
      micBtn.type = "button";
      micBtn.title = "Voice input";
      micBtn.setAttribute("aria-label", "Voice input");
      micBtn.innerHTML =
        '<svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><rect x="9" y="2" width="6" height="11" rx="3"/><path d="M5 10a7 7 0 0 0 14 0"/><line x1="12" y1="19" x2="12" y2="22"/></svg>';
      micBtn.addEventListener("click", function () {
        startVoiceInput();
      });
      composer.appendChild(micBtn);
    }

    var sendBtn = document.createElement("button");
    sendBtn.id = "cc-ai-send";
    sendBtn.type = "button";
    sendBtn.title = "Send message";
    sendBtn.setAttribute("aria-label", "Send message");
    var sendIcon =
      '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z"/></svg>';
    var cancelIcon =
      '<svg width="18" height="18" fill="none" stroke="currentColor" stroke-width="2.5" viewBox="0 0 24 24"><path d="M18 6L6 18M6 6l12 12"/></svg>';
    sendBtn.innerHTML = sendIcon;
    composer.appendChild(sendBtn);
    composer.insertBefore(inputWrapper, composer.firstChild);
    inputArea.appendChild(composer);
    windowEl.appendChild(filePreview);
    windowEl.appendChild(inputArea);

    var navbar = document.createElement("div");
    navbar.id = "cc-ai-navbar";
    navbar.setAttribute("role", "tablist");
    navbar.innerHTML =
      '<button type="button" class="cc-nav-btn" id="cc-nav-home" role="tab" aria-label="Home">' + HOME_ICON + "<span>Home</span></button>" +
      '<button type="button" class="cc-nav-btn" id="cc-nav-messages" role="tab" aria-label="Messages">' + MSG_ICON + "<span>Messages</span></button>" +
      '<button type="button" class="cc-nav-btn" id="cc-nav-help" role="tab" aria-label="Help">' + SEARCH_ICON + "<span>Help</span></button>";
    windowEl.appendChild(navbar);

    var footer = document.createElement("div");
    footer.id = "cc-ai-footer";
    if (!SHOW_BRANDING) footer.className = "hidden";
    footer.innerHTML =
      '<div class="footer-text">' + t("poweredBy") + ' <a href="https://chatbot.circucity.com" class="footer-link" target="_blank" rel="noopener">CircuCity AI</a></div>';
    windowEl.appendChild(footer);

    widget.appendChild(windowEl);
    document.body.appendChild(widget);

    document.addEventListener("click", function (ev) {
      if (ev.target && ev.target.id === "cc-file-preview-remove") clearFile();
      if (
        emojiPanel.classList.contains("open") &&
        !emojiPanel.contains(ev.target) &&
        ev.target !== emojiBtn
      ) {
        emojiPanel.classList.remove("open");
      }
    });

    function autoGrow() {
      input.style.height = "auto";
      input.style.height = Math.min(input.scrollHeight, 120) + "px";
    }
    input.addEventListener("input", autoGrow);

    var toastTimer = null;
    function showToast(msg, type) {
      var existing = document.getElementById("cc-ai-toast");
      if (existing) existing.parentNode.removeChild(existing);
      var toast = document.createElement("div");
      toast.id = "cc-ai-toast";
      toast.className = "cc-toast" + (type ? " cc-toast--" + type : "");
      toast.innerHTML =
        '<span class="cc-toast-icon">' +
        (type === "success" ? "✓" : type === "error" ? "!" : "ℹ") +
        "</span><span>" +
        escapeHtml(msg) +
        "</span>";
      windowEl.appendChild(toast);
      if (toastTimer) clearTimeout(toastTimer);
      toastTimer = setTimeout(function () {
        if (toast.parentNode) toast.parentNode.removeChild(toast);
      }, 3200);
    }

    function setUnread(n) {
      unreadCount = Math.max(0, n);
      if (!badge) return;
      if (unreadCount > 0 && !isOpen) {
        badge.textContent = unreadCount > 9 ? "9+" : String(unreadCount);
        badge.classList.add("show");
        if (bubble) bubble.classList.add("cc-pulse");
      } else {
        badge.classList.remove("show");
        if (bubble) bubble.classList.remove("cc-pulse");
      }
    }

    function notifyIncoming() {
      if (!isOpen) {
        setUnread(unreadCount + 1);
        playNotifySound();
      }
    }

    onProactiveShow = function () {
      notifyIncoming();
    };

    function maybeShowLead() {
      if (errorState) return false;
      if (leadInfo && (leadInfo.name || leadInfo.email)) return false;
      if (userName && userEmail) return false;
      leadEl.classList.add("open");
      var n = document.getElementById("cc-lead-name");
      if (n && userName) n.value = userName;
      return true;
    }

    function hideLead() {
      leadEl.classList.remove("open");
    }

    function saveLead(name, email) {
      userName = name || userName;
      userEmail = email || userEmail;
      leadInfo = { name: userName, email: userEmail };
      try {
        localStorage.setItem(LEAD_KEY, JSON.stringify(leadInfo));
        if (userName) localStorage.setItem("cc_user_name", userName);
      } catch (e) {}
      track("lead_captured", { hasName: !!userName, hasEmail: !!userEmail });
    }

    document.getElementById("cc-lead-start").addEventListener("click", function () {
      var n = (document.getElementById("cc-lead-name").value || "").trim();
      var e = (document.getElementById("cc-lead-email").value || "").trim();
      if (!n && !e) {
        showToast("Add a name or email, or skip.", "error");
        return;
      }
      saveLead(n, e);
      hideLead();
      if (messages.length === 0) {
        addMessage("bot", GREETING);
        showSuggestions();
      }
      showView("chat");
      input.focus();
    });
    document.getElementById("cc-lead-skip").addEventListener("click", function () {
      hideLead();
      if (messages.length === 0) {
        addMessage("bot", GREETING);
        showSuggestions();
      }
      showView("chat");
      input.focus();
    });

    function openHandoff() {
      handoffEl.classList.add("open");
      var n = document.getElementById("cc-ho-name");
      var e = document.getElementById("cc-ho-email");
      if (n) n.value = userName || "";
      if (e) e.value = userEmail || "";
      var issue = document.getElementById("cc-ho-issue");
      if (issue && messages.length) {
        var lastUser = "";
        for (var i = messages.length - 1; i >= 0; i--) {
          if (messages[i].role === "user") {
            lastUser = messages[i].content;
            break;
          }
        }
        if (lastUser) issue.value = lastUser.slice(0, 400);
      }
    }
    function closeHandoff() {
      handoffEl.classList.remove("open");
    }

    var handoffBtn = document.getElementById("cc-ai-handoff-btn");
    if (handoffBtn) handoffBtn.addEventListener("click", openHandoff);
    document.getElementById("cc-ho-cancel").addEventListener("click", closeHandoff);
    document.getElementById("cc-ho-submit").addEventListener("click", async function () {
      var name = (document.getElementById("cc-ho-name").value || "").trim();
      var email = (document.getElementById("cc-ho-email").value || "").trim();
      var phone = (document.getElementById("cc-ho-phone").value || "").trim();
      var issue = (document.getElementById("cc-ho-issue").value || "").trim();
      if (!email && !name) {
        showToast("Please add your name or email.", "error");
        return;
      }
      saveLead(name, email);
      try {
        var res = await fetch(CHATBOT_BASE + "/api/client/handoff", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: API_KEY,
            sessionId: sessionId,
            name: name,
            email: email,
            phone: phone,
            issue: issue,
          }),
        });
        var data = await res.json().catch(function () {
          return {};
        });
        closeHandoff();
        if (res.ok) {
          addMessage("bot", data.reply || "Thanks — a teammate will follow up shortly.");
          showToast(t("handoff"), "success");
        } else {
          showToast(data.error || "Could not request handoff", "error");
        }
      } catch (err) {
        showToast("Connection error", "error");
      }
    });

    function maybeShowCsat() {
      try {
        if (localStorage.getItem(CSAT_KEY + sessionId)) return;
      } catch (e) {}
      if (botMsgCount < 3) return;
      csatEl.classList.add("open");
    }

    function hideCsat() {
      csatEl.classList.remove("open");
      try {
        localStorage.setItem(CSAT_KEY + sessionId, "1");
      } catch (e) {}
    }

    document.getElementById("cc-csat-skip").addEventListener("click", hideCsat);
    document.getElementById("cc-stars").addEventListener("click", async function (ev) {
      var btn = ev.target.closest(".cc-star");
      if (!btn) return;
      var v = parseInt(btn.getAttribute("data-v"), 10);
      var stars = document.querySelectorAll("#cc-stars .cc-star");
      for (var i = 0; i < stars.length; i++) {
        stars[i].classList.toggle("on", i < v);
      }
      try {
        await fetch(CHATBOT_BASE + "/api/client/csat", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiKey: API_KEY,
            sessionId: sessionId,
            rating: v,
            kind: "stars",
          }),
        });
        showToast("Thanks for your feedback!", "success");
      } catch (e) {}
      setTimeout(hideCsat, 600);
    });

    document.getElementById("cc-ai-sound").addEventListener("click", function () {
      soundMuted = !soundMuted;
      try {
        localStorage.setItem(SOUND_KEY, soundMuted ? "1" : "0");
      } catch (e) {}
      this.classList.toggle("active", !soundMuted);
      unlockAudio();
      if (!soundMuted) playNotifySound();
    });

    function setSending(on) {
      isSending = on;
      if (on) {
        sendBtn.classList.add("cc-cancel");
        sendBtn.innerHTML = cancelIcon;
        sendBtn.title = "Cancel";
        sendBtn.setAttribute("aria-label", "Cancel");
      } else {
        sendBtn.classList.remove("cc-cancel");
        sendBtn.innerHTML = sendIcon;
        sendBtn.title = "Send message";
        sendBtn.setAttribute("aria-label", "Send message");
        activeController = null;
      }
    }

    async function toggle() {
      unlockAudio();
      isOpen = !isOpen;
      windowEl.classList.toggle("open", isOpen);
      widget.classList.toggle("chat-open", isOpen);
      var bubbleIconEl = document.getElementById("cc-ai-bubble-icon");
      if (bubbleIconEl) {
        bubbleIconEl.innerHTML = isOpen
          ? '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2.5" d="M6 18L18 6M6 6l12 12"/></svg>'
          : '<svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z"/></svg>';
      }
      if (isOpen) {
        userInteractedWithChat = true;
        setUnread(0);
        if (inactivityTimer) clearTimeout(inactivityTimer);
        var proactiveEl = document.getElementById("cc-ai-proactive");
        if (proactiveEl) proactiveEl.parentNode.removeChild(proactiveEl);
        track("widget_open");
        if (messages.length === 0) {
          if (!historyLoaded) await loadHistory();
          if (loadedHistory && loadedHistory.length > 0) {
            for (var hi = 0; hi < loadedHistory.length; hi++) {
              var hm = loadedHistory[hi];
              addMessage(hm.role, hm.content, false, true);
            }
            loadedHistory = null;
            showView("chat");
          } else if (!maybeShowLead()) {
            showView("home");
          } else {
            showView("chat");
          }
        }
        setTimeout(function () {
          input.focus();
        }, 100);
      } else {
        track("widget_close");
        emojiPanel.classList.remove("open");
        if (launcher && launcher.focus) launcher.focus();
      }
    }

    if (launcher) {
      launcher.addEventListener("click", toggle);
      launcher.addEventListener("keydown", function (e) {
        if (e.key === "Enter" || e.key === " ") {
          e.preventDefault();
          toggle();
        }
      });
    }
    var closeBtn = document.getElementById("cc-ai-close");
    if (closeBtn)
      closeBtn.addEventListener("click", function () {
        if (isOpen) toggle();
      });

    if (NO_BUBBLE) {
      window.__ccAiToggle = function () {
        toggle();
      };
      window.__ccAiClose = function () {
        if (isOpen) toggle();
      };
    }

    for (var _i = 0; _i < _ccQueue.length; _i++) {
      if (_ccQueue[_i] === "toggle") window.__ccAiToggle && window.__ccAiToggle();
      else if (_ccQueue[_i] === "close") window.__ccAiClose && window.__ccAiClose();
    }
    _ccQueue = [];

    var newChatBtn = document.getElementById("cc-ai-new-chat");
    if (newChatBtn) {
      newChatBtn.addEventListener("click", function () {
        resetChat();
        if (isOpen) {
          if (!maybeShowLead()) {
            addMessage("bot", GREETING);
            showSuggestions();
          }
          showView("chat");
        }
        track("new_chat");
      });
    }

    function resetChat() {
      messagesEl.innerHTML = "";
      messages = [];
      botMsgCount = 0;
      sessionId = "sess_" + Date.now() + "_" + Math.random().toString(36).substr(2, 9);
      sessionIdGlobal = sessionId;
      try {
        localStorage.setItem(SESSION_KEY, sessionId);
      } catch (e) {}
      loadedHistory = null;
      renderConversationState(null);
      hideCsat();
      closeHandoff();
    }

    function setActiveNav(view) {
      var messagesActive = view === "messages" || view === "chat";
      if (navHomeBtn) navHomeBtn.classList.toggle("active", view === "home");
      if (navMessagesBtn) navMessagesBtn.classList.toggle("active", messagesActive);
      if (navHelpBtn) navHelpBtn.classList.toggle("active", view === "help");
    }

    function showView(view) {
      var showHome = view === "home";
      var showMessages = view === "messages";
      var showHelp = view === "help";
      var showChat = view === "chat";
      homeEl.style.display = showHome ? "flex" : "none";
      messagesListEl.style.display = showMessages ? "flex" : "none";
      helpEl.style.display = showHelp ? "flex" : "none";
      messagesEl.style.display = showChat ? "flex" : "none";
      suggestions.style.display = showChat ? "block" : "none";
      inputArea.style.display = showChat ? "flex" : "none";
      var csEl = document.getElementById("cc-ai-convstate");
      if (csEl) csEl.style.display = showChat && currentConvState ? "flex" : "none";
      setActiveNav(view);
      if (showHelp) {
        var hi = document.getElementById("cc-kb-input");
        if (hi) {
          hi.value = "";
          hi.focus();
        }
        loadFaqs();
      }
      if (showMessages && typeof renderMessagesList === "function") renderMessagesList();
    }

    function enterChat() {
      if (!maybeShowLead()) {
        addMessage("bot", GREETING);
        showSuggestions();
      }
      showView("chat");
      setTimeout(function () {
        input.focus();
      }, 100);
    }

    function runKbSearch(query) {
      if (!query || !query.trim()) {
        showToast(t("enterTerm"), "info");
        return;
      }
      hideCsat();
      closeHandoff();
      showView("chat");
      addMessage("user", query);
      sendMessageToBot(query);
    }

    var faqCache = null;
    var faqCacheAt = 0;
    var FAQ_CACHE_MS = 5 * 60 * 1000;

    function renderFaqList(faqs) {
      var list = document.getElementById("cc-faq-list");
      if (!list) return;
      list.innerHTML = "";
      if (!faqs || !faqs.length) {
        list.innerHTML = '<div class="cc-conv-empty">' + t("helpEmpty") + '</div>';
        return;
      }
      faqs.forEach(function (faq) {
        var item = document.createElement("div");
        item.className = "cc-faq-item";
        var q = document.createElement("button");
        q.type = "button";
        q.className = "cc-faq-question";
        var qText = document.createElement("span");
        qText.textContent = faq.question || "";
        q.appendChild(qText);
        q.insertAdjacentHTML(
          "beforeend",
          '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M6 9l6 6 6-6"/></svg>'
        );
        var a = document.createElement("div");
        a.className = "cc-faq-answer";
        var aInner = document.createElement("div");
        aInner.className = "cc-faq-answer-inner";
        aInner.textContent = faq.answer || "";
        a.appendChild(aInner);
        q.addEventListener("click", function () {
          item.classList.toggle("open");
        });
        item.appendChild(q);
        item.appendChild(a);
        list.appendChild(item);
      });
    }

    function loadFaqs(force) {
      var list = document.getElementById("cc-faq-list");
      if (!force && faqCache && Date.now() - faqCacheAt < FAQ_CACHE_MS) {
        renderFaqList(faqCache);
        return;
      }
      if (list) list.innerHTML = '<div class="cc-conv-empty">Loading…</div>';
      fetch(CHATBOT_BASE + "/api/widget/faqs?key=" + encodeURIComponent(API_KEY))
        .then(function (r) { return r.json(); })
        .then(function (data) {
          faqCache = data && data.success && Array.isArray(data.data) ? data.data : [];
          faqCacheAt = Date.now();
          renderFaqList(faqCache);
        })
        .catch(function () {
          if (list) list.innerHTML = '<div class="cc-conv-empty">Couldn’t load help articles.</div>';
        });
    }

    var kbInput = document.getElementById("cc-kb-input");
    var kbSearchBox = kbInput ? kbInput.closest(".cc-kb-search") : null;
    if (kbInput && kbSearchBox) {
      kbSearchBox.addEventListener("click", function () {
        kbInput.focus();
      });
      kbInput.addEventListener("keydown", function (e) {
        if (e.key === "Enter") {
          e.preventDefault();
          runKbSearch(kbInput.value);
        }
      });
    }
    var kbSearchBtn = document.getElementById("cc-kb-search-btn");
    if (kbSearchBtn)
      kbSearchBtn.addEventListener("click", function () {
        runKbSearch(kbInput ? kbInput.value : "");
      });
    var navHomeBtn = document.getElementById("cc-nav-home");
    if (navHomeBtn)
      navHomeBtn.addEventListener("click", function () {
        if (!isOpen) return;
        if (isSending) return;
        showView("home");
      });
    var navMessagesBtn = document.getElementById("cc-nav-messages");
    if (navMessagesBtn)
      navMessagesBtn.addEventListener("click", function () {
        if (!isOpen) return;
        if (isSending) return;
        hideCsat();
        closeHandoff();
        showView("messages");
      });
    var navHelpBtn = document.getElementById("cc-nav-help");
    if (navHelpBtn)
      navHelpBtn.addEventListener("click", function () {
        if (!isOpen) return;
        if (isSending) return;
        hideCsat();
        closeHandoff();
        showView("help");
        var hi2 = document.getElementById("cc-kb-input");
        if (hi2) hi2.focus();
      });
    var newChatCard = document.getElementById("cc-new-chat-card");
    if (newChatCard)
      newChatCard.addEventListener("click", function () {
        resetChat();
        enterChat();
        track("new_chat");
      });

    function scrollToBottom() {
      messagesEl.scrollTop = messagesEl.scrollHeight;
    }

    function getLastUserMessage() {
      for (var i = messages.length - 1; i >= 0; i--) {
        if (messages[i].role === "user") return messages[i].content;
      }
      return "";
    }

    function addMessage(role, content, isSystem, skipNotify) {
      var now = new Date();
      var timeStr =
        ("0" + now.getHours()).slice(-2) + ":" + ("0" + now.getMinutes()).slice(-2);

      if (isSystem) {
        var sysRow = document.createElement("div");
        sysRow.className = "cc-msg-row system";
        var sysBubble = document.createElement("div");
        sysBubble.className = "cc-msg system";
        sysBubble.textContent = content;
        sysRow.appendChild(sysBubble);
        messagesEl.appendChild(sysRow);
        scrollToBottom();
        messages.push({ role: role, content: content, timestamp: now.toISOString() });
        return;
      }

      var row = document.createElement("div");
      row.className = "cc-msg-row " + role;

      if (role === "bot") {
        var avatar = document.createElement("div");
        avatar.className = "cc-msg-avatar";
        avatar.innerHTML = BOT_AVATAR_SVG;
        row.appendChild(avatar);
        botMsgCount++;
      }

      var wrap = document.createElement("div");
      wrap.className = "cc-msg-wrap";

      var bubbleMsg = document.createElement("div");
      bubbleMsg.className = "cc-msg " + role;
      renderMarkdownSafe(content, bubbleMsg);
      wrap.appendChild(bubbleMsg);

      if (role === "bot") {
        var actions = document.createElement("div");
        actions.className = "cc-msg-actions";
        if (VOICE_ENABLED) {
          var speakerBtn = document.createElement("button");
          speakerBtn.className = "cc-msg-speaker";
          speakerBtn.type = "button";
          speakerBtn.title = t("readAloud");
          speakerBtn.innerHTML =
            '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
          speakerBtn.addEventListener("click", function (e) {
            e.stopPropagation();
            speakText(content, speakerBtn);
          });
          actions.appendChild(speakerBtn);
        }
        var up = document.createElement("button");
        up.className = "cc-thumb cc-thumb-up";
        up.type = "button";
        up.title = "Helpful";
        up.innerHTML = THUMB_UP_ICON;
        var down = document.createElement("button");
        down.className = "cc-thumb cc-thumb-down";
        down.type = "button";
        down.title = "Not helpful";
        down.innerHTML = THUMB_DOWN_ICON;
        up.addEventListener("click", function () {
          up.classList.add("active");
          down.classList.remove("active");
          fetch(CHATBOT_BASE + "/api/client/csat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              apiKey: API_KEY,
              sessionId: sessionId,
              rating: 5,
              kind: "thumbs",
            }),
          }).catch(function () {});
        });
        down.addEventListener("click", function () {
          down.classList.add("active");
          up.classList.remove("active");
          fetch(CHATBOT_BASE + "/api/client/csat", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              apiKey: API_KEY,
              sessionId: sessionId,
              rating: 1,
              kind: "thumbs",
              comment: "thumbs_down",
              question: getLastUserMessage(),
              answer: content,
            }),
          }).catch(function () {});
        });
        actions.appendChild(up);
        actions.appendChild(down);
        wrap.appendChild(actions);
        if (!skipNotify) notifyIncoming();
        if (botMsgCount === 3) setTimeout(maybeShowCsat, 800);
      }

      var timeSpan = document.createElement("span");
      timeSpan.className = "cc-msg-time";
      timeSpan.textContent = timeStr;
      wrap.appendChild(timeSpan);
      row.appendChild(wrap);
      messagesEl.appendChild(row);
      scrollToBottom();
      messages.push({ role: role, content: content, timestamp: now.toISOString() });
    }

    var typingRow = null;
    var statusEl = header.querySelector(".status");
    var statusDefaultHtml =
      '<span class="status-dot"></span> Online · replies instantly';

    function setStatus(html) {
      if (statusEl) statusEl.innerHTML = html;
    }

    function showTyping() {
      hideTyping();
      setStatus('<span class="status-dot"></span> Typing…');
      typingRow = document.createElement("div");
      typingRow.id = "cc-ai-typing";
      typingRow.className = "cc-msg-row bot";
      typingRow.innerHTML =
        '<div class="cc-msg-avatar">' +
        BOT_AVATAR_SVG +
        "</div>" +
        '<div class="cc-msg-wrap"><div class="cc-msg bot cc-typing-bubble">' +
        '<span class="cc-dot"></span><span class="cc-dot"></span><span class="cc-dot"></span></div></div>';
      messagesEl.appendChild(typingRow);
      scrollToBottom();
    }

    function hideTyping() {
      if (typingRow && typingRow.parentNode) typingRow.parentNode.removeChild(typingRow);
      typingRow = null;
      var legacy = document.getElementById("cc-ai-typing");
      if (legacy && legacy.parentNode) legacy.parentNode.removeChild(legacy);
      setStatus(statusDefaultHtml);
    }

    function beginBotStream() {
      hideTyping();
      setStatus('<span class="status-dot"></span> Writing…');
      var now = new Date();
      var timeStr =
        ("0" + now.getHours()).slice(-2) + ":" + ("0" + now.getMinutes()).slice(-2);
      var row = document.createElement("div");
      row.className = "cc-msg-row bot";
      var avatar = document.createElement("div");
      avatar.className = "cc-msg-avatar";
      avatar.innerHTML = BOT_AVATAR_SVG;
      row.appendChild(avatar);
      var wrap = document.createElement("div");
      wrap.className = "cc-msg-wrap";
      var bubbleMsg = document.createElement("div");
      bubbleMsg.className = "cc-msg bot streaming";
      wrap.appendChild(bubbleMsg);
      var timeSpan = document.createElement("span");
      timeSpan.className = "cc-msg-time";
      timeSpan.textContent = timeStr;
      wrap.appendChild(timeSpan);
      row.appendChild(wrap);
      messagesEl.appendChild(row);
      scrollToBottom();
      botMsgCount++;
      var full = "";
      return {
        append: function (chunk) {
          full += chunk;
          renderMarkdownSafe(full, bubbleMsg);
          scrollToBottom();
        },
        set: function (text) {
          full = text || "";
          renderMarkdownSafe(full, bubbleMsg);
          scrollToBottom();
        },
        finalize: function (finalText) {
          if (finalText != null) full = finalText;
          bubbleMsg.classList.remove("streaming");
          renderMarkdownSafe(full, bubbleMsg);
          var actions = document.createElement("div");
          actions.className = "cc-msg-actions";
          if (VOICE_ENABLED) {
            var speakerBtn = document.createElement("button");
            speakerBtn.className = "cc-msg-speaker";
            speakerBtn.type = "button";
            speakerBtn.title = t("readAloud");
            speakerBtn.innerHTML =
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polygon points="11 5 6 9 2 9 2 15 6 15 11 19 11 5"/><path d="M15.54 8.46a5 5 0 0 1 0 7.07"/></svg>';
            speakerBtn.addEventListener("click", function (e) {
              e.stopPropagation();
              speakText(full, speakerBtn);
            });
            actions.appendChild(speakerBtn);
          }
          var up = document.createElement("button");
          up.className = "cc-thumb cc-thumb-up";
          up.type = "button";
          up.title = "Helpful";
          up.innerHTML = THUMB_UP_ICON;
          var down = document.createElement("button");
          down.className = "cc-thumb cc-thumb-down";
          down.type = "button";
          down.title = "Not helpful";
          down.innerHTML = THUMB_DOWN_ICON;
          up.addEventListener("click", function () {
            up.classList.add("active");
            down.classList.remove("active");
            fetch(CHATBOT_BASE + "/api/client/csat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                apiKey: API_KEY,
                sessionId: sessionId,
                rating: 5,
                kind: "thumbs",
              }),
            }).catch(function () {});
          });
          down.addEventListener("click", function () {
            down.classList.add("active");
            up.classList.remove("active");
            fetch(CHATBOT_BASE + "/api/client/csat", {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify({
                apiKey: API_KEY,
                sessionId: sessionId,
                rating: 1,
                kind: "thumbs",
                comment: "thumbs_down",
                question: getLastUserMessage(),
                answer: full,
              }),
            }).catch(function () {});
          });
          actions.appendChild(up);
          actions.appendChild(down);
          wrap.insertBefore(actions, timeSpan);
          messages.push({
            role: "bot",
            content: full,
            timestamp: now.toISOString(),
          });
          notifyIncoming();
          if (botMsgCount === 3) setTimeout(maybeShowCsat, 800);
          setStatus(statusDefaultHtml);
          scrollToBottom();
          return full;
        },
        remove: function () {
          if (row.parentNode) row.parentNode.removeChild(row);
          botMsgCount = Math.max(0, botMsgCount - 1);
          setStatus(statusDefaultHtml);
        },
        getText: function () {
          return full;
        },
      };
    }

    async function consumeSse(res, onEvent) {
      if (!res.body || !res.body.getReader) {
        var json = await res.json();
        if (json.duplicate) {
          onEvent({ type: "done", duplicate: true });
          return;
        }
        onEvent({
          type: "done",
          reply: json.reply,
          products: json.products,
          actions: json.actions,
          offerHandoff: json.offerHandoff,
          flowMessages: json.flowMessages,
        });
        return;
      }
      var reader = res.body.getReader();
      var decoder = new TextDecoder();
      var buffer = "";
      while (true) {
        var result = await reader.read();
        if (result.done) break;
        buffer += decoder.decode(result.value, { stream: true });
        var parts = buffer.split("\n\n");
        buffer = parts.pop() || "";
        for (var i = 0; i < parts.length; i++) {
          var block = parts[i].trim();
          if (!block) continue;
          var lines = block.split("\n");
          for (var li = 0; li < lines.length; li++) {
            var line = lines[li];
            if (line.indexOf("data:") !== 0) continue;
            var raw = line.slice(5).trim();
            if (!raw || raw === "[DONE]") continue;
            try {
              onEvent(JSON.parse(raw));
            } catch (e) {}
          }
        }
      }
    }

    var lastSentText = "";
    var errorState = false;
    var convStateElCached = null;
    var currentConvState = null;

    function getConvStateEl() {
      if (convStateElCached) return convStateElCached;
      var area = document.getElementById("cc-ai-input-area");
      if (!area) return null;
      var el = document.createElement("div");
      el.id = "cc-ai-convstate";
      el.style.display = "none";
      area.parentNode.insertBefore(el, area);
      convStateElCached = el;
      return el;
    }

    function renderSources(sources) {
      if (!sources || !sources.length) return;
      var wraps = messagesEl.querySelectorAll(".cc-msg-row.bot .cc-msg-wrap");
      var wrap = wraps[wraps.length - 1];
      if (!wrap) return;
      var src = document.createElement("div");
      src.className = "cc-msg-source";
      var label = document.createElement("span");
      label.className = "cc-msg-source-label";
      label.textContent = "Based on:";
      src.appendChild(label);
      for (var i = 0; i < sources.length; i++) {
        var s = sources[i];
        if (i > 0) src.appendChild(document.createTextNode(" · "));
        var a = document.createElement("a");
        a.textContent = s.title;
        if (s.url) {
          a.href = s.url;
          a.target = "_blank";
          a.rel = "noopener";
        }
        src.appendChild(a);
      }
      wrap.appendChild(src);
    }

    function renderConversationState(state) {
      currentConvState = state || null;
      var el = getConvStateEl();
      if (!el) return;
      if (!currentConvState) {
        el.style.display = "none";
        return;
      }
      var parts = [];
      if (currentConvState.category) parts.push("in " + currentConvState.category);
      if (currentConvState.priceMax != null) parts.push("under " + currentConvState.priceMax + " SEK");
      if (currentConvState.priceMin != null) parts.push("over " + currentConvState.priceMin + " SEK");
      if (currentConvState.keywords && currentConvState.keywords.length) parts.push(currentConvState.keywords.join(", "));
      if (currentConvState.giftFor) parts.push("gift for " + currentConvState.giftFor);
      el.innerHTML = "";
      var label = document.createElement("span");
      label.className = "cc-cs-label";
      label.textContent = "Looking for:";
      el.appendChild(label);
      for (var i = 0; i < parts.length; i++) {
        var chip = document.createElement("button");
        chip.type = "button";
        chip.className = "cc-cs-chip";
        chip.textContent = parts[i];
        chip.title = "Edit search";
        (function (t) {
          chip.addEventListener("click", function () {
            var inp = document.getElementById("cc-ai-input");
            if (inp) {
              inp.value = t;
              inp.focus();
            }
          });
        })(parts[i]);
        el.appendChild(chip);
      }
      var clear = document.createElement("button");
      clear.type = "button";
      clear.className = "cc-cs-clear";
      clear.textContent = "✕";
      clear.title = "Clear search";
      clear.setAttribute("aria-label", "Clear search");
      clear.addEventListener("click", function () {
        currentConvState = null;
        var cEl = getConvStateEl();
        if (cEl) cEl.style.display = "none";
      });
      el.appendChild(clear);
      el.style.display = "flex";
    }

    function addErrorMessage(msg, actions) {
      errorState = true;
      var row = document.createElement("div");
      row.className = "cc-msg-row bot";
      var avatar = document.createElement("div");
      avatar.className = "cc-msg-avatar";
      avatar.innerHTML = BOT_AVATAR_SVG;
      row.appendChild(avatar);
      var wrap = document.createElement("div");
      wrap.className = "cc-msg-wrap";
      var bubble = document.createElement("div");
      bubble.className = "cc-msg bot cc-msg-error";
      bubble.textContent = msg;
      wrap.appendChild(bubble);
      var acts = document.createElement("div");
      acts.className = "cc-err-actions";
      if (!actions || actions.indexOf("retry") !== -1) {
        var retry = document.createElement("button");
        retry.type = "button";
        retry.className = "cc-err-btn cc-err-btn-primary";
        retry.textContent = "Retry";
        retry.addEventListener("click", function () {
          if (lastSentText) sendMessageToBot(lastSentText);
        });
        acts.appendChild(retry);
      }
      if (!actions || actions.indexOf("browse") !== -1) {
        var browse = document.createElement("button");
        browse.type = "button";
        browse.className = "cc-err-btn";
        browse.textContent = "Browse store";
        browse.addEventListener("click", function () {
          window.open(window.location.origin, "_blank");
        });
        acts.appendChild(browse);
      }
      if (HANDOFF_ENABLED && (!actions || actions.indexOf("handoff") !== -1)) {
        var human = document.createElement("button");
        human.type = "button";
        human.className = "cc-err-btn";
        human.textContent = t("talkHuman");
        human.addEventListener("click", function () {
          if (typeof openHandoff === "function") openHandoff();
        });
        acts.appendChild(human);
      }
      wrap.appendChild(acts);
      row.appendChild(wrap);
      messagesEl.appendChild(row);
      scrollToBottom();
      messages.push({ role: "bot", content: msg, timestamp: new Date().toISOString() });
    }

    function handleBotPayload(data) {
      if (!data) return;
      if (data.products && data.products.length > 0) renderProductCards(data.products);
      if (data.sources && data.sources.length > 0) renderSources(data.sources);
      if (data.conversationState) renderConversationState(data.conversationState);
      if (data.actions && data.actions.length > 0) handleChatActions(data.actions);
      if (data.offerHandoff && HANDOFF_ENABLED) {
        addMessage("system", t("handoff"), true);
      }
      if (data.flowMessages && data.flowMessages.length > 0) {
        showFlowMessages(data.flowMessages);
      }
      showContextSuggestions();
    }

    function showFlowMessages(flowMessages) {
      if (!flowMessages || !flowMessages.length) return;
      (function showFlowMsgs(idx) {
        if (idx >= flowMessages.length) return;
        var msg = flowMessages[idx];
        if (msg && msg.messages && msg.messages.length) {
          showFlowMessages(msg.messages);
          showFlowMsgs(idx + 1);
          return;
        }
        var raw = msg.message || msg.content || msg;
        if (typeof raw !== "string") {
          showFlowMsgs(idx + 1);
          return;
        }
        if (raw.indexOf("__WAIT__:") === 0) {
          var secs = parseInt(raw.split(":")[1]) || 1;
          setTimeout(function () {
            showFlowMsgs(idx + 1);
          }, secs * 1000);
        } else {
          addMessage("bot", raw, false, true);
          speakText(raw);
          setTimeout(function () {
            showFlowMsgs(idx + 1);
          }, 400);
        }
      })(0);
      scrollToBottom();
    }

    var chipsShownOnce = false;
    var chipsWithContext = null;
    var chipsAnswered = false;
    var lastReplyText = "";

    function pageSuggestions() {
      var url = window.location.href.toLowerCase();
      if (url.indexOf("/product") !== -1 || url.indexOf("/products") !== -1) {
        return [
          "Do you ship internationally?",
          "What's the return policy?",
          "What sizes are available?",
        ];
      }
      if (url.indexOf("/cart") !== -1 || url.indexOf("checkout") !== -1) {
        return ["How do I pay?", "Can you help with checkout?", "Do you have discount codes?"];
      }
      if (url.indexOf("/contact") !== -1 || url.indexOf("/about") !== -1) {
        return ["Where are you located?", "What are your hours?", "How do I get support?"];
      }
      return SUGGESTION_CHIPS;
    }

    function showContextSuggestions() {
      if (chipsAnswered || chipsShownOnce) return;
      if (isSending) return;
      if (document.querySelectorAll(".suggestions-container .cc-suggestion").length > 0)
        return;
      chipsShownOnce = true;
      chipsWithContext = pageSuggestions();
      var container = document.querySelector(".suggestions-container");
      if (!container) return;
      container.innerHTML = "";
      chipsWithContext.forEach(function (sg) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cc-suggestion";
        btn.textContent = sg;
        btn.addEventListener("click", function () {
          if (sg.toLowerCase().indexOf("human") !== -1 && HANDOFF_ENABLED) {
            openHandoff();
            container.style.display = "none";
            return;
          }
          addMessage("user", sg);
          sendMessageToBot(sg);
          container.style.display = "none";
        });
        container.appendChild(btn);
      });
      document.getElementById("cc-ai-suggestions").style.display = "block";
    }

    function showSuggestions() {
      var s = SUGGESTION_CHIPS;
      var container = document.querySelector(".suggestions-container");
      container.innerHTML = "";
      s.forEach(function (sg) {
        var btn = document.createElement("button");
        btn.type = "button";
        btn.className = "cc-suggestion";
        btn.textContent = sg;
        btn.addEventListener("click", function () {
          if (sg.toLowerCase().indexOf("human") !== -1 && HANDOFF_ENABLED) {
            openHandoff();
            container.style.display = "none";
            return;
          }
          addMessage("user", sg);
          sendMessageToBot(sg);
          container.style.display = "none";
        });
        container.appendChild(btn);
      });
      document.getElementById("cc-ai-suggestions").style.display = "block";
    }

    function hideSuggestions() {
      document.getElementById("cc-ai-suggestions").style.display = "none";
    }

    async function loadHistory() {
      if (!sessionId) return;
      try {
        var res = await fetch(
          CHATBOT_BASE +
            "/api/chat/history?sessionId=" +
            encodeURIComponent(sessionId) +
            "&apiKey=" +
            encodeURIComponent(API_KEY),
        );
        if (res.ok) {
          var data = await res.json();
          if (data.messages && data.messages.length > 0) {
            loadedHistory = data.messages.map(function (m) {
              if (m.role === "assistant") m.role = "bot";
              return m;
            });
          }
          if (data.customerName && !userName) userName = data.customerName;
          if (data.customerEmail && !userEmail) userEmail = data.customerEmail;
        }
      } catch (e) {}
      historyLoaded = true;
    }

    async function openConversation(targetSessionId) {
      sessionId = targetSessionId;
      sessionIdGlobal = sessionId;
      try {
        localStorage.setItem(SESSION_KEY, sessionId);
      } catch (e) {}
      messagesEl.innerHTML = "";
      messages = [];
      botMsgCount = 0;
      hideCsat();
      closeHandoff();
      historyLoaded = false;
      loadedHistory = null;
      await loadHistory();
      if (loadedHistory && loadedHistory.length > 0) {
        for (var hi = 0; hi < loadedHistory.length; hi++) {
          var hm = loadedHistory[hi];
          addMessage(hm.role, hm.content, false, true);
        }
        loadedHistory = null;
      }
      showView("chat");
    }

    async function renderMessagesList() {
      var list = document.getElementById("cc-ai-messages-list");
      if (!list) return;
      list.innerHTML = '<div class="cc-conv-empty">Loading…</div>';
      var items = [];
      try {
        var res = await fetch(
          CHATBOT_BASE +
            "/api/widget/conversations?key=" +
            encodeURIComponent(API_KEY) +
            "&visitorId=" +
            encodeURIComponent(visitorIdGlobal) +
            "&limit=20",
        );
        if (res.ok) {
          var data = await res.json();
          if (data && data.success && Array.isArray(data.data)) items = data.data;
        }
      } catch (e) {}

      list.innerHTML = "";
      var newRow = document.createElement("button");
      newRow.type = "button";
      newRow.className = "cc-conv-item cc-conv-item--new";
      newRow.innerHTML =
        '<div class="cc-conv-item-icon">' + MSG_ICON + "</div>" +
        '<div class="cc-conv-item-text"><div class="cc-conv-item-title">Start a new conversation</div></div>';
      newRow.addEventListener("click", function () {
        resetChat();
        enterChat();
        track("new_chat");
      });
      list.appendChild(newRow);

      if (!items.length) {
        var empty = document.createElement("div");
        empty.className = "cc-conv-empty";
        empty.textContent = t("noPast");
        list.appendChild(empty);
        return;
      }

      items.forEach(function (conv) {
        var row = document.createElement("button");
        row.type = "button";
        row.className = "cc-conv-item";
        var when = "";
        try {
          when = new Date(conv.updatedAt).toLocaleDateString(undefined, { month: "short", day: "numeric" });
        } catch (e) {}
        row.innerHTML =
          '<div class="cc-conv-item-icon">' + MSG_ICON + "</div>" +
          '<div class="cc-conv-item-text">' +
          '<div class="cc-conv-item-title"></div>' +
          '<div class="cc-conv-item-sub"></div>' +
          "</div>";
        row.querySelector(".cc-conv-item-title").textContent = conv.title || "Conversation";
        row.querySelector(".cc-conv-item-sub").textContent = when + " · " + (conv.messageCount || 0) + " messages";
        row.addEventListener("click", function () {
          openConversation(conv.sessionId);
        });
        list.appendChild(row);
      });
    }

    async function handleFileSend(text) {
      errorState = false;
      if (!currentFile) return;
      if (isSending) return;
      showTyping();
      setSending(true);
      var msgText = text || "📎 " + currentFile.name;
      addMessage("user", msgText);
      track("file_upload", { type: currentFile.type, name: currentFile.name });
      try {
        activeController = new AbortController();
        var timeoutId = setTimeout(function () {
          activeController.abort();
        }, 60000);
        requestCounter++;
        var requestId = sessionId + "_" + requestCounter;
        var _cName2 = userName || detectUserName();
        var body = JSON.stringify({
          message: msgText,
          sessionId: sessionId,
          visitorId: visitorIdGlobal,
          apiKey: API_KEY,
          pageUrl: pageUrl,
          pageType: pageType,
          customerName: _cName2,
          customerEmail: userEmail,
          requestId: requestId,
          stream: true,
          attachments: [
            { name: currentFile.name, type: currentFile.type, data: currentFileData },
          ],
        });
        if (!widgetToken) { try { await requestWidgetToken(); } catch (e) {} }
        var res = await fetch(CHATBOT_BASE + "/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream, application/json",
            ...widgetAuthHeaders(),
          },
          body: body,
          signal: activeController.signal,
        });
        clearTimeout(timeoutId);
        if (res.status === 401) {
          hideTyping();
          addErrorMessage("Chat unavailable right now. Please try again shortly.");
        } else if (!res.ok) {
          hideTyping();
          addErrorMessage("Sorry, something went wrong. Please try again.");
        } else {
          var ctype = (res.headers.get("content-type") || "").toLowerCase();
          if (ctype.indexOf("text/event-stream") !== -1) {
            var streamUi = null;
            var finished = false;
            await consumeSse(res, function (evt) {
              if (!evt || !evt.type) return;
              if (evt.type === "start" || evt.type === "token") {
                if (evt.type === "start" && evt.conversationState) renderConversationState(evt.conversationState);
                if (!streamUi) streamUi = beginBotStream();
                if (evt.type === "token") streamUi.append(evt.text || "");
              } else if (evt.type === "replace") {
                if (!streamUi) streamUi = beginBotStream();
                streamUi.set(evt.text || "");
              } else if (evt.type === "done") {
                finished = true;
                if (evt.duplicate) {
                  if (streamUi) streamUi.remove();
                  return;
                }
                if (!streamUi) {
                  if (evt.reply) addMessage("bot", evt.reply || "Thanks for sharing!");
                } else {
                  streamUi.finalize(evt.reply != null ? evt.reply : streamUi.getText());
                }
                handleBotPayload(evt);
              } else if (evt.type === "error") {
                finished = true;
                if (streamUi) streamUi.remove();
                hideTyping();
                addErrorMessage(evt.reply || "Sorry, something went wrong.");
              }
            });
            if (!finished && streamUi) streamUi.finalize(streamUi.getText());
            else if (!finished) {
              hideTyping();
              addMessage("bot", "Thanks for sharing!");
            }
          } else {
            hideTyping();
            var data = await res.json();
            if (!data.duplicate) {
              addMessage("bot", data.reply || "Thanks for sharing!");
              handleBotPayload(data);
            }
          }
        }
      } catch (err) {
        hideTyping();
        if (err.name === "AbortError") {
          addMessage("system", "Request cancelled.", true);
        } else {
          addMessage("bot", "Connection error. Please try again.");
          track("error", { where: "file_send", message: String(err.message || err) });
        }
      }
      clearFile();
      input.value = "";
      autoGrow();
      hideSuggestions();
      setSending(false);
    }

    async function sendMessageToBot(text, retries) {
      errorState = false;
      if (retries === undefined) retries = 0;
      if (isSending && retries === 0) return;
      hideSuggestions();
      userInteractedWithChat = true;
      showTyping();
      setSending(true);
      lastSentText = text;
      track("message_sent", { len: text.length, stream: true });
      var streamUi = null;
      try {
        activeController = new AbortController();
        var timeoutId = setTimeout(function () {
          activeController.abort();
        }, 90000);
        requestCounter++;
        var requestId = sessionId + "_" + requestCounter + (retries ? "_r" + retries : "");
        var _cName = userName || detectUserName();
        if (_cName) {
          try {
            localStorage.setItem("cc_user_name", _cName);
          } catch (e) {}
        }
        var body = JSON.stringify({
          message: text,
          sessionId: sessionId,
          visitorId: visitorIdGlobal,
          apiKey: API_KEY,
          pageUrl: pageUrl,
          pageType: pageType,
          customerName: _cName,
          customerEmail: userEmail,
          requestId: requestId,
          stream: true,
        });
        if (!widgetToken) { try { await requestWidgetToken(); } catch (e) {} }
        var res = await fetch(CHATBOT_BASE + "/api/chat", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Accept: "text/event-stream, application/json",
            ...widgetAuthHeaders(),
          },
          body: body,
          signal: activeController.signal,
        });
        clearTimeout(timeoutId);

        if (res.status === 401) {
          hideTyping();
          addMessage("bot", "Chat unavailable: API key is invalid. Please contact support.");
          setSending(false);
          return;
        }
        if (res.status === 403) {
          hideTyping();
          addMessage("bot", "Chat unavailable: workspace is inactive or session expired.");
          setSending(false);
          return;
        }
        if (res.status === 429) {
          hideTyping();
          if (retries < 2) {
            addMessage("system", "Busy, retrying...", true);
            setTimeout(function () {
              removeLastMessage();
              sendMessageToBot(text, retries + 1);
            }, 2000);
            return;
          }
          addMessage("bot", "Chat is busy right now. Please try again shortly.");
          setSending(false);
          return;
        }
        if (res.status >= 500) {
          hideTyping();
          if (retries < 2) {
            addMessage("system", "Retrying...", true);
            setTimeout(function () {
              removeLastMessage();
              sendMessageToBot(text, retries + 1);
            }, 2000);
            return;
          }
          addMessage("bot", "Chat service temporarily unavailable. Please try again later.");
          setSending(false);
          return;
        }
        if (!res.ok) {
          hideTyping();
          addMessage("bot", "Chat temporarily unavailable. Please try again in a moment.");
          setSending(false);
          return;
        }

        var ctype = (res.headers.get("content-type") || "").toLowerCase();
        var isSse = ctype.indexOf("text/event-stream") !== -1;
        var finished = false;
        var gotTokens = false;

        if (isSse) {
          await consumeSse(res, function (evt) {
            if (!evt || !evt.type) return;
            if (evt.type === "start") {
              streamUi = beginBotStream();
              if (evt.conversationState) renderConversationState(evt.conversationState);
            } else if (evt.type === "token") {
              if (!streamUi) streamUi = beginBotStream();
              gotTokens = true;
              streamUi.append(evt.text || "");
            } else if (evt.type === "replace") {
              if (!streamUi) streamUi = beginBotStream();
              streamUi.set(evt.text || "");
            } else if (evt.type === "done") {
              finished = true;
              if (evt.duplicate) {
                if (streamUi) streamUi.remove();
                return;
              }
              if (!streamUi) {
                if (evt.reply) addMessage("bot", evt.reply);
              } else {
                streamUi.finalize(evt.reply != null ? evt.reply : streamUi.getText());
              }
              handleBotPayload(evt);
            } else if (evt.type === "error") {
              finished = true;
              if (streamUi && gotTokens) {
                streamUi.finalize(
                  evt.reply || streamUi.getText() || "Sorry, something went wrong.",
                );
              } else {
                if (streamUi) streamUi.remove();
                hideTyping();
                addErrorMessage(evt.reply || evt.message || "Sorry, something went wrong. Please try again.");
              }
            }
          });
          if (!finished) {
            if (streamUi && gotTokens) streamUi.finalize(streamUi.getText());
            else {
              hideTyping();
              if (streamUi) streamUi.remove();
              addMessage("bot", "Sorry, I couldn't process your message. Please try again.");
            }
          }
        } else {
          hideTyping();
          var data = await res.json();
          if (data.duplicate) {
            setSending(false);
            return;
          }
          if (data.reply) {
            addMessage("bot", data.reply);
            handleBotPayload(data);
          } else if (data.error) {
            addErrorMessage(data.error);
          } else {
            addErrorMessage("Sorry, I couldn't process your message. Please try again.");
          }
        }
      } catch (err) {
        hideTyping();
        if (streamUi && streamUi.getText()) {
          streamUi.finalize(streamUi.getText());
        } else if (streamUi) {
          streamUi.remove();
        }
        if (err.name === "AbortError") {
          if (retries === 0 && !isSending) {
            /* cancelled by user */
          } else if (retries < 2) {
            addMessage("system", "Request timed out, retrying...", true);
            setTimeout(function () {
              removeLastMessage();
              sendMessageToBot(text, retries + 1);
            }, 2000);
            return;
          } else {
            addErrorMessage("Request timed out. Please try again.");
          }
        } else {
          addErrorMessage("Connection lost. Please try again.");
          track("error", { where: "send", message: String(err.message || err) });
        }
      }
      setSending(false);
    }

    function removeLastMessage() {
      if (messagesEl.lastChild) messagesEl.removeChild(messagesEl.lastChild);
      if (messages.length > 0) messages.pop();
    }

    function addToCircucityCart(item) {
      try {
        var cart = [];
        try {
          cart = JSON.parse(localStorage.getItem("cart") || "[]");
        } catch (e) {
          cart = [];
        }
        if (!Array.isArray(cart)) cart = [];
        var existing = -1;
        for (var ci = 0; ci < cart.length; ci++) {
          if (cart[ci].id === item.productId) {
            existing = ci;
            break;
          }
        }
        var entry = {
          id: item.productId,
          name: item.name,
          price: item.price,
          quantity: 1,
          image: item.image || undefined,
          weight: item.weight || 0.5,
        };
        if (existing >= 0) cart[existing].quantity += 1;
        else cart.push(entry);
        localStorage.setItem("cart", JSON.stringify(cart));
        window.dispatchEvent(new CustomEvent("circucity:cart-add", { detail: entry }));
        showToast("Added to cart: " + item.name, "success");
        track("cart_add", { productId: item.productId, name: item.name });
        try {
          var xhr = new XMLHttpRequest();
          xhr.open("POST", CHATBOT_BASE + "/api/cart");
          xhr.setRequestHeader("Content-Type", "application/json");
          xhr.onerror = function () {};
          xhr.send(
            JSON.stringify({
              api_key: API_KEY,
              workspace_id: WS_ID || undefined,
              session_id: sessionId,
              product_id: item.productId,
              name: item.name,
              price: item.price,
              quantity: 1,
              image: item.image || undefined,
              weight: item.weight || 0.5,
            }),
          );
        } catch (e) {}
      } catch (e) {
        console.error("Cira cart error", e);
      }
    }

    function handleChatActions(actions) {
      for (var ai = 0; ai < actions.length; ai++) {
        var act = actions[ai];
        if (act.type === "add_to_cart") addToCircucityCart(act);
        if (act.type === "shipping_comparison") {
          addMessage(
            "system",
            "PostNord: " +
              act.postnord +
              " " +
              act.currency +
              " | Shipmondo: " +
              act.shipmondo +
              " " +
              act.currency,
            true,
          );
        }
        if (act.type === "open_checkout") {
          setTimeout(function () {
            window.location.href = act.url;
          }, 800);
        }
        if (act.type === "stock_alert_subscribed") {
          addMessage("system", t("restock") + act.email, true);
        }
      }
    }

    function renderProductCards(products) {
      var row = document.createElement("div");
      row.className = "cc-msg-row bot cc-product-row";
      var avatar = document.createElement("div");
      avatar.className = "cc-msg-avatar";
      avatar.innerHTML = BOT_AVATAR_SVG;
      row.appendChild(avatar);

      var container = document.createElement("div");
      container.className = "cc-product-list";
      for (var pi = 0; pi < products.length; pi++) {
        (function (p) {
          var item = document.createElement("div");
          item.className = "cc-pl-item";

          var imgDiv = document.createElement("div");
          imgDiv.className = "cc-pl-img";
          if (p.image) {
            var img = document.createElement("img");
            img.src = p.image;
            img.alt = p.name || "";
            img.onerror = function () {
              this.parentNode.innerHTML = "";
              this.parentNode.className = "cc-pl-img cc-pl-img--icon";
            };
            imgDiv.appendChild(img);
          } else {
            imgDiv.className = "cc-pl-img cc-pl-img--icon";
          }
          item.appendChild(imgDiv);

          var info = document.createElement("div");
          info.className = "cc-pl-info";

          var nameEl = document.createElement("a");
          nameEl.className = "cc-pl-name";
          nameEl.href = safeUrl(p.url) || "#";
          nameEl.target = "_self";
          nameEl.rel = "noopener";
          nameEl.textContent = p.name || "Product";
          nameEl.addEventListener("click", function () {
            track("product_click", { name: p.name, url: p.url });
          });
          info.appendChild(nameEl);

          if (p.price) {
            var priceEl = document.createElement("div");
            priceEl.className = "cc-pl-price";
            priceEl.textContent = p.price;
            info.appendChild(priceEl);
          }

          item.appendChild(info);

          var actions = document.createElement("div");
          actions.className = "cc-pl-actions";
          if (p.url && safeUrl(p.url)) {
            var viewBtn = document.createElement("a");
            viewBtn.className = "cc-pl-view";
            viewBtn.href = p.url;
            viewBtn.target = "_self";
            viewBtn.rel = "noopener";
            viewBtn.textContent = "View";
            actions.appendChild(viewBtn);

            var cartBtn = document.createElement("button");
            cartBtn.className = "cc-pl-cart";
            cartBtn.type = "button";
            cartBtn.title = "Add to cart";
            cartBtn.addEventListener("click", function (ev) {
              ev.preventDefault();
              var pid = (p.url || "").split("/products/")[1];
              if (pid) pid = pid.split("?")[0].split("#")[0];
              if (pid) {
                addToCircucityCart({
                  productId: pid,
                  name: p.name,
                  price: parseFloat(String(p.price).replace(/[^\d.]/g, "")) || 0,
                  image: p.image,
                  weight: 0.5,
                });
              } else if (p.url) {
                window.location.href = p.url;
              }
            });
            cartBtn.innerHTML =
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><circle cx="9" cy="21" r="1"/><circle cx="20" cy="21" r="1"/><path d="M1 1h4l2.68 13.39a2 2 0 0 0 2 1.61h9.72a2 2 0 0 0 2-1.61L23 6H6"/></svg>';
            actions.appendChild(cartBtn);
          }
          if (actions.childNodes.length) item.appendChild(actions);
          container.appendChild(item);
        })(products[pi]);
      }
      row.appendChild(container);
      messagesEl.appendChild(row);
      scrollToBottom();
    }

    var preferredVoice = null;
    var currentUtterance = null;

    function pickBestVoice() {
      var voices = window.speechSynthesis.getVoices();
      if (voices.length === 0) return null;
      var priority = [
        "Google UK English Female",
        "Google US English",
        "Microsoft Jenny Natural",
        "Samantha",
      ];
      for (var p = 0; p < priority.length; p++) {
        for (var v = 0; v < voices.length; v++) {
          if (voices[v].name.indexOf(priority[p]) !== -1) return voices[v];
        }
      }
      for (var v2 = 0; v2 < voices.length; v2++) {
        if (voices[v2].lang && voices[v2].lang.indexOf("en") === 0) return voices[v2];
      }
      return voices[0];
    }

    function speakText(text, btn) {
      try {
        if (window.speechSynthesis && window.speechSynthesis.speaking && currentUtterance) {
          window.speechSynthesis.cancel();
          currentUtterance = null;
          return;
        }
        if (btn && (btn.classList.contains("playing") || btn.classList.contains("loading"))) {
          btn.classList.remove("playing");
          btn.classList.remove("loading");
          if (window.speechSynthesis) window.speechSynthesis.cancel();
          if (currentAudio) {
            currentAudio.pause();
            currentAudio.currentTime = 0;
            currentAudio = null;
          }
          ttsRequestToken++;
          return;
        }
        var myToken = ++ttsRequestToken;
        if (btn) btn.classList.add("loading");
        var cleanText = text.replace(/\*\*(.+?)\*\*/g, "$1");
        var shortText =
          cleanText.length > 300 ? cleanText.substring(0, 300) + "..." : cleanText;
        var usingServerAudio = false;
        var audioEl = null;
        try {
          fetch(CHATBOT_BASE + "/api/tts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              api_key: API_KEY,
              workspace_id: WS_ID || undefined,
              text: shortText,
            }),
          })
            .then(function (res) {
              if (!res.ok) throw new Error("tts http " + res.status);
              return res.blob();
            })
            .then(function (blob) {
              if (currentUtterance || myToken !== ttsRequestToken) return;
              var url = URL.createObjectURL(blob);
              audioEl = new Audio(url);
              currentAudio = audioEl;
              if (btn) {
                btn.classList.remove("loading");
                btn.classList.add("playing");
              }
              if (window.speechSynthesis) window.speechSynthesis.cancel();
              audioEl.onended = function () {
                if (btn) btn.classList.remove("playing");
                currentAudio = null;
              };
              audioEl.onerror = function () {
                if (btn) btn.classList.remove("playing");
                currentAudio = null;
              };
              audioEl.play().catch(function () {
                if (btn) btn.classList.remove("playing");
                currentAudio = null;
                if (window.speechSynthesis && window.speechSynthesis.getVoices().length > 0) {
                  speakBrowser(cleanText, btn);
                }
              });
            })
            .catch(function () {
              if (myToken !== ttsRequestToken) return;
              if (window.speechSynthesis && window.speechSynthesis.getVoices().length > 0) {
                speakBrowser(cleanText, btn);
              } else if (btn) {
                btn.classList.remove("loading");
              }
            });
        } catch (e) {
          if (window.speechSynthesis && window.speechSynthesis.getVoices().length > 0) {
            speakBrowser(cleanText, btn);
          } else if (btn) {
            btn.classList.remove("loading");
          }
        }
        function speakBrowser(fullText, btn) {
          if (!window.speechSynthesis) {
            if (btn) btn.classList.remove("loading");
            return;
          }
          window.speechSynthesis.cancel();
          if (!preferredVoice) preferredVoice = pickBestVoice();
          var utterance = new SpeechSynthesisUtterance(fullText);
          utterance.rate = 0.95;
          utterance.pitch = 1.05;
          if (preferredVoice) utterance.voice = preferredVoice;
          currentUtterance = utterance;
          utterance.onstart = function () {
            if (btn) {
              btn.classList.remove("loading");
              btn.classList.add("playing");
            }
          };
          utterance.onend = function () {
            currentUtterance = null;
            if (btn) {
              btn.classList.remove("playing");
              btn.classList.remove("loading");
            }
          };
          utterance.onerror = function () {
            currentUtterance = null;
            if (btn) {
              btn.classList.remove("playing");
              btn.classList.remove("loading");
            }
          };
          window.speechSynthesis.speak(utterance);
        }
      } catch (e) {}
    }

    var currentAudio = null;
    var ttsRequestToken = 0;

    var recognition = null;
    var isListening = false;
    var voiceResultProcessed = false;

    function startVoiceInput() {
      if (isListening) return;
      unlockAudio();
      var SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
      if (!SpeechRecognition) {
        addMessage("bot", "Voice input is not supported in your browser.");
        return;
      }
      voiceResultProcessed = false;
      if (!recognition) {
        recognition = new SpeechRecognition();
        recognition.lang = "en-US";
        recognition.continuous = false;
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;
        recognition.onresult = function (event) {
          if (voiceResultProcessed) return;
          var lastResult = event.results[event.results.length - 1];
          if (!lastResult.isFinal) return;
          voiceResultProcessed = true;
          var transcript = lastResult[0].transcript.trim();
          if (transcript) {
            addMessage("user", transcript);
            sendMessageToBot(transcript);
          }
          isListening = false;
          var mb = document.getElementById("cc-ai-mic");
          if (mb) {
            mb.style.color = "#6b7280";
            mb.style.background = "none";
          }
        };
        recognition.onerror = function () {
          isListening = false;
          voiceResultProcessed = true;
          var mb = document.getElementById("cc-ai-mic");
          if (mb) {
            mb.style.color = "#6b7280";
            mb.style.background = "none";
          }
        };
        recognition.onend = function () {
          isListening = false;
          var mb = document.getElementById("cc-ai-mic");
          if (mb) {
            mb.style.color = "#6b7280";
            mb.style.background = "none";
          }
        };
      }
      try {
        isListening = true;
        var mb2 = document.getElementById("cc-ai-mic");
        if (mb2) {
          mb2.style.color = "#ef4444";
          mb2.style.background = "rgba(239,68,68,0.1)";
        }
        recognition.start();
      } catch (e) {
        isListening = false;
      }
    }

    function doSend() {
      unlockAudio();
      var text = input.value.trim();
      if (isSending) {
        if (activeController) activeController.abort();
        setSending(false);
        hideTyping();
        return;
      }
      if (currentFile && currentFileData) {
        handleFileSend(text);
        return;
      }
      if (!text) return;
      addMessage("user", text);
      sendMessageToBot(text);
      input.value = "";
      autoGrow();
      hideSuggestions();
    }

    sendBtn.addEventListener("click", doSend);
    input.addEventListener("keydown", function (e) {
      if (e.key === "Enter" && !e.shiftKey) {
        e.preventDefault();
        doSend();
      }
    });

    if (VOICE_ENABLED && window.speechSynthesis) {
      if (window.speechSynthesis.getVoices().length > 0) preferredVoice = pickBestVoice();
      window.speechSynthesis.onvoiceschanged = function () {
        preferredVoice = pickBestVoice();
      };
    }

    document.addEventListener("mouseleave", handleExitIntent);
    window.addEventListener("scroll", handleScrollDepth, { passive: true });
    document.addEventListener(
      "pointerdown",
      function () {
        unlockAudio();
      },
      { once: true, passive: true },
    );

    var _activityEvents = ["mousedown", "mousemove", "scroll", "keydown", "touchstart", "click"];
    function _onUserActivity() {
      if (userActivityTimer) clearTimeout(userActivityTimer);
      userActivityTimer = setTimeout(function () {
        resetInactivityTimer();
      }, 1000);
      resetInactivityTimer();
    }
    for (var _ei = 0; _ei < _activityEvents.length; _ei++) {
      document.addEventListener(_activityEvents[_ei], _onUserActivity, { passive: true });
    }

    document.addEventListener("keydown", function (ev) {
      if (ev.key === "Escape" && isOpen) {
        ev.preventDefault();
        toggle();
        return;
      }
      if (ev.key === "Tab" && isOpen) {
        var focusables = windowEl.querySelectorAll(
          'button, [href], input, textarea, select, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        var first = focusables[0];
        var last = focusables[focusables.length - 1];
        if (ev.shiftKey && document.activeElement === first) {
          ev.preventDefault();
          last.focus();
        } else if (!ev.shiftKey && document.activeElement === last) {
          ev.preventDefault();
          first.focus();
        }
      }
    });

    window.__ccAiShowChat = function () {
      if (!isOpen) toggle();
      else {
        windowEl.classList.add("open");
        widget.classList.add("chat-open");
        isOpen = true;
      }
    };
    window.__ccAiToggle = function () {
      toggle();
    };
    window.__ccAiClose = function () {
      if (isOpen) toggle();
    };

    resetInactivityTimer();
    loadHistory();
    requestWidgetToken();
    setInterval(function () {
      if (widgetToken) requestWidgetToken();
    }, 10 * 60 * 1000);

    if (AUTO_OPEN && window.innerWidth > 768) {
      try {
        if (!sessionStorage.getItem(AUTO_OPEN_KEY)) {
          setTimeout(function () {
            if (!userInteractedWithChat && !isOpen) {
              sessionStorage.setItem(AUTO_OPEN_KEY, "1");
              toggle();
            }
          }, Math.max(1, AUTO_OPEN_DELAY) * 1000);
        }
      } catch (e) {}
    }

    track("widget_loaded", { pageType: pageType });
  }

  var _ccQueue = [];
  window.__ccAiToggle = function () {
    _ccQueue.push("toggle");
  };
  window.__ccAiClose = function () {
    _ccQueue.push("close");
  };

  function _ccReady(fn) {
    if (document.body) {
      fn();
    } else {
      document.addEventListener("DOMContentLoaded", fn);
    }
  }
  _ccReady(init);
})();

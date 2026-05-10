// ╔══════════════════════════════════════════════════════════╗
// ║  src/menu.js — Edit this file to customise your menu    ║
// ║  No need to touch commands.js for menu changes.         ║
// ╚══════════════════════════════════════════════════════════╝

// ── Fallback background image ─────────────────────────────────────────────────
export const MENU_BG = "https://c.termai.cc/i183/r021.jpg";

// ── Categories ────────────────────────────────────────────────────────────────
// To add a command  : add its name to the commands array
// To add a category : add a new entry following the same format
// To hide a category: comment it out with //
export const CATEGORIES = {
  ai: {
    icon: "🤖",
    title: "AI MENU",
    commands: [
      "chatgpt", "gemini", "claude",
      "imagine", "dalle", "aiart",
      "detect", "caption", "remini",
      "enhance", "summarize", "translate",
    ],
  },
  downloader: {
    icon: "📥",
    title: "DOWNLOADER MENU",
    commands: [
      "ytmp3", "ytmp4", "igdl",
      "tiktok", "fbdl", "twdl",
      "spotdl", "pinterest", "gdrive",
      "apk", "mediafire", "capcut",
    ],
  },
  fun: {
    icon: "🎉",
    title: "FUN MENU",
    commands: [
      "meme", "joke", "quote",
      "fact", "roast", "ship",
      "truth", "dare", "8ball",
      "horoscope", "rizz", "pickup",
    ],
  },
  game: {
    icon: "🎮",
    title: "GAME MENU",
    commands: [
      "ttt", "chess", "wordle",
      "trivia", "math", "guess",
      "coinflip", "dice", "hangman",
      "rps", "akinator", "blackjack",
    ],
  },
  general: {
    icon: "📋",
    title: "GENERAL MENU",
    commands: [
      "menu", "ping", "alive",
      "uptime", "owner", "speed",
      "vpsinfo", "help", "totalcmds",
      "runtime", "donate", "about",
    ],
  },
  group: {
    icon: "👥",
    title: "GROUP MENU",
    commands: [
      "kick", "add", "promote",
      "demote", "mute", "unmute",
      "tagall", "link", "revoke",
      "setdesc", "setname", "groupinfo",
    ],
  },
  owner: {
    icon: "👑",
    title: "OWNER MENU",
    commands: [
      "setprefix", "setowner", "addowner",
      "delowner", "setbotname", "public",
      "self", "gconly", "antidelete",
      "autoblock", "broadcast", "restart",
      "clearsession", "block", "unblock",
    ],
  },
  profile: {
    icon: "👤",
    title: "PROFILE MENU",
    commands: [
      "pp", "setpp", "bio",
      "setbio", "reg", "rank",
      "xp", "leaderboard", "badge",
      "vcard", "gift", "redeem",
    ],
  },
  search: {
    icon: "🔍",
    title: "SEARCH MENU",
    commands: [
      "google", "ytsearch", "wiki",
      "imgsearch", "weather", "news",
      "lyrics", "define", "urban",
      "anime", "manga", "github",
    ],
  },
  tools: {
    icon: "🛠️",
    title: "TOOLS MENU",
    commands: [
      "sticker", "toimg", "tts",
      "stt", "qr", "readqr",
      "short", "calc", "base64",
      "ss", "crop", "resize",
    ],
  },
  youtube: {
    icon: "▶️",
    title: "YOUTUBE MENU",
    commands: [
      "ytmp3", "ytmp4", "ytsearch",
      "ytinfo", "ytplaylist", "yttrend",
      "ytcomments", "ytlive", "ytsub",
      "ytlike",
    ],
  },
};

// ── Main menu caption (.menu) ─────────────────────────────────────────────────
// Edit this function to change how the main menu looks
export function buildMain(botName, prefix) {
  const cats = Object.entries(CATEGORIES)
    .map(([key, cat]) => `  ${cat.icon} *${key}* — ${cat.commands.length} cmds`)
    .join("\n");

  return (
    `⚡ *\`${botName}\`*\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    `✦ *Prefix:* ${prefix}  •  Type ${prefix}menu <category>\n\n` +
    `*【 MENU CATEGORIES 】*\n` +
    cats +
    `\n\n_Type ${prefix}ai · ${prefix}tools · ${prefix}fun etc._`
  );
}

// ── Sub-menu caption (.menu ai, .menu tools, etc.) ────────────────────────────
// Edit this function to change how sub-menus look
export function buildSub(botName, prefix, key) {
  const cat = CATEGORIES[key];
  if (!cat) return null;

  // Group commands into rows of 3
  const rows = [];
  for (let i = 0; i < cat.commands.length; i += 3) {
    rows.push(
      cat.commands.slice(i, i + 3).map(c => `▸ .${c}`).join("  ")
    );
  }

  return (
    `「 ${cat.title} 」\n` +
    `━━━━━━━━━━━━━━━━━━━\n` +
    rows.join("\n") +
    `\n\n_Back: ${prefix}menu_`
  );
}

import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SETTINGS_FILE = path.resolve(__dirname, "../data/settings.json");
const DATA_DIR = path.dirname(SETTINGS_FILE);

const DEFAULTS = {
  prefix: ".",
  botName: "Yuzuki",
  ownerNumber: "233533416608",
  mode: "public",
  antidelete: false,
  autoblock: false,
  gconly: false,
  menuBgUrl: "https://litter.catbox.moe/86d9vf.jpg",
  channelId: "120363406397452589@newsletter",
  channelName: "Kira-Aizen Information",
  owners: [],
  resellers: [],
  keys: [],
  cases: [],
};

function ensureDataDir() {
  if (!fs.existsSync(DATA_DIR)) fs.mkdirSync(DATA_DIR, { recursive: true });
}

export function loadSettings() {
  ensureDataDir();
  if (!fs.existsSync(SETTINGS_FILE)) {
    fs.writeFileSync(SETTINGS_FILE, JSON.stringify(DEFAULTS, null, 2));
    return { ...DEFAULTS };
  }
  try {
    const raw = fs.readFileSync(SETTINGS_FILE, "utf8");
    return { ...DEFAULTS, ...JSON.parse(raw) };
  } catch {
    return { ...DEFAULTS };
  }
}

export function saveSettings(data) {
  ensureDataDir();
  fs.writeFileSync(SETTINGS_FILE, JSON.stringify(data, null, 2));
}

export function getSetting(key) {
  return loadSettings()[key];
}

export function setSetting(key, value) {
  const s = loadSettings();
  s[key] = value;
  saveSettings(s);
}

export function getOwners() {
  return loadSettings().owners ?? [];
}

export function addOwner(number, name = null) {
  const s = loadSettings();
  if (!s.owners) s.owners = [];
  if (s.owners.find((o) => o.number === number)) return false;
  s.owners.push({ number, name, createdAt: new Date().toISOString() });
  saveSettings(s);
  return true;
}

export function removeOwner(number) {
  const s = loadSettings();
  const before = (s.owners ?? []).length;
  s.owners = (s.owners ?? []).filter((o) => o.number !== number);
  saveSettings(s);
  return s.owners.length < before;
}

export function isOwner(senderJid, settings) {
  const clean = (jid) => jid?.split("@")[0] ?? "";
  const sender = clean(senderJid);
  if (settings.ownerNumber && sender === settings.ownerNumber) return true;
  return (settings.owners ?? []).some((o) => o.number === sender);
}

export function getKeys() {
  return loadSettings().keys ?? [];
}

export function addKey(key, description = null) {
  const s = loadSettings();
  if (!s.keys) s.keys = [];
  if (s.keys.find((k) => k.key === key)) return false;
  s.keys.push({ key, description, active: true, createdAt: new Date().toISOString() });
  saveSettings(s);
  return true;
}

export function removeKey(key) {
  const s = loadSettings();
  const before = (s.keys ?? []).length;
  s.keys = (s.keys ?? []).filter((k) => k.key !== key);
  saveSettings(s);
  return s.keys.length < before;
}

export function getResellers() {
  return loadSettings().resellers ?? [];
}

export function addReseller(number, name = null, quota = 10) {
  const s = loadSettings();
  if (!s.resellers) s.resellers = [];
  if (s.resellers.find((r) => r.number === number)) return false;
  s.resellers.push({ number, name, quota, usedQuota: 0, active: true, createdAt: new Date().toISOString() });
  saveSettings(s);
  return true;
}

export function removeReseller(number) {
  const s = loadSettings();
  const before = (s.resellers ?? []).length;
  s.resellers = (s.resellers ?? []).filter((r) => r.number !== number);
  saveSettings(s);
  return s.resellers.length < before;
}

export function getCases() {
  return loadSettings().cases ?? [];
}

export function addCase(command, response, description = null) {
  const s = loadSettings();
  if (!s.cases) s.cases = [];
  if (s.cases.find((c) => c.command === command)) return false;
  s.cases.push({ command, response, description, active: true, createdAt: new Date().toISOString() });
  saveSettings(s);
  return true;
}

export function removeCase(command) {
  const s = loadSettings();
  const before = (s.cases ?? []).length;
  s.cases = (s.cases ?? []).filter((c) => c.command !== command);
  saveSettings(s);
  return s.cases.length < before;
}

export function editCase(command, response) {
  const s = loadSettings();
  const c = (s.cases ?? []).find((c) => c.command === command);
  if (!c) return false;
  c.response = response;
  saveSettings(s);
  return true;
}

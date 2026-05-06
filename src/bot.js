import makeWASocket, {
  DisconnectReason,
  useMultiFileAuthState,
  fetchLatestBaileysVersion,
} from "@whiskeysockets/baileys";
import { Boom } from "@hapi/boom";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
import pino from "pino";
import { loadSettings } from "./settings.js";
import { handleCommand } from "./commands.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const SESSION_DIR = path.resolve(__dirname, "../bot_session");

export const logger = pino({ level: process.env.LOG_LEVEL ?? "info" });

const silentLogger = pino({ level: "silent" });

export const state = {
  connected: false,
  phoneNumber: null,
  botName: null,
  startedAt: null,
  pairingCode: null,
  socket: null,
};

let reconnectTimer = null;

/** Extract plain text from any message type Baileys sends */
function extractText(msg) {
  const m = msg.message;
  if (!m) return "";
  if (typeof m.conversation === "string") return m.conversation;
  if (m.extendedTextMessage?.text) return m.extendedTextMessage.text;
  if (m.ephemeralMessage?.message) return extractText({ message: m.ephemeralMessage.message });
  if (m.viewOnceMessage?.message) return extractText({ message: m.viewOnceMessage.message });
  if (m.buttonsResponseMessage?.selectedButtonId) return m.buttonsResponseMessage.selectedButtonId;
  if (m.listResponseMessage?.singleSelectReply?.selectedRowId) return m.listResponseMessage.singleSelectReply.selectedRowId;
  return "";
}

export function getBotState() {
  const { socket: _s, ...rest } = state;
  return rest;
}

export async function startBot() {
  if (!fs.existsSync(SESSION_DIR)) {
    fs.mkdirSync(SESSION_DIR, { recursive: true });
  }

  const { state: authState, saveCreds } = await useMultiFileAuthState(SESSION_DIR);
  const { version } = await fetchLatestBaileysVersion();

  const sock = makeWASocket({
    version,
    auth: authState,
    printQRInTerminal: false,
    logger: silentLogger,
    syncFullHistory: false,
    markOnlineOnConnect: true,
  });

  state.socket = sock;

  // Request pairing code if not yet registered
  if (!sock.authState.creds.registered) {
    const settings = loadSettings();
    const phoneNumber = (process.env.PHONE_NUMBER ?? settings.ownerNumber ?? "").replace(/[^0-9]/g, "");

    if (phoneNumber) {
      try {
        // Small delay for the WA handshake to complete
        await new Promise((r) => setTimeout(r, 2000));
        const code = await sock.requestPairingCode(phoneNumber);
        state.pairingCode = code;
        const line = "=".repeat(44);
        console.log(`\n${line}`);
        console.log(`  PAIRING CODE: ${code}`);
        console.log(`  WhatsApp → Settings → Linked Devices`);
        console.log(`  → Link with phone number → enter code`);
        console.log(`${line}\n`);
      } catch (err) {
        logger.error({ err }, "Failed to request pairing code — retrying in 5s");
        setTimeout(() => startBot().catch(console.error), 5000);
        return;
      }
    } else {
      console.log("\n[!] Set PHONE_NUMBER env var (digits only, e.g. 628123456789) to get a pairing code.\n");
    }
  }

  sock.ev.on("connection.update", async (update) => {
    const { connection, lastDisconnect } = update;

    if (connection === "close") {
      state.connected = false;
      state.phoneNumber = null;
      state.startedAt = null;
      state.pairingCode = null;
      state.socket = null;

      const statusCode = lastDisconnect?.error?.output?.statusCode;
      const shouldReconnect = statusCode !== DisconnectReason.loggedOut;

      logger.info({ statusCode, shouldReconnect }, "Connection closed");

      if (shouldReconnect) {
        if (reconnectTimer) clearTimeout(reconnectTimer);
        reconnectTimer = setTimeout(() => {
          startBot().catch((err) => logger.error({ err }, "Failed to restart bot"));
        }, 5000);
      }
    }

    if (connection === "open") {
      state.connected = true;
      state.pairingCode = null;
      state.startedAt = new Date();
      const jid = sock.user?.id ?? null;
      state.phoneNumber = jid ? jid.split(":")[0] ?? null : null;
      state.botName = sock.user?.name ?? null;
      logger.info({ phone: state.phoneNumber, name: state.botName }, "Bot connected!");
    }
  });

  sock.ev.on("creds.update", saveCreds);

  sock.ev.on("messages.upsert", async ({ messages, type }) => {
    if (type !== "notify") return;

    for (const msg of messages) {
      if (msg.key.fromMe) continue;
      if (!msg.message) continue;

      const text = extractText(msg);
      if (!text) continue;

      try {
        const settings = loadSettings();
        const prefix = settings.prefix ?? ".";
        const mode = settings.mode ?? "public";

        if (!text.startsWith(prefix)) continue;

        const isGroup = msg.key.remoteJid?.endsWith("@g.us") ?? false;
        if (settings.gconly && !isGroup) continue;

        if (mode === "self") {
          const senderJid = msg.key.participant ?? msg.key.remoteJid ?? "";
          const ownerNum = settings.ownerNumber;
          if (!ownerNum || !senderJid.startsWith(ownerNum)) continue;
        }

        const body = text.slice(prefix.length).trim();
        const parts = body.split(/\s+/);
        const command = (parts[0] ?? "").toLowerCase();
        const args = parts.slice(1).filter(Boolean);

        if (!command) continue;

        await handleCommand({ sock, msg, command, args });
      } catch (err) {
        logger.error({ err }, "Error handling message");
      }
    }
  });
}

export async function stopBot() {
  if (reconnectTimer) {
    clearTimeout(reconnectTimer);
    reconnectTimer = null;
  }
  if (state.socket) {
    await state.socket.logout().catch(() => {});
    state.socket = null;
  }
  state.connected = false;
  state.phoneNumber = null;
  state.startedAt = null;
  state.pairingCode = null;
}

export async function clearSession() {
  await stopBot();
  if (fs.existsSync(SESSION_DIR)) {
    fs.rmSync(SESSION_DIR, { recursive: true, force: true });
  }
  await startBot();
}

import os from "os";
import { generateMenuImage } from "./menuImage.js";
import {
  loadSettings,
  setSetting,
  isOwner,
  getOwners,
  addOwner,
  removeOwner,
  getKeys,
  addKey,
  removeKey,
  getResellers,
  addReseller,
  removeReseller,
  getCases,
  addCase,
  removeCase,
  editCase,
} from "./settings.js";
import { clearSession, stopBot, startBot } from "./bot.js";

const startTime = Date.now();

const OWNER_COMMANDS = new Set([
  "setprefix","setowner","addowner","delowner","setbotname",
  "public","self","antidelete","gconly","autoblock",
  "clearchat","clearsession","restart","setmenuimg",
  "setchannelid","setchannelname",
  "addreseller","delreseller","resetreseller",
  "addkey","delkey",
  "addcase","delcase","editcase",
]);

export async function handleCommand({ sock, msg, command, args }) {
  const jid = msg.key.remoteJid;
  const settings = loadSettings();
  const prefix = settings.prefix ?? ".";
  const senderJid = msg.key.participant ?? msg.key.remoteJid ?? "";

  const reply = async (text) => {
    await sock.sendMessage(jid, { text }, { quoted: msg });
  };

  const channelQuote = (settings.channelId && settings.channelName)
    ? {
        key: { remoteJid: "status@broadcast", participant: "0@s.whatsapp.net" },
        message: {
          newsletterAdminInviteMessage: {
            newsletterJid: settings.channelId,
            newsletterName: settings.channelName,
            caption: "Created By Aizen",
            inviteExpiration: 0,
          },
        },
      }
    : null;

  const replyChannel = async (text) => {
    await sock.sendMessage(jid, { text }, { quoted: channelQuote ?? msg });
  };

  if (OWNER_COMMANDS.has(command)) {
    if (!isOwner(senderJid, settings)) {
      await reply("This command is restricted to bot owners.");
      return;
    }
  }

  switch (command) {

    case "menu": {
      const botName = settings.botName ?? "MyBot";
      const sections = [
        { title: "GENERAL-MENU",  commands: ["menu", "ping", "uptime", "alive", "owner", "speed", "vpsinfo", "totalcmds"] },
        { title: "OWNER-MENU",    commands: ["setprefix", "setowner", "addowner", "delowner", "setbotname", "public", "self", "antidelete", "gconly", "autoblock", "restart", "clearsession"] },
        { title: "RESELLER-MENU", commands: ["addreseller", "delreseller", "listreseller", "resetreseller"] },
        { title: "KEY & CASES",   commands: ["addkey", "delkey", "listkey", "addcase", "delcase", "getcase", "editcase"] },
      ];
      try {
        const img = await generateMenuImage(botName, prefix, sections, settings.menuBgUrl || undefined);
        await sock.sendMessage(jid, { image: img, caption: `⚡ *${botName}* — prefix: *${prefix}*` }, { quoted: channelQuote ?? msg });
      } catch (err) {
        // Fallback to plain text if image generation fails
        await reply(`⚡ *${botName}* — prefix: *${prefix}*\n\n${sections.map((s) => `*${s.title}*\n${s.commands.map((c) => `  ${prefix}${c}`).join("\n")}`).join("\n\n")}`);
      }
      break;
    }

    case "setmenuimg": {
      const url = args.join(" ").trim();
      if (!url) {
        await reply(`Usage: ${prefix}setmenuimg <image url>\nSend a direct image URL (jpg/png). Use ${prefix}setmenuimg clear to remove it.`);
        break;
      }
      if (url === "clear") {
        setSetting("menuBgUrl", "");
        await reply("Menu background image cleared.");
        break;
      }
      if (!/^https?:\/\/.+/i.test(url)) {
        await reply("Please provide a valid http/https URL.");
        break;
      }
      setSetting("menuBgUrl", url);
      await reply(`Menu background set! Send ${prefix}menu to preview it.`);
      break;
    }

    case "ping":
      await replyChannel("Pong!");
      break;

    case "alive":
      await replyChannel(`*${settings.botName ?? "Bot"} is alive!*\nStatus: Online\nPrefix: ${prefix}`);
      break;

    case "uptime": {
      const ms = Date.now() - startTime;
      const s = Math.floor(ms / 1000);
      const m = Math.floor(s / 60);
      const h = Math.floor(m / 60);
      const d = Math.floor(h / 24);
      await replyChannel(`Uptime: ${d}d ${h % 24}h ${m % 60}m ${s % 60}s`);
      break;
    }

    case "owner":
      await replyChannel(`Owner: ${settings.ownerNumber || "Not set"}\nBot: ${settings.botName || "Not set"}`);
      break;

    case "speed": {
      const start = Date.now();
      await replyChannel(`Latency: ${Date.now() - start}ms`);
      break;
    }

    case "vpsinfo": {
      const cpus = os.cpus();
      const mem = os.totalmem();
      const free = os.freemem();
      await replyChannel(
        `VPS Info\n` +
        `CPU: ${cpus[0]?.model ?? "N/A"} (${cpus.length} cores)\n` +
        `RAM: ${Math.round(mem/1024/1024)}MB total / ${Math.round(free/1024/1024)}MB free\n` +
        `OS: ${os.platform()} ${os.arch()}`
      );
      break;
    }

    case "totalcmds": {
      const cases = getCases();
      await replyChannel(`Total custom cases: ${cases.length}`);
      break;
    }

    case "setchannelid": {
      const cid = args.join(" ").trim();
      if (!cid) { await reply(`Usage: ${prefix}setchannelid <channel_jid>\nUse clear to remove.`); break; }
      if (cid === "clear") { setSetting("channelId", ""); await reply("Channel ID cleared."); break; }
      setSetting("channelId", cid);
      await reply(`Channel ID set to: ${cid}`);
      break;
    }

    case "setchannelname": {
      const cname = args.join(" ").trim();
      if (!cname) { await reply(`Usage: ${prefix}setchannelname <name>\nUse clear to remove.`); break; }
      if (cname === "clear") { setSetting("channelName", ""); await reply("Channel name cleared."); break; }
      setSetting("channelName", cname);
      await reply(`Channel name set to: ${cname}`);
      break;
    }

    case "setprefix": {
      const np = args[0];
      if (!np) { await reply(`Usage: ${prefix}setprefix <new_prefix>`); break; }
      setSetting("prefix", np);
      await reply(`Prefix updated to *${np}*`);
      break;
    }

    case "setowner": {
      const num = args[0]?.replace(/[^0-9]/g, "");
      if (!num) { await reply(`Usage: ${prefix}setowner <phone_number>`); break; }
      setSetting("ownerNumber", num);
      await reply(`Owner number set to *${num}*`);
      break;
    }

    case "addowner": {
      const num = args[0]?.replace(/[^0-9]/g, "");
      const name = args.slice(1).join(" ") || null;
      if (!num) { await reply(`Usage: ${prefix}addowner <number> [name]`); break; }
      const ok = addOwner(num, name);
      await reply(ok ? `Owner *${num}* added.` : `Owner *${num}* already exists.`);
      break;
    }

    case "delowner": {
      const num = args[0]?.replace(/[^0-9]/g, "");
      if (!num) { await reply(`Usage: ${prefix}delowner <number>`); break; }
      const ok = removeOwner(num);
      await reply(ok ? `Owner *${num}* removed.` : `Owner *${num}* not found.`);
      break;
    }

    case "listowners": {
      const owners = getOwners();
      if (!owners.length) { await reply("No owners registered."); break; }
      await reply(`Owners:\n${owners.map((o, i) => `${i + 1}. ${o.number}${o.name ? ` (${o.name})` : ""}`).join("\n")}`);
      break;
    }

    case "setbotname": {
      const name = args.join(" ");
      if (!name) { await reply(`Usage: ${prefix}setbotname <name>`); break; }
      setSetting("botName", name);
      await reply(`Bot name set to *${name}*`);
      break;
    }

    case "public":
      setSetting("mode", "public");
      await reply("Bot mode set to *public*");
      break;

    case "self":
      setSetting("mode", "self");
      await reply("Bot mode set to *self*");
      break;

    case "antidelete": {
      const cur = loadSettings().antidelete ?? false;
      setSetting("antidelete", !cur);
      await reply(`Anti-delete is now *${!cur ? "ON" : "OFF"}*`);
      break;
    }

    case "gconly": {
      const cur = loadSettings().gconly ?? false;
      setSetting("gconly", !cur);
      await reply(`Group-chat only is now *${!cur ? "ON" : "OFF"}*`);
      break;
    }

    case "autoblock": {
      const cur = loadSettings().autoblock ?? false;
      setSetting("autoblock", !cur);
      await reply(`Auto-block is now *${!cur ? "ON" : "OFF"}*`);
      break;
    }

    case "restart":
      await reply("Restarting bot...");
      await stopBot();
      setTimeout(() => startBot().catch(console.error), 1500);
      break;

    case "clearsession":
      await reply("Clearing session and reconnecting...");
      await clearSession();
      break;

    case "addreseller": {
      const num = args[0]?.replace(/[^0-9]/g, "");
      const name = args[1] || null;
      const quota = parseInt(args[2] ?? "10", 10);
      if (!num) { await reply(`Usage: ${prefix}addreseller <number> [name] [quota]`); break; }
      const ok = addReseller(num, name, quota);
      await reply(ok ? `Reseller *${num}* added (quota: ${quota}).` : `Reseller *${num}* already exists.`);
      break;
    }

    case "delreseller": {
      const num = args[0]?.replace(/[^0-9]/g, "");
      if (!num) { await reply(`Usage: ${prefix}delreseller <number>`); break; }
      const ok = removeReseller(num);
      await reply(ok ? `Reseller *${num}* removed.` : `Reseller *${num}* not found.`);
      break;
    }

    case "listreseller": {
      const list = getResellers();
      if (!list.length) { await reply("No resellers."); break; }
      await reply(`Resellers:\n${list.map((r, i) => `${i + 1}. ${r.number}${r.name ? ` (${r.name})` : ""} — quota: ${r.quota}`).join("\n")}`);
      break;
    }

    case "addkey": {
      const key = args[0];
      const desc = args.slice(1).join(" ") || null;
      if (!key) { await reply(`Usage: ${prefix}addkey <key> [description]`); break; }
      const ok = addKey(key, desc);
      await reply(ok ? `Key *${key}* added.` : `Key *${key}* already exists.`);
      break;
    }

    case "delkey": {
      const key = args[0];
      if (!key) { await reply(`Usage: ${prefix}delkey <key>`); break; }
      const ok = removeKey(key);
      await reply(ok ? `Key *${key}* removed.` : `Key *${key}* not found.`);
      break;
    }

    case "listkey": {
      const keys = getKeys();
      if (!keys.length) { await reply("No keys."); break; }
      await reply(`Keys:\n${keys.map((k, i) => `${i + 1}. ${k.key}${k.description ? ` — ${k.description}` : ""}`).join("\n")}`);
      break;
    }

    case "addcase": {
      const cmd = args[0]?.toLowerCase();
      const response = args.slice(1).join(" ");
      if (!cmd || !response) { await reply(`Usage: ${prefix}addcase <command> <response>`); break; }
      const ok = addCase(cmd, response);
      await reply(ok ? `Case *${cmd}* added.` : `Case *${cmd}* already exists.`);
      break;
    }

    case "delcase": {
      const cmd = args[0]?.toLowerCase();
      if (!cmd) { await reply(`Usage: ${prefix}delcase <command>`); break; }
      const ok = removeCase(cmd);
      await reply(ok ? `Case *${cmd}* removed.` : `Case *${cmd}* not found.`);
      break;
    }

    case "getcase": {
      const cmd = args[0]?.toLowerCase();
      if (!cmd) { await reply(`Usage: ${prefix}getcase <command>`); break; }
      const c = getCases().find((c) => c.command === cmd);
      await reply(c ? `Case: ${cmd}\nResponse: ${c.response}` : `Case *${cmd}* not found.`);
      break;
    }

    case "editcase": {
      const cmd = args[0]?.toLowerCase();
      const response = args.slice(1).join(" ");
      if (!cmd || !response) { await reply(`Usage: ${prefix}editcase <command> <new_response>`); break; }
      const ok = editCase(cmd, response);
      await reply(ok ? `Case *${cmd}* updated.` : `Case *${cmd}* not found.`);
      break;
    }

    default: {
      const cases = getCases().filter((c) => c.active);
      const match = cases.find((c) => c.command === command);
      if (match) {
        await reply(match.response);
      }
      break;
    }
  }
}

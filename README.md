# WhatsApp Baileys Bot — Pterodactyl Ready

A simplified, self-contained WhatsApp bot built with [Baileys](https://github.com/WhiskeySockets/Baileys). No database required — settings are stored in `data/settings.json`. Uses **pairing code** authentication (no QR scanning needed).

## Files

```
pterodactyl-bot/
├── src/
│   ├── index.js       # Entry point
│   ├── bot.js         # Baileys connection + pairing code
│   ├── commands.js    # All bot commands
│   └── settings.js    # JSON-based settings store
├── data/              # Auto-created — holds settings.json
├── bot_session/       # Auto-created — holds WhatsApp session
├── package.json
└── egg-whatsapp-bot.json  # Import this into Pterodactyl
```

## Deploy on Pterodactyl

1. **Import the egg** — Go to your Pterodactyl admin panel → Nests → Import Egg → upload `egg-whatsapp-bot.json`.
2. **Create a new server** using the *WhatsApp Baileys Bot* egg.
3. **Set `PHONE_NUMBER`** in the server variables — your WhatsApp number in full international format, digits only (e.g. `628123456789`).
4. **Upload all files** from this folder into the server's file manager (excluding `node_modules/`).
5. **Run the install script** from the panel (or manually run `npm install` in the console).
6. **Start the server** — a pairing code will appear in the console.
7. **Enter the code** in WhatsApp → Settings → Linked Devices → Link with phone number.
8. The bot is now online and will auto-reconnect if it drops.

## Local Setup

```bash
PHONE_NUMBER=628123456789 node src/index.js
```

## Environment Variables

| Variable       | Required | Description                                          |
|----------------|----------|------------------------------------------------------|
| `PHONE_NUMBER` | Yes      | Your WhatsApp number, digits only (e.g. 628123456789)|
| `LOG_LEVEL`    | No       | Logging verbosity: `info` (default), `debug`, `warn` |

## Commands

All commands use `.` as the default prefix (change with `.setprefix`).

### General (everyone)
| Command       | Description                  |
|---------------|------------------------------|
| `.menu`       | Show command list             |
| `.ping`       | Check if bot is alive         |
| `.alive`      | Bot status                    |
| `.uptime`     | How long the bot has been up  |
| `.owner`      | Show owner info               |
| `.speed`      | Latency test                  |
| `.vpsinfo`    | Server specs                  |
| `.totalcmds`  | Count of custom cases         |

### Owner Only
| Command                     | Description                       |
|-----------------------------|-----------------------------------|
| `.setprefix <p>`            | Change command prefix             |
| `.setowner <number>`        | Set owner phone number            |
| `.addowner <number> [name]` | Add an owner                      |
| `.delowner <number>`        | Remove an owner                   |
| `.listowners`               | List all owners                   |
| `.setbotname <name>`        | Change bot name                   |
| `.public`                   | Allow everyone to use commands    |
| `.self`                     | Only owner can use commands       |
| `.antidelete`               | Toggle anti-delete                |
| `.gconly`                   | Toggle group-only mode            |
| `.autoblock`                | Toggle auto-block                 |
| `.restart`                  | Restart the bot                   |
| `.clearsession`             | Wipe session and get new pairing code |

### Keys
| Command                        | Description        |
|--------------------------------|--------------------|
| `.addkey <key> [description]`  | Add a license key  |
| `.delkey <key>`                | Remove a key       |
| `.listkey`                     | List all keys      |

### Resellers
| Command                                   | Description          |
|-------------------------------------------|----------------------|
| `.addreseller <number> [name] [quota]`    | Add a reseller       |
| `.delreseller <number>`                   | Remove a reseller    |
| `.listreseller`                           | List all resellers   |

### Custom Cases (dynamic commands)
| Command                          | Description                          |
|----------------------------------|--------------------------------------|
| `.addcase <cmd> <response>`      | Add a custom command with a response |
| `.delcase <cmd>`                 | Remove a custom command              |
| `.getcase <cmd>`                 | View a custom command's response     |
| `.editcase <cmd> <new_response>` | Edit a custom command response       |

## Settings File

Everything is saved in `data/settings.json`, auto-created on first run:

```json
{
  "prefix": ".",
  "botName": "MyBot",
  "ownerNumber": "",
  "mode": "public",
  "antidelete": false,
  "autoblock": false,
  "gconly": false,
  "owners": [],
  "resellers": [],
  "keys": [],
  "cases": []
}
```

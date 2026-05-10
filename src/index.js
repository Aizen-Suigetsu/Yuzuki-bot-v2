import "dotenv/config";
import { startBot, logger } from "./bot.js";

logger.info("Starting WhatsApp bot...");
logger.info("Tip: Scan the QR code that appears in the console with WhatsApp > Linked Devices");

startBot().catch((err) => {
  logger.error({ err }, "Fatal error starting bot");
  process.exit(1);
});

process.on("SIGTERM", async () => {
  logger.info("Received SIGTERM, shutting down...");
  process.exit(0);
});

process.on("SIGINT", async () => {
  logger.info("Received SIGINT, shutting down...");
  process.exit(0);
});

process.on("uncaughtException", (err) => {
  logger.error({ err }, "Uncaught exception — shutting down");
  process.exit(1);
});

process.on("unhandledRejection", (reason) => {
  logger.error({ reason }, "Unhandled rejection");
});

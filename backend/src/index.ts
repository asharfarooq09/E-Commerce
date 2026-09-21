import "dotenv/config";
import { createApp } from "./app";
import { env } from "./config/env";

const app = createApp();

// Bind 0.0.0.0 so Railway healthchecks can reach the process.
app.listen(env.PORT, "0.0.0.0", () => {
  console.log(`ShopAI API listening on 0.0.0.0:${env.PORT}`);
});

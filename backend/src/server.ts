import app from "./app";
import { PORT } from "./config/env";
import { connectDB } from "./config/db";

async function start() {
  await connectDB();
  app.listen(PORT, () => console.log(`Server running on http://localhost:${PORT}`));
}

start().catch((err) => {
  console.error(err);
  process.exit(1);
});

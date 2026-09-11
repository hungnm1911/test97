import "dotenv/config";
import app from "./src/app.js";

async function startServer() {
  try {
    app.listen(3000, () => {
      console.log(`Server is running at http://localhost:3000`);
    });
  } catch (error) {
    console.error("Error starting the server:", error.message);

    process.exit(1);
  }
}

startServer();
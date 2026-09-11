import { Sequelize } from "sequelize";
import config from "./index.js";

const sequelize = new Sequelize(config.database);

const connectDatabase = async () => {
  try {
    await sequelize.authenticate();

    console.log("Connect to MySQL successfully.");
  } catch (error) {
    console.error("Unable to connect to MySQL:", error.message);

    throw error;
  }
};

export { connectDatabase };
export default sequelize;
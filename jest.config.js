import dotenv from "dotenv";

dotenv.config({
  path: ".env.test",
  quiet: true,
});

export default {
  testEnvironment: "node",
  transform: {},
  clearMocks: true
};
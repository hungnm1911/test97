import express from "express";

import indexRouter from "./routes/index.js";

import correlationId from "./middleware/correlation-id.middleware.js";
import notFound from "./middleware/not-found.middeware.js";
import errorHandler from "./middleware/error-handler.middleware.js";

const app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use(correlationId);

app.use("/", indexRouter);

app.use(notFound);

app.use(errorHandler);

export default app;
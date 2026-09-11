import { randomUUID } from "node:crypto";

export default function correlationId(req, res, next) {
  const requestId = randomUUID();

  req.requestId = requestId;

  res.setHeader("X-Correlation-ID", requestId);

  res.on("finish", () => {
    console.info(
      JSON.stringify({
        event: "http_request",
        correlationId: requestId,
        method: req.method,
        statusCode: res.statusCode,
      }),
    );
  });

  next();
}
import express from "express";
import { ApiError, asyncHandler, errorHandler, notFound, env } from "@cowork/shared";
import { db, seed, listSpaces, findSpace, listTypes } from "./db.js";

const app = express();
app.use(express.json({ limit: "10kb" }));

app.get("/health", (_req, res) =>
  res.json({ service: "spaces", status: "ok", spaces: listSpaces().length })
);

app.get("/spaces", (_req, res) => res.json({ spaces: listSpaces() }));

app.get(
  "/spaces/:id",
  asyncHandler(async (req, res) => {
    const space = findSpace(req.params.id);
    if (!space) throw new ApiError(404, "Space not found");
    res.json({ space });
  })
);

app.get("/types", (_req, res) => res.json({ types: listTypes() }));

app.use(notFound);
app.use(errorHandler("spaces"));

if (seed()) console.log("[spaces] seeded catalog");

app.listen(env.spacesPort, "127.0.0.1", () =>
  console.log(`[spaces] listening on http://127.0.0.1:${env.spacesPort}`)
);

const shutdown = () => { db.close(); process.exit(0); };
process.on("SIGINT", shutdown);
process.on("SIGTERM", shutdown);

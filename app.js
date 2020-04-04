const express = require("express");
const cors = require("cors");
const substanceRouter = require("./routes/substanceRoutes");

const app = express();

app.use(express.json());
app.use(cors());

// 3) ROUTES
app.use("/api/v1/substances", substanceRouter);

module.exports = app;

const express = require("express");
const bodyParser = require("body-parser");

const propertyRoutes = require("./routes/propertyRoutes");
const propertyAnalysisRoutes = require("./routes/propertyAnalysisRoutes");

const app = express();
const port = 5000;

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("RealtyDataLabs API running");
});

// Existing routes (keep as-is)
app.use("/api", propertyRoutes);

// Property analysis API
// Router defines: POST /property and GET /property/:id
// So full paths become:
// POST /api/v1/analysis/property
// GET  /api/v1/analysis/property/:id
app.use("/api/v1/analysis", propertyAnalysisRoutes);

// Error handler (must be last middleware, before listen)
app.use((err, req, res, next) => {
  const status = err.statusCode || err.status || 500;

  if (status === 400 || err.name === "BadRequestError") {
    return res.status(400).json({
      error: "Bad Request",
      message: err.message || "Invalid request.",
      details: err.details || [],
    });
  }

  return res.status(status).json({
    error: status === 500 ? "Internal Server Error" : "Error",
    debug: {
      name: err.name,
      message: err.message,
      stack: err.stack,
    },
  });
});

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

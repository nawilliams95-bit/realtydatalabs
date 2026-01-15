const express = require("express");
const bodyParser = require("body-parser");
const propertyRoutes = require("./propertyRoutes");

const app = express();
const port = 5000;

app.use(bodyParser.json());

app.get("/", (req, res) => {
  res.send("RealtyDataLabs API running");
});

app.use("/api", propertyRoutes);

app.listen(port, () => {
  console.log(`Server running on port ${port}`);
});

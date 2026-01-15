const express = require("express");
const db = require("./firebase");
const router = express.Router();

// Add new property
router.post("/properties", async (req, res) => {
  const { address, details } = req.body; // Sample fields
  
  try {
    const newPropertyRef = db.collection("properties").doc();
    await newPropertyRef.set({
      address,
      details,
      createdAt: admin.firestore.FieldValue.serverTimestamp(),
    });
    res.status(201).send("Property added successfully!");
  } catch (error) {
    res.status(500).send("Error adding property: " + error.message);
  }
});

// Get property data
router.get("/properties/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const propertyDoc = await db.collection("properties").doc(id).get();
    if (!propertyDoc.exists) {
      res.status(404).send("Property not found");
    } else {
      res.status(200).json(propertyDoc.data());
    }
  } catch (error) {
    res.status(500).send("Error fetching property: " + error.message);
  }
});

module.exports = router;

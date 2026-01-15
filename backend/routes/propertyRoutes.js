const express = require("express");
const router = express.Router();
const { db } = require("../config/firebase");

// Add new property
router.post("/properties", async (req, res) => {
  const { address, details } = req.body;

  try {
    const newPropertyRef = db.collection("properties").doc();
    await newPropertyRef.set({
      address,
      details,
      createdAt: new Date()
    });

    res.status(201).json({
      success: true,
      id: newPropertyRef.id
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

// Get property data by ID
router.get("/properties/:id", async (req, res) => {
  const { id } = req.params;

  try {
    const propertyDoc = await db.collection("properties").doc(id).get();

    if (!propertyDoc.exists) {
      return res.status(404).json({ message: "Property not found" });
    }

    res.json({
      id: propertyDoc.id,
      ...propertyDoc.data()
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      message: error.message
    });
  }
});

module.exports = router;

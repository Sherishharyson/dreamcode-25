const express = require('express');
const router = express.Router();
const waterController = require('../controllers/waterController');

// Route to check water safety
router.post('/check-water-safety', waterController.checkWaterSafety);

module.exports = router;
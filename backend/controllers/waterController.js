const waterData = require('../models/waterData');
const geminiService = require('../services/geminiService');

// Water safety standards
const WATER_SAFETY_STANDARDS = {
  lead: { max: 0.015, unit: 'mg/L' },
  copper: { max: 1.3, unit: 'mg/L' },
  nitrate: { max: 10, unit: 'mg/L' },
  bacteria: { max: 0, unit: 'cfu/100mL' },
  pH: { min: 6.5, max: 8.5, unit: 'pH' }
};

/**
 * Check water safety at a given location
 */
exports.checkWaterSafety = async (req, res) => {
  try {
    const { latitude, longitude, address } = req.body;

    // Get water quality data from your database based on location
    const waterQualityData = await waterData.fetchWaterQualityData(latitude, longitude, address);

    // Add safety standards to the water data
    waterQualityData.standards = WATER_SAFETY_STANDARDS;

    // Analyze water quality with Gemini AI
    const analysisResult = await geminiService.analyzeWaterWithGemini(waterQualityData);

    res.json(analysisResult);
  } catch (error) {
    console.error('Error analyzing water safety:', error);
    res.status(500).json({ error: 'Failed to analyze water safety' });
  }
};

/**
 * Fallback function for simple water analysis
 * Used if Gemini AI response cannot be parsed
 */
exports.simpleWaterAnalysis = (waterData) => {
  // Simple rule-based fallback
  const metrics = waterData.metrics;
  const issues = [];

  // Check each metric against standards
  if (metrics.lead > WATER_SAFETY_STANDARDS.lead.max) {
    issues.push(`Lead level (${metrics.lead} ${WATER_SAFETY_STANDARDS.lead.unit}) exceeds maximum safe level.`);
  }

  if (metrics.copper > WATER_SAFETY_STANDARDS.copper.max) {
    issues.push(`Copper level (${metrics.copper} ${WATER_SAFETY_STANDARDS.copper.unit}) exceeds maximum safe level.`);
  }

  if (metrics.nitrate > WATER_SAFETY_STANDARDS.nitrate.max) {
    issues.push(`Nitrate level (${metrics.nitrate} ${WATER_SAFETY_STANDARDS.nitrate.unit}) exceeds maximum safe level.`);
  }

  if (metrics.bacteria > WATER_SAFETY_STANDARDS.bacteria.max) {
    issues.push(`Bacterial count (${metrics.bacteria} ${WATER_SAFETY_STANDARDS.bacteria.unit}) exceeds safe level.`);
  }

  if (metrics.pH < WATER_SAFETY_STANDARDS.pH.min || metrics.pH > WATER_SAFETY_STANDARDS.pH.max) {
    issues.push(`pH level (${metrics.pH}) is outside the safe range.`);
  }

  // Determine overall safety status
  let safetyStatus = 'safe';
  if (issues.length > 0) {
    safetyStatus = issues.some(issue => issue.includes('exceeds')) ? 'unsafe' : 'conditional';
  }

  // Generate recommendations
  const recommendations = [];
  if (safetyStatus === 'unsafe') {
    recommendations.push('Do not consume this water.');
    recommendations.push('Consider using bottled water for drinking and cooking.');
    recommendations.push('Contact your local water authority for assistance.');
  } else if (safetyStatus === 'conditional') {
    recommendations.push('Water may be used for showering but not for drinking.');
    recommendations.push('Consider using a water filter certified for the detected issues.');
  } else {
    recommendations.push('Water is safe for all household uses.');
  }

  return {
    safetyStatus,
    explanation: issues.length > 0 ?
      `Water quality issues detected: ${issues.join(' ')}` :
      'All water quality metrics are within safe ranges.',
    issues,
    recommendations,
    confidenceLevel: 80 // Lower confidence for the fallback system
  };
};
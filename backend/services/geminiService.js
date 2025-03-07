const { GoogleGenerativeAI } = require('@google/generative-ai');
const waterController = require('../controllers/waterController');

// Initialize Gemini AI
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

/**
 * Analyze water quality data using Gemini AI
 * @param {Object} waterData - Water quality data including metrics and location
 * @returns {Object} - Analysis results
 */
exports.analyzeWaterWithGemini = async (waterData) => {
  try {
    // Create a model instance
    const model = genAI.getGenerativeModel({ model: 'gemini-1.5-pro' });

    // Prepare the context for Gemini with water quality data and safety standards
    const prompt = `
      Analyze the safety of drinking water with the following metrics:
      
      Water Quality Metrics:
      ${JSON.stringify(waterData.metrics, null, 2)}
      
      Safety Standards:
      ${JSON.stringify(waterData.standards, null, 2)}
      
      Location: ${waterData.location.address || `${waterData.location.latitude}, ${waterData.location.longitude}`}
      Last Tested: ${waterData.lastTested}
      Source: ${waterData.source}
      
      Please provide:
      1. Overall safety assessment (safe, conditional, unsafe)
      2. Detailed explanation of any issues
      3. Recommendations for use
      4. Confidence level in assessment
      
      Format your response as a JSON object with the following structure:
      {
        "safetyStatus": "safe|conditional|unsafe",
        "explanation": "detailed explanation",
        "issues": [list of specific issues],
        "recommendations": [list of recommendations],
        "confidenceLevel": "number between 0-100"
      }
    `;

    // Generate content with Gemini
    const result = await model.generateContent(prompt);
    const response = result.response;
    const textResponse = response.text();

    // Parse JSON from Gemini's response
    // Note: We're extracting JSON from the text response
    const jsonMatch = textResponse.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      try {
        return JSON.parse(jsonMatch[0]);
      } catch (error) {
        console.error('Error parsing Gemini response as JSON:', error);
        // Fallback to a simpler analysis if JSON parsing fails
        return waterController.simpleWaterAnalysis(waterData);
      }
    } else {
      // Fallback to a simpler analysis if no JSON is found
      return waterController.simpleWaterAnalysis(waterData);
    }
  } catch (error) {
    console.error('Error with Gemini AI:', error);
    // Fallback to simple analysis if Gemini fails
    return waterController.simpleWaterAnalysis(waterData);
  }
};
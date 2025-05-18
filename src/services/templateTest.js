/**
 * Template Testing Utility
 * 
 * This file contains functions to test if all business plan templates are working properly.
 * It includes sample data and functions to run tests on each template.
 */

const { getBasicStartupTemplatePlan } = require('./templates/basicStartupTemplate');
const { getEarlyStartupTemplatePlan } = require('./templates/earlyStartupTemplate');
const { getSocialEnterpriseTemplatePlan } = require('./templates/socialEnterpriseTemplate');
const { getStartupSuccessTemplatePlan } = require('./templates/startupSuccessTemplate');

// Sample company data for testing
const sampleCompanyInfo = {
  companyName: "TechInnovate",
  foundYear: "2023",
  companySize: "Startup (5 employees)",
  industry: "Technology",
  itemName: "AI-Powered Business Assistant",
  itemDescription: "An AI assistant that helps startups create professional business plans and funding applications.",
  uniquePoint: "Uses advanced AI to generate government-grant ready business plans in Korean.",
  targetMarket: "Korean startups and small businesses seeking government funding."
};

/**
 * Test all templates with the sample data
 */
function testAllTemplates() {
  try {
    // Basic Startup Template
    const basicStartupPlan = getBasicStartupTemplatePlan(sampleCompanyInfo);
    console.log("Basic Startup Template Plan generated successfully");
    
    // Early Startup Template
    const earlyStartupPlan = getEarlyStartupTemplatePlan(sampleCompanyInfo);
    console.log("Early Startup Template Plan generated successfully");
    
    // Social Enterprise Template
    const socialEnterprisePlan = getSocialEnterpriseTemplatePlan(sampleCompanyInfo);
    console.log("Social Enterprise Template Plan generated successfully");
    
    // Startup Success Template
    const startupSuccessPlan = getStartupSuccessTemplatePlan(sampleCompanyInfo);
    console.log("Startup Success Template Plan generated successfully");
    
    return {
      success: true,
      results: {
        basicStartupPlan,
        earlyStartupPlan,
        socialEnterprisePlan,
        startupSuccessPlan
      }
    };
  } catch (error) {
    console.error("Error testing templates:", error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

/**
 * Test a specific template
 */
function testTemplate(templateType) {
  try {
    let result;
    
    switch (templateType) {
      case 'basic':
        result = getBasicStartupTemplatePlan(sampleCompanyInfo);
        console.log("Basic Startup Template Plan generated successfully");
        break;
      case 'early':
        result = getEarlyStartupTemplatePlan(sampleCompanyInfo);
        console.log("Early Startup Template Plan generated successfully");
        break;
      case 'social':
        result = getSocialEnterpriseTemplatePlan(sampleCompanyInfo);
        console.log("Social Enterprise Template Plan generated successfully");
        break;
      case 'success':
        result = getStartupSuccessTemplatePlan(sampleCompanyInfo);
        console.log("Startup Success Template Plan generated successfully");
        break;
      default:
        throw new Error(`Invalid template type: ${templateType}`);
    }
    
    return {
      success: true,
      result
    };
  } catch (error) {
    console.error(`Error testing template ${templateType}:`, error);
    return {
      success: false,
      error: error instanceof Error ? error.message : String(error)
    };
  }
}

module.exports = {
  testAllTemplates,
  testTemplate
}; 
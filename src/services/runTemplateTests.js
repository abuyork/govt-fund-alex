/**
 * CLI Script to run template tests
 * 
 * This script allows for testing the templates via command line.
 * Run with: node src/services/runTemplateTests.js [template-type]
 * 
 * Where template-type is one of: basic, early, social, success, all
 */

const { testAllTemplates, testTemplate } = require('./templateTest');

const args = process.argv.slice(2);
const templateType = args[0] || 'all';

console.log('Running template tests...');

if (templateType === 'all') {
  console.log('Testing all templates:');
  const result = testAllTemplates();
  
  if (result.success) {
    console.log('✅ All templates generated successfully!');
    
    // Print a small sample of each prompt for verification
    if (result.results) {
      Object.entries(result.results).forEach(([name, prompt]) => {
        if (typeof prompt === 'string') {
          console.log(`\n${name} (first 150 chars):`);
          console.log(prompt.substring(0, 150) + '...');
        }
      });
    }
  } else {
    console.error('❌ Test failed:', result.error);
    process.exit(1);
  }
} else {
  console.log(`Testing template: ${templateType}`);
  
  if (!['basic', 'early', 'social', 'success'].includes(templateType)) {
    console.error('Invalid template type. Use: basic, early, social, success, or all');
    process.exit(1);
  }
  
  const result = testTemplate(templateType);
  
  if (result.success) {
    console.log(`✅ ${templateType} template generated successfully!`);
    console.log('\nPrompt (first 150 chars):');
    if (typeof result.result === 'string') {
      console.log(result.result.substring(0, 150) + '...');
    }
  } else {
    console.error('❌ Test failed:', result.error);
    process.exit(1);
  }
}

console.log('\nTests completed.'); 
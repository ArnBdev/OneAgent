/**
 * Agent Persona Optimization Validation System
 * Tests each agent's persona configuration and systematic framework integration
 */

const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml'); // Note: Install with npm install js-yaml

class PersonaValidationSystem {
  constructor() {
    this.results = {
      agentPersonas: {},
      frameworks: {},
      overallScore: 0,
      recommendations: []
    };
    this.personasPath = path.join(__dirname, '..', 'prompts', 'personas');
    this.frameworksPath = path.join(__dirname, '..', 'prompts', 'frameworks');
  }

  async validateAllPersonas() {
    console.log('🎭 Starting Agent Persona Optimization Validation...\n');
    
    try {
      // Load and validate all personas
      await this.validatePersonaFiles();
      
      // Load and validate frameworks
      await this.validateFrameworkFiles();
      
      // Test persona-framework integration
      await this.validatePersonaFrameworkIntegration();
      
      // Test constitutional AI compliance
      await this.validateConstitutionalCompliance();
      
      // Calculate overall optimization score
      this.calculateOptimizationScore();
      
      // Generate recommendations
      this.generateOptimizationRecommendations();
      
      // Output results
      this.outputValidationResults();
      
    } catch (error) {
      console.error('❌ Validation error:', error.message);
      throw error;
    }
  }

  async validatePersonaFiles() {
    console.log('📋 Validating persona configurations...');
    
    const expectedPersonas = [
      'dev-agent.yaml',
      'office-agent.yaml', 
      'fitness-agent.yaml',
      'triage-agent.yaml',
      'core-agent.yaml',
      'agent-factory.yaml',
      'orchestrator.yaml'
    ];

    for (const personaFile of expectedPersonas) {
      const filePath = path.join(this.personasPath, personaFile);
      
      if (!fs.existsSync(filePath)) {
        this.results.agentPersonas[personaFile] = {
          exists: false,
          score: 0,
          issues: ['File does not exist']
        };
        continue;
      }

      const content = fs.readFileSync(filePath, 'utf8');
      const persona = yaml.load(content);
      
      const validation = this.validatePersonaStructure(persona, personaFile);
      this.results.agentPersonas[personaFile] = validation;
      
      console.log(`  ✅ ${personaFile}: ${validation.score}/100`);
    }
  }

  validatePersonaStructure(persona, filename) {
    const validation = {
      exists: true,
      score: 0,
      issues: [],
      strengths: []
    };

    // Required sections check (30 points)
    const requiredSections = [
      'core_identity',
      'systematic_approach', 
      'constitutional_principles',
      'core_principles',
      'capabilities',
      'communication_style',
      'memory_organization',
      'quality_standards'
    ];

    let sectionsScore = 0;
    for (const section of requiredSections) {
      if (persona[section]) {
        sectionsScore += 3.75; // 30/8 = 3.75 per section
        validation.strengths.push(`Has ${section} section`);
      } else {
        validation.issues.push(`Missing ${section} section`);
      }
    }
    validation.score += sectionsScore;

    // Constitutional AI integration (20 points)
    if (persona.constitutional_principles) {
      const principles = ['accuracy', 'transparency', 'helpfulness', 'safety'];
      let principlesScore = 0;
      for (const principle of principles) {
        if (persona.constitutional_principles[principle]) {
          principlesScore += 5; // 20/4 = 5 per principle
        }
      }
      validation.score += principlesScore;
      validation.strengths.push('Constitutional AI principles defined');
    }

    // Framework integration (20 points)
    if (persona.systematic_approach && persona.systematic_approach.framework) {
      validation.score += 20;
      validation.strengths.push(`Uses ${persona.systematic_approach.framework} framework`);
    } else {
      validation.issues.push('No systematic framework specified');
    }

    // Quality standards (15 points)
    if (persona.quality_standards) {
      if (persona.quality_standards.minimum_score) validation.score += 5;
      if (persona.quality_standards.validation_required) validation.score += 5;
      if (persona.quality_standards.constitutional_check) validation.score += 5;
      validation.strengths.push('Quality standards specified');
    }

    // Memory organization (15 points)
    if (persona.memory_organization && persona.memory_organization.categories) {
      const categories = persona.memory_organization.categories;
      if (Array.isArray(categories) && categories.length >= 5) {
        validation.score += 15;
        validation.strengths.push(`Well-organized memory structure (${categories.length} categories)`);
      } else {
        validation.score += 7;
        validation.issues.push('Memory organization could be more comprehensive');
      }
    }

    return validation;
  }

  async validateFrameworkFiles() {
    console.log('\n🔧 Validating systematic frameworks...');
    
    const expectedFrameworks = [
      'rtf-framework.yaml',
      'tag-framework.yaml',
      'care-framework.yaml',
      'rgc-framework.yaml',
      'meta-framework.yaml',
      'orchestrate-framework.yaml'
    ];

    for (const frameworkFile of expectedFrameworks) {
      const filePath = path.join(this.frameworksPath, frameworkFile);
      
      if (!fs.existsSync(filePath)) {
        this.results.frameworks[frameworkFile] = {
          exists: false,
          score: 0,
          issues: ['File does not exist']
        };
        continue;
      }      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const framework = yaml.load(content);
        
        if (!framework) {
          this.results.frameworks[frameworkFile] = {
            exists: true,
            score: 0,
            issues: ['Failed to parse YAML content']
          };
          continue;
        }
        
        const validation = this.validateFrameworkStructure(framework, frameworkFile);
        this.results.frameworks[frameworkFile] = validation;
      } catch (parseError) {
        this.results.frameworks[frameworkFile] = {
          exists: true,
          score: 0,
          issues: [`Parse error: ${parseError.message}`]
        };
        continue;      }
      
      console.log(`  ✅ ${frameworkFile}: ${this.results.frameworks[frameworkFile].score}/100`);
    }
  }

  validateFrameworkStructure(framework, filename) {
    const validation = {
      exists: true,
      score: 0,
      issues: [],
      strengths: []
    };

    // Required sections (40 points)
    const requiredSections = ['structure', 'application_contexts', 'quality_standards'];
    for (const section of requiredSections) {
      if (framework[section]) {
        validation.score += 13.33; // 40/3
        validation.strengths.push(`Has ${section} section`);
      } else {
        validation.issues.push(`Missing ${section} section`);
      }
    }

    // Framework structure validation (30 points)
    if (framework.structure) {
      const structureKeys = Object.keys(framework.structure);
      if (structureKeys.length >= 3) {
        validation.score += 30;
        validation.strengths.push(`Well-structured framework (${structureKeys.length} phases)`);
      } else {
        validation.score += 15;
        validation.issues.push('Framework structure could be more comprehensive');
      }
    }

    // Integration capabilities (30 points)
    if (framework.integration) {
      if (framework.integration.constitutional_ai) validation.score += 10;
      if (framework.integration.quality_validation) validation.score += 10;
      if (framework.integration.bmad_enhancement !== undefined) validation.score += 10;
      validation.strengths.push('Integration capabilities specified');
    } else {
      validation.issues.push('No integration capabilities specified');
    }

    return validation;
  }

  async validatePersonaFrameworkIntegration() {
    console.log('\n🔗 Validating persona-framework integration...');
    
    const integrationTests = [
      { persona: 'dev-agent.yaml', expectedFramework: 'R-I-S-E' },
      { persona: 'office-agent.yaml', expectedFramework: 'T-A-G' },
      { persona: 'fitness-agent.yaml', expectedFramework: 'C-A-R-E' },
      { persona: 'triage-agent.yaml', expectedFramework: 'R-G-C' },
      { persona: 'core-agent.yaml', expectedFramework: 'R-I-S-E+' },
      { persona: 'agent-factory.yaml', expectedFramework: 'META' },
      { persona: 'orchestrator.yaml', expectedFramework: 'ORCHESTRATE' }
    ];

    let integrationScore = 0;
    for (const test of integrationTests) {
      const personaPath = path.join(this.personasPath, test.persona);
      if (fs.existsSync(personaPath)) {
        const content = fs.readFileSync(personaPath, 'utf8');
        const persona = yaml.load(content);
        
        if (persona.systematic_approach && 
            persona.systematic_approach.framework === test.expectedFramework) {
          integrationScore += 1;
          console.log(`  ✅ ${test.persona} -> ${test.expectedFramework}`);
        } else {
          console.log(`  ⚠️ ${test.persona} framework mismatch`);
        }
      }
    }

    this.results.integrationScore = (integrationScore / integrationTests.length) * 100;
    console.log(`\n📊 Integration Score: ${this.results.integrationScore.toFixed(1)}%`);
  }

  async validateConstitutionalCompliance() {
    console.log('\n🏛️ Validating Constitutional AI compliance...');
    
    const requiredPrinciples = ['accuracy', 'transparency', 'helpfulness', 'safety'];
    let complianceScore = 0;
    let totalPersonas = 0;

    for (const [personaFile, validation] of Object.entries(this.results.agentPersonas)) {
      if (!validation.exists) continue;
      
      const personaPath = path.join(this.personasPath, personaFile);
      const content = fs.readFileSync(personaPath, 'utf8');
      const persona = yaml.load(content);
      
      if (persona.constitutional_principles) {
        let personaCompliance = 0;
        for (const principle of requiredPrinciples) {
          if (persona.constitutional_principles[principle]) {
            personaCompliance += 1;
          }
        }
        complianceScore += (personaCompliance / requiredPrinciples.length);
        totalPersonas += 1;
      }
    }

    this.results.constitutionalCompliance = (complianceScore / totalPersonas) * 100;
    console.log(`📊 Constitutional Compliance: ${this.results.constitutionalCompliance.toFixed(1)}%`);
  }

  calculateOptimizationScore() {
    console.log('\n📈 Calculating overall optimization score...');
    
    // Calculate average persona score
    let personaScores = [];
    for (const validation of Object.values(this.results.agentPersonas)) {
      if (validation.exists) personaScores.push(validation.score);
    }
    const avgPersonaScore = personaScores.reduce((a, b) => a + b, 0) / personaScores.length;

    // Calculate average framework score
    let frameworkScores = [];
    for (const validation of Object.values(this.results.frameworks)) {
      if (validation.exists) frameworkScores.push(validation.score);
    }
    const avgFrameworkScore = frameworkScores.reduce((a, b) => a + b, 0) / frameworkScores.length;

    // Weighted overall score
    this.results.overallScore = (
      avgPersonaScore * 0.4 +
      avgFrameworkScore * 0.3 +
      this.results.integrationScore * 0.2 +
      this.results.constitutionalCompliance * 0.1
    );

    console.log(`📊 Average Persona Score: ${avgPersonaScore.toFixed(1)}/100`);
    console.log(`📊 Average Framework Score: ${avgFrameworkScore.toFixed(1)}/100`);
    console.log(`📊 Integration Score: ${this.results.integrationScore.toFixed(1)}/100`);
    console.log(`📊 Constitutional Compliance: ${this.results.constitutionalCompliance.toFixed(1)}/100`);
    console.log(`\n🎯 Overall Optimization Score: ${this.results.overallScore.toFixed(1)}/100`);
  }

  generateOptimizationRecommendations() {
    console.log('\n💡 Generating optimization recommendations...');
    
    this.results.recommendations = [];

    // Check for missing personas
    const expectedPersonas = ['dev-agent.yaml', 'office-agent.yaml', 'fitness-agent.yaml', 
                             'triage-agent.yaml', 'core-agent.yaml', 'agent-factory.yaml', 'orchestrator.yaml'];
    for (const persona of expectedPersonas) {
      if (!this.results.agentPersonas[persona] || !this.results.agentPersonas[persona].exists) {
        this.results.recommendations.push(`Create missing persona: ${persona}`);
      }
    }

    // Check for low scoring personas
    for (const [persona, validation] of Object.entries(this.results.agentPersonas)) {
      if (validation.exists && validation.score < 80) {
        this.results.recommendations.push(`Improve ${persona} configuration (score: ${validation.score})`);
      }
    }

    // Check integration score
    if (this.results.integrationScore < 85) {
      this.results.recommendations.push('Improve persona-framework integration alignment');
    }

    // Check constitutional compliance
    if (this.results.constitutionalCompliance < 95) {
      this.results.recommendations.push('Enhance Constitutional AI principle definitions');
    }

    // Overall score recommendations
    if (this.results.overallScore >= 90) {
      this.results.recommendations.push('🎉 Excellent optimization! Consider advanced features');
    } else if (this.results.overallScore >= 80) {
      this.results.recommendations.push('Good optimization. Focus on identified improvements');
    } else if (this.results.overallScore >= 70) {
      this.results.recommendations.push('Moderate optimization. Significant improvements needed');
    } else {
      this.results.recommendations.push('Low optimization. Major restructuring recommended');
    }
  }

  outputValidationResults() {
    console.log('\n' + '='.repeat(60));
    console.log('🎭 AGENT PERSONA OPTIMIZATION VALIDATION RESULTS');
    console.log('='.repeat(60));
    
    console.log(`\n📊 Overall Score: ${this.results.overallScore.toFixed(1)}/100`);
    
    if (this.results.overallScore >= 90) {
      console.log('🎉 Status: EXCELLENT - System optimally configured');
    } else if (this.results.overallScore >= 80) {
      console.log('✅ Status: GOOD - Minor optimizations needed');
    } else if (this.results.overallScore >= 70) {
      console.log('⚠️ Status: MODERATE - Improvements required');
    } else {
      console.log('❌ Status: POOR - Major optimization needed');
    }

    console.log('\n💡 Recommendations:');
    for (const recommendation of this.results.recommendations) {
      console.log(`  • ${recommendation}`);
    }

    console.log('\n📋 Detailed Results:');
    console.log(`  🎭 Agent Personas: ${Object.keys(this.results.agentPersonas).length} validated`);
    console.log(`  🔧 Frameworks: ${Object.keys(this.results.frameworks).length} validated`);
    console.log(`  🔗 Integration: ${this.results.integrationScore.toFixed(1)}%`);
    console.log(`  🏛️ Constitutional: ${this.results.constitutionalCompliance.toFixed(1)}%`);

    console.log('\n✅ Agent persona optimization validation completed!');
  }
}

module.exports = PersonaValidationSystem;

// Run validation if called directly
if (require.main === module) {
  const validator = new PersonaValidationSystem();
  validator.validateAllPersonas()
    .then(() => {
      console.log('\n🎉 Validation completed successfully!');
      process.exit(0);
    })
    .catch(error => {
      console.error('\n❌ Validation failed:', error);
      process.exit(1);
    });
}

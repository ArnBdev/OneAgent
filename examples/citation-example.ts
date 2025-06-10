// Citation Example - WebFindingsManager Source Attribution
// This demonstrates how the WebFindingsManager provides complete citation data

import { WebFindingsManager } from '../coreagent/intelligence/webFindingsManager';
import { WebSearchFinding, WebFetchFinding } from '../coreagent/types/webFindings';

/**
 * Simple citation formatter for research purposes
 * Shows how WebFindingsManager provides all necessary citation data
 */
export class CitationFormatter {
  
  /**
   * Format WebFetchFinding as APA-style citation
   */
  static formatAPA(finding: WebFetchFinding): string {
    const accessDate = new Date(finding.metadata.timestamp).toLocaleDateString('en-US');
    const title = finding.metadata.title || 'Untitled';
    const domain = finding.metadata.domain || 'Unknown domain';
    
    return `${title}. (n.d.). ${domain}. Retrieved ${accessDate}, from ${finding.url}`;
  }

  /**
   * Format WebSearchFinding as search citation
   */
  static formatSearchCitation(finding: WebSearchFinding): string {
    const accessDate = new Date(finding.metadata.timestamp).toLocaleDateString('en-US');
    const searchEngine = finding.metadata.source === 'brave' ? 'Brave Search' : finding.metadata.source;
    
    return `Search query: "${finding.query}" via ${searchEngine}. Retrieved ${accessDate}. Found ${finding.results.length} results.`;
  }

  /**
   * Simple research note format with all source attribution
   */
  static formatResearchNote(finding: WebFetchFinding): string {
    return `
📝 Research Finding
Title: ${finding.metadata.title || 'Untitled'}
Source: ${finding.metadata.domain} (${finding.url})
Accessed: ${new Date(finding.metadata.timestamp).toLocaleDateString('en-US')}
Content Type: ${finding.content.contentType}
Word Count: ${finding.extracted.wordCount}
Relevance: ${finding.classification.importance}/1.0
Category: ${finding.classification.category}

Key Points:
${finding.extracted.keyPoints.map(point => `• ${point}`).join('\n')}
    `.trim();
  }
}

// Example usage:
console.log('🔍 Citation Example:');
console.log('WebFindingsManager provides complete source attribution for research integrity:');
console.log('✅ URL + Domain extraction');
console.log('✅ Access date/time');
console.log('✅ Search terms used');
console.log('✅ Search engine source');
console.log('✅ Page title & metadata');
console.log('✅ Content analysis');
console.log('');
console.log('Perfect for academic research, compliance, and fact-checking! 📚');

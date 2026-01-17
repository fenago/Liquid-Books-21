/**
 * Rule-Based Content Formatter
 *
 * A rule-based transformation engine for MyST Markdown formatting.
 * Guarantees 100% content preservation through deterministic transformations.
 *
 * Architecture:
 * 1. Content Parser - Parse raw content into typed blocks
 * 2. Pattern Detector - Detect code, lists, quotes, etc.
 * 3. Admonition Detector - Rule-based admonition detection
 * 4. MyST Transformers - Individual feature formatters
 * 5. Transformation Engine - Apply transformations
 * 6. Verification - Content preservation verification
 */

// Content Parser
export {
  parseContent,
  reconstructContent,
  getBlocksByType,
  getParagraphBlocks,
  countWords,
  resetBlockIdCounter,
  type ContentBlock,
  type BlockType,
  type BlockMetadata,
  type ParsedContent,
} from './contentParser';

// Pattern Detector
export {
  detectAllPatterns,
  detectCodeBlocks,
  detectLists,
  detectQuotes,
  detectMath,
  detectLinksAndImages,
  detectLanguage,
  detectUnformattedCode,
  type DetectedPattern,
  type PatternType,
  type PatternMetadata,
} from './patternDetector';

// Admonition Detector
export {
  detectAdmonitionCandidates,
  detectSpecificAdmonitions,
  detectSafetyCriticalContent,
  shouldBeAdmonition,
  type AdmonitionSuggestion,
} from './admonitionDetector';

// MyST Transformers
export {
  wrapInAdmonition,
  wrapInDropdownAdmonition,
  formatCodeBlock,
  formatCodeBlockWithOptions,
  formatBlockquote,
  formatEpigraph,
  formatFigure,
  formatMarginNote,
  formatAside,
  formatSidebar,
  formatDropdown,
  formatTabs,
  formatCard,
  formatCardGrid,
  formatMathBlock,
  formatMermaidDiagram,
  formatExercise,
  formatSolution,
  formatProof,
  formatGlossary,
  formatListTable,
  formatTopic,
  formatPullQuote,
  formatVersionAdded,
  formatDeprecated,
  addLabel,
  applyInlineStyles,
  type AdmonitionType,
} from './mystTransformers';

// Transformation Engine
export {
  transformContent,
  transformContentWithLogging,
  quickFormatCodeBlocks,
  formatWithFeatures,
  type TransformationConfig,
  type TransformationResult,
  type AppliedTransformation,
  type TransformationSuggestion,
  type AISuggestion,
} from './transformationEngine';

// Verification
export {
  verifyPreservation,
  quickVerify,
  stripFormatting,
  extractSentences,
  normalizeForComparison,
  calculateSimilarity,
  findMissingSentences,
  generateVerificationReport,
  validateTransformation,
  type VerificationResult,
  type VerificationIssue,
} from './verification';

/**
 * Main formatting function - convenience wrapper
 *
 * Usage:
 * ```typescript
 * import { formatContentRuleBased } from '@/lib/formatters';
 *
 * const result = formatContentRuleBased(userContent, {
 *   selectedFeatures: ['note', 'warning', 'tip', 'code-block'],
 *   admonitionConfidenceThreshold: 0.65,
 * });
 *
 * if (result.verification.isPreserved) {
 *   setEditedContent(result.formattedContent);
 * } else {
 *   console.error('Content preservation issue:', result.verification.issues);
 * }
 * ```
 */
import { transformContent, TransformationConfig, TransformationResult } from './transformationEngine';
import { verifyPreservation, VerificationResult, stripFormatting } from './verification';

export interface FormatResult extends TransformationResult {
  verification: VerificationResult;
}

export function formatContentRuleBased(
  content: string,
  config?: Partial<TransformationConfig>
): FormatResult {
  const result = transformContent(content, config);
  const verification = verifyPreservation(content, result.formattedContent);

  return {
    ...result,
    verification,
  };
}

/**
 * Format content and throw if verification fails
 */
export function formatContentStrict(
  content: string,
  config?: Partial<TransformationConfig>
): TransformationResult {
  const result = formatContentRuleBased(content, config);

  if (!result.verification.isPreserved) {
    throw new Error(
      `Content preservation failed: ${result.verification.issues.map(i => i.description).join(', ')}`
    );
  }

  return result;
}

/**
 * Detect if content has MyST formatting (possibly broken)
 */
export function hasMystFormatting(content: string): boolean {
  // Check for MyST directive patterns
  const mystPatterns = [
    /^:::\{[\w-]+\}/m,           // :::{directive}
    /^:::[\w-]+/m,               // :::directive
    /^```\{[\w-]+\}/m,           // ```{directive}
    /^\([^)]+\)=$/m,             // (label)=
    /\{[\w-]+\}`[^`]+`/,         // {role}`content`
  ];

  return mystPatterns.some(pattern => pattern.test(content));
}

/**
 * Clean broken MyST formatting and re-format content
 * Use this when content has malformed MyST that's not rendering correctly
 */
export function cleanAndReformat(
  content: string,
  config?: Partial<TransformationConfig>
): FormatResult {
  // First strip all existing MyST formatting
  const cleanedContent = stripFormatting(content);

  // Then re-format with rule-based transformer
  return formatContentRuleBased(cleanedContent, config);
}

/**
 * Smart format - detects if content has MyST and cleans it first
 * This is the recommended entry point for the "Format Content" button
 */
export function smartFormat(
  content: string,
  config?: Partial<TransformationConfig>
): FormatResult & { wasCleanedFirst: boolean } {
  const hadMyst = hasMystFormatting(content);

  if (hadMyst) {
    // Content has MyST formatting - strip and re-format
    const result = cleanAndReformat(content, config);
    return { ...result, wasCleanedFirst: true };
  } else {
    // Fresh content - format directly
    const result = formatContentRuleBased(content, config);
    return { ...result, wasCleanedFirst: false };
  }
}

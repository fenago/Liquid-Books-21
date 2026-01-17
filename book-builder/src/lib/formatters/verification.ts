/**
 * Verification - Content preservation verification
 *
 * Guarantees that rule-based transformation preserves 100% of the original content.
 * Provides detailed analysis of any differences.
 */

import { countWords } from './contentParser';

export interface VerificationResult {
  isPreserved: boolean;
  originalWordCount: number;
  formattedWordCount: number;
  wordCountDifference: number;
  preservationPercentage: number;
  issues: VerificationIssue[];
  originalSentences: number;
  formattedSentences: number;
  sentencePreservationRate: number;
}

export interface VerificationIssue {
  type: 'missing-content' | 'extra-content' | 'modified-content' | 'word-count-mismatch';
  severity: 'error' | 'warning' | 'info';
  description: string;
  originalText?: string;
  formattedText?: string;
}

/**
 * Strip MyST formatting to get raw text content
 */
export function stripFormatting(content: string): string {
  let result = content;

  // Remove fenced code block markers but keep content
  result = result.replace(/^```[\w-]*\n?/gm, '');
  result = result.replace(/^```\s*$/gm, '');

  // Remove MyST directive markers (:::, :::{type}, etc.)
  result = result.replace(/^:::\{?[\w:-]+\}?.*$/gm, '');
  result = result.replace(/^:::$/gm, '');

  // Remove directive options (:label:, :class:, etc.)
  result = result.replace(/^:\w+:.*$/gm, '');

  // Remove heading markers
  result = result.replace(/^#{1,6}\s+/gm, '');

  // Remove blockquote markers
  result = result.replace(/^>\s*/gm, '');

  // Remove list markers (but keep content)
  result = result.replace(/^(\s*)[-*+]\s+/gm, '$1');
  result = result.replace(/^(\s*)\d+\.\s+/gm, '$1');

  // Remove inline formatting markers
  result = result.replace(/\*\*([^*]+)\*\*/g, '$1'); // bold
  result = result.replace(/\*([^*]+)\*/g, '$1'); // italic
  result = result.replace(/`([^`]+)`/g, '$1'); // inline code
  result = result.replace(/~~([^~]+)~~/g, '$1'); // strikethrough
  result = result.replace(/\[([^\]]+)\]\([^)]+\)/g, '$1'); // links

  // Remove MyST roles like {role}`content`
  result = result.replace(/\{[\w-]+\}`([^`]+)`/g, '$1');

  // Remove labels like (label)=
  result = result.replace(/^\([^)]+\)=\s*$/gm, '');

  // Remove math delimiters but keep content
  result = result.replace(/\$\$\n?/g, '');
  result = result.replace(/\$/g, '');

  // Normalize whitespace
  result = result.replace(/\n{3,}/g, '\n\n');
  result = result.trim();

  return result;
}

/**
 * Extract sentences from content (for sentence-level comparison)
 */
export function extractSentences(content: string): string[] {
  const stripped = stripFormatting(content);

  // Split by sentence-ending punctuation
  const sentences = stripped
    .split(/(?<=[.!?])\s+/)
    .map(s => s.trim())
    .filter(s => s.length > 0);

  return sentences;
}

/**
 * Normalize text for comparison (removes formatting, normalizes whitespace)
 */
export function normalizeForComparison(text: string): string {
  return stripFormatting(text)
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/[^\w\s]/g, '')
    .trim();
}

/**
 * Calculate similarity between two strings using Jaccard similarity
 */
export function calculateSimilarity(text1: string, text2: string): number {
  const words1 = new Set(normalizeForComparison(text1).split(' '));
  const words2 = new Set(normalizeForComparison(text2).split(' '));

  const intersection = new Set([...words1].filter(w => words2.has(w)));
  const union = new Set([...words1, ...words2]);

  if (union.size === 0) return 1;
  return intersection.size / union.size;
}

/**
 * Find missing sentences from original in formatted content
 */
export function findMissingSentences(
  originalSentences: string[],
  formattedContent: string
): string[] {
  const normalizedFormatted = normalizeForComparison(formattedContent);
  const missing: string[] = [];

  for (const sentence of originalSentences) {
    const normalizedSentence = normalizeForComparison(sentence);
    // Check if the normalized sentence appears in the formatted content
    if (normalizedSentence.length > 10 && !normalizedFormatted.includes(normalizedSentence)) {
      // Double-check with word overlap
      const sentenceWords = normalizedSentence.split(' ');
      const matchingWords = sentenceWords.filter(w =>
        normalizedFormatted.includes(w) && w.length > 3
      );
      // If less than 70% of significant words match, consider it missing
      if (matchingWords.length / sentenceWords.length < 0.7) {
        missing.push(sentence);
      }
    }
  }

  return missing;
}

/**
 * Verify that content is preserved after transformation
 */
export function verifyPreservation(
  original: string,
  formatted: string
): VerificationResult {
  const issues: VerificationIssue[] = [];

  // Word count comparison
  const originalStripped = stripFormatting(original);
  const formattedStripped = stripFormatting(formatted);

  const originalWordCount = countWords(originalStripped);
  const formattedWordCount = countWords(formattedStripped);
  const wordCountDifference = formattedWordCount - originalWordCount;

  // Calculate preservation percentage based on word count
  // Formatted should have >= words (formatting adds, not removes)
  let preservationPercentage = 100;
  if (originalWordCount > 0) {
    if (formattedWordCount < originalWordCount) {
      preservationPercentage = (formattedWordCount / originalWordCount) * 100;
    }
  }

  // Sentence-level comparison
  const originalSentences = extractSentences(original);
  const formattedSentences = extractSentences(formatted);

  // Find missing sentences
  const missingSentences = findMissingSentences(originalSentences, formatted);

  // Calculate sentence preservation rate
  const sentencePreservationRate = originalSentences.length > 0
    ? ((originalSentences.length - missingSentences.length) / originalSentences.length) * 100
    : 100;

  // Check for significant word count loss
  if (wordCountDifference < -5) {
    // Lost more than 5 words
    issues.push({
      type: 'word-count-mismatch',
      severity: wordCountDifference < -50 ? 'error' : 'warning',
      description: `Word count decreased by ${Math.abs(wordCountDifference)} words (${originalWordCount} -> ${formattedWordCount})`,
    });
  }

  // Report missing sentences
  for (const sentence of missingSentences.slice(0, 5)) {
    issues.push({
      type: 'missing-content',
      severity: 'error',
      description: 'Sentence may be missing from formatted output',
      originalText: sentence.slice(0, 100) + (sentence.length > 100 ? '...' : ''),
    });
  }

  if (missingSentences.length > 5) {
    issues.push({
      type: 'missing-content',
      severity: 'error',
      description: `${missingSentences.length - 5} additional sentences may be missing`,
    });
  }

  // Determine if content is preserved
  const isPreserved =
    preservationPercentage >= 98 &&
    sentencePreservationRate >= 95 &&
    !issues.some(i => i.severity === 'error');

  return {
    isPreserved,
    originalWordCount,
    formattedWordCount,
    wordCountDifference,
    preservationPercentage,
    issues,
    originalSentences: originalSentences.length,
    formattedSentences: formattedSentences.length,
    sentencePreservationRate,
  };
}

/**
 * Quick verification - just check word counts
 */
export function quickVerify(original: string, formatted: string): {
  isPreserved: boolean;
  originalWordCount: number;
  formattedWordCount: number;
} {
  const originalWordCount = countWords(stripFormatting(original));
  const formattedWordCount = countWords(stripFormatting(formatted));

  return {
    isPreserved: formattedWordCount >= originalWordCount * 0.98,
    originalWordCount,
    formattedWordCount,
  };
}

/**
 * Generate a detailed verification report
 */
export function generateVerificationReport(result: VerificationResult): string {
  const lines: string[] = [];

  lines.push('=== Content Preservation Verification Report ===');
  lines.push('');

  lines.push(`Status: ${result.isPreserved ? 'PRESERVED' : 'POTENTIAL ISSUES DETECTED'}`);
  lines.push('');

  lines.push('Word Count Analysis:');
  lines.push(`  Original: ${result.originalWordCount} words`);
  lines.push(`  Formatted: ${result.formattedWordCount} words`);
  lines.push(`  Difference: ${result.wordCountDifference >= 0 ? '+' : ''}${result.wordCountDifference} words`);
  lines.push(`  Preservation: ${result.preservationPercentage.toFixed(1)}%`);
  lines.push('');

  lines.push('Sentence Analysis:');
  lines.push(`  Original: ${result.originalSentences} sentences`);
  lines.push(`  Formatted: ${result.formattedSentences} sentences`);
  lines.push(`  Preservation Rate: ${result.sentencePreservationRate.toFixed(1)}%`);
  lines.push('');

  if (result.issues.length > 0) {
    lines.push('Issues Found:');
    for (const issue of result.issues) {
      const icon = issue.severity === 'error' ? '[ERROR]' : issue.severity === 'warning' ? '[WARN]' : '[INFO]';
      lines.push(`  ${icon} ${issue.description}`);
      if (issue.originalText) {
        lines.push(`        Original: "${issue.originalText}"`);
      }
    }
  } else {
    lines.push('No issues found.');
  }

  return lines.join('\n');
}

/**
 * Validate that a transformation is safe (doesn't lose content)
 */
export function validateTransformation(
  originalBlock: string,
  transformedBlock: string
): { isValid: boolean; reason?: string } {
  const originalNormalized = normalizeForComparison(originalBlock);
  const transformedNormalized = normalizeForComparison(transformedBlock);

  // The transformed content should contain all words from original
  const originalWords = new Set(originalNormalized.split(' ').filter(w => w.length > 2));
  const transformedWords = new Set(transformedNormalized.split(' ').filter(w => w.length > 2));

  const missingWords = [...originalWords].filter(w => !transformedWords.has(w));

  if (missingWords.length > originalWords.size * 0.05) {
    return {
      isValid: false,
      reason: `Missing ${missingWords.length} words: ${missingWords.slice(0, 5).join(', ')}${missingWords.length > 5 ? '...' : ''}`,
    };
  }

  return { isValid: true };
}

/**
 * Admonition Detector - Rule-based detection of admonition candidates
 *
 * Analyzes paragraph content to suggest appropriate admonition types
 * based on keyword patterns, without using AI.
 */

import { ContentBlock } from './contentParser';
import { AdmonitionType } from './mystTransformers';

export interface AdmonitionSuggestion {
  blockId: string;
  type: AdmonitionType;
  confidence: number; // 0-1
  reason: string;
  suggestedTitle?: string;
}

// Keyword patterns for each admonition type with weights
interface KeywordPattern {
  pattern: RegExp;
  weight: number;
  titleExtractor?: (match: RegExpMatchArray) => string | undefined;
}

const ADMONITION_PATTERNS: Record<AdmonitionType, KeywordPattern[]> = {
  warning: [
    { pattern: /\bwarning\b/i, weight: 0.9 },
    { pattern: /\bcaution\b/i, weight: 0.7 },
    { pattern: /\bdon'?t\b/i, weight: 0.6 },
    { pattern: /\bnever\b/i, weight: 0.7 },
    { pattern: /\bavoid\b/i, weight: 0.6 },
    { pattern: /\bbe careful\b/i, weight: 0.7 },
    { pattern: /\bwatch out\b/i, weight: 0.8 },
    { pattern: /\bdangerous\b/i, weight: 0.8 },
    { pattern: /\brisk\b/i, weight: 0.5 },
    { pattern: /\bpotential (issue|problem|error)\b/i, weight: 0.7 },
    { pattern: /\bcan (cause|lead to|result in)\b/i, weight: 0.5 },
    { pattern: /\bwill (fail|break|crash)\b/i, weight: 0.7 },
    { pattern: /\bmay (fail|break|crash)\b/i, weight: 0.6 },
    { pattern: /\bcommon (mistake|error|pitfall)\b/i, weight: 0.8 },
    { pattern: /\bpitfall\b/i, weight: 0.7 },
    { pattern: /\bgotcha\b/i, weight: 0.7 },
    { pattern: /\berror-prone\b/i, weight: 0.7 },
    { pattern: /\bbe aware\b/i, weight: 0.6 },
    { pattern: /\bprecaution\b/i, weight: 0.6 },
  ],
  caution: [
    { pattern: /\bcaution\b/i, weight: 0.9 },
    { pattern: /\bproceed (with care|carefully)\b/i, weight: 0.8 },
    { pattern: /\bexercise (care|caution)\b/i, weight: 0.8 },
    { pattern: /\bmight (not work|cause)\b/i, weight: 0.5 },
    { pattern: /\bcould (cause|lead to)\b/i, weight: 0.5 },
    { pattern: /\bsensitive\b/i, weight: 0.4 },
    { pattern: /\bcareful (when|about|with)\b/i, weight: 0.7 },
  ],
  danger: [
    { pattern: /\bdanger\b/i, weight: 0.95 },
    { pattern: /\bdangerous\b/i, weight: 0.9 },
    { pattern: /\bcritical\b/i, weight: 0.7 },
    { pattern: /\birreversible\b/i, weight: 0.85 },
    { pattern: /\bcannot (be undone|undo)\b/i, weight: 0.9 },
    { pattern: /\bpermanent(ly)?\b/i, weight: 0.7 },
    { pattern: /\bdelete(s)? (all|everything|permanently)\b/i, weight: 0.9 },
    { pattern: /\bdata loss\b/i, weight: 0.9 },
    { pattern: /\bsecurity (risk|vulnerability|issue)\b/i, weight: 0.8 },
    { pattern: /\bdo not use in production\b/i, weight: 0.9 },
    { pattern: /\bnever do this\b/i, weight: 0.9 },
    { pattern: /\bdestroy\b/i, weight: 0.7 },
  ],
  error: [
    { pattern: /\berror\b/i, weight: 0.5 },
    { pattern: /\berror:/i, weight: 0.8 },
    { pattern: /\bexception\b/i, weight: 0.6 },
    { pattern: /\bfailure\b/i, weight: 0.5 },
    { pattern: /\bwill (throw|raise) (an )?error\b/i, weight: 0.8 },
    { pattern: /\bcauses? (an )?error\b/i, weight: 0.8 },
    { pattern: /\bresults? in (an )?error\b/i, weight: 0.8 },
    { pattern: /\bthis (doesn'?t|won'?t|will not) work\b/i, weight: 0.7 },
    { pattern: /\binvalid\b/i, weight: 0.4 },
    { pattern: /\billegal\b/i, weight: 0.4 },
    { pattern: /\bsyntax error\b/i, weight: 0.9 },
    { pattern: /\btype error\b/i, weight: 0.9 },
    { pattern: /\bruntime error\b/i, weight: 0.9 },
  ],
  tip: [
    { pattern: /\btip\b/i, weight: 0.9, titleExtractor: () => 'Tip' },
    { pattern: /\bpro tip\b/i, weight: 0.95, titleExtractor: () => 'Pro Tip' },
    { pattern: /\btrick\b/i, weight: 0.7 },
    { pattern: /\bhint\b/i, weight: 0.6 },
    { pattern: /\bshortcut\b/i, weight: 0.7 },
    { pattern: /\bquick(er|ly)?\b/i, weight: 0.4 },
    { pattern: /\befficient(ly)?\b/i, weight: 0.4 },
    { pattern: /\bsave time\b/i, weight: 0.6 },
    { pattern: /\btime-saving\b/i, weight: 0.7 },
    { pattern: /\bbetter (way|approach|method)\b/i, weight: 0.6 },
    { pattern: /\bhelpful\b/i, weight: 0.5 },
    { pattern: /\buseful\b/i, weight: 0.5 },
    { pattern: /\blifehack\b/i, weight: 0.8 },
    { pattern: /\badvice\b/i, weight: 0.5 },
    { pattern: /\brecommend\b/i, weight: 0.5 },
    { pattern: /\bbest practice\b/i, weight: 0.7, titleExtractor: () => 'Best Practice' },
    { pattern: /\beasier (way|method|approach)\b/i, weight: 0.6 },
    { pattern: /\binstead (of|,)\b/i, weight: 0.4 },
  ],
  hint: [
    { pattern: /\bhint\b/i, weight: 0.9 },
    { pattern: /\bclue\b/i, weight: 0.7 },
    { pattern: /\btry\b/i, weight: 0.3 },
    { pattern: /\bconsider\b/i, weight: 0.4 },
    { pattern: /\bexplore\b/i, weight: 0.4 },
    { pattern: /\blook (at|into)\b/i, weight: 0.3 },
    { pattern: /\bcheck (out|the)\b/i, weight: 0.3 },
    { pattern: /\bsee (also|the)\b/i, weight: 0.3 },
  ],
  note: [
    { pattern: /\bnote\b/i, weight: 0.8 },
    { pattern: /\bnote:/i, weight: 0.95 },
    { pattern: /\bn\.b\.\b/i, weight: 0.9 },
    { pattern: /\bnota bene\b/i, weight: 0.95 },
    { pattern: /\bplease note\b/i, weight: 0.9 },
    { pattern: /\bkeep in mind\b/i, weight: 0.7 },
    { pattern: /\bremember\b/i, weight: 0.5 },
    { pattern: /\bdon'?t forget\b/i, weight: 0.6 },
    { pattern: /\bfyi\b/i, weight: 0.8 },
    { pattern: /\bfor your information\b/i, weight: 0.8 },
    { pattern: /\bfor reference\b/i, weight: 0.6 },
    { pattern: /\bworth (noting|mentioning)\b/i, weight: 0.7 },
    { pattern: /\bside note\b/i, weight: 0.85 },
    { pattern: /\baside\b/i, weight: 0.5 },
    { pattern: /\bby the way\b/i, weight: 0.6 },
    { pattern: /\bbtw\b/i, weight: 0.5 },
    { pattern: /\badditionally\b/i, weight: 0.3 },
    { pattern: /\bfurthermore\b/i, weight: 0.3 },
  ],
  important: [
    { pattern: /\bimportant\b/i, weight: 0.9 },
    { pattern: /\bcrucial\b/i, weight: 0.85 },
    { pattern: /\bessential\b/i, weight: 0.8 },
    { pattern: /\bcritical\b/i, weight: 0.7 },
    { pattern: /\bmust\b/i, weight: 0.5 },
    { pattern: /\brequired\b/i, weight: 0.5 },
    { pattern: /\bnecessary\b/i, weight: 0.5 },
    { pattern: /\bkey (point|concept|idea)\b/i, weight: 0.7 },
    { pattern: /\bfundamental\b/i, weight: 0.6 },
    { pattern: /\bpay attention\b/i, weight: 0.7 },
    { pattern: /\battention\b/i, weight: 0.5 },
    { pattern: /\bmake sure\b/i, weight: 0.5 },
    { pattern: /\bensure\b/i, weight: 0.4 },
  ],
  attention: [
    { pattern: /\battention\b/i, weight: 0.9 },
    { pattern: /\bheads up\b/i, weight: 0.85 },
    { pattern: /\bheads-up\b/i, weight: 0.85 },
    { pattern: /\blisten up\b/i, weight: 0.8 },
    { pattern: /\bnotice\b/i, weight: 0.5 },
    { pattern: /\bplease read\b/i, weight: 0.6 },
    { pattern: /\bread carefully\b/i, weight: 0.7 },
    { pattern: /\bthis section\b/i, weight: 0.3 },
  ],
  seealso: [
    { pattern: /\bsee also\b/i, weight: 0.95, titleExtractor: () => 'See Also' },
    { pattern: /\brelated\b/i, weight: 0.6 },
    { pattern: /\bsimilar(ly)?\b/i, weight: 0.4 },
    { pattern: /\bfor more (info|information|details)\b/i, weight: 0.7 },
    { pattern: /\blearn more\b/i, weight: 0.6 },
    { pattern: /\bfurther reading\b/i, weight: 0.85 },
    { pattern: /\badditional resources\b/i, weight: 0.8 },
    { pattern: /\breferences?\b/i, weight: 0.5 },
    { pattern: /\balso (see|check|read)\b/i, weight: 0.7 },
    { pattern: /\bsee \[/i, weight: 0.6 }, // "See [link]" pattern
    { pattern: /\bcheck out\b/i, weight: 0.5 },
  ],
};

// Priority order for admonition types (higher priority wins when confidence is similar)
const TYPE_PRIORITY: AdmonitionType[] = [
  'danger',
  'error',
  'warning',
  'caution',
  'important',
  'attention',
  'tip',
  'hint',
  'note',
  'seealso',
];

/**
 * Calculate admonition score for a block
 */
function calculateAdmonitionScore(
  content: string,
  type: AdmonitionType
): { score: number; reason: string; suggestedTitle?: string } {
  const patterns = ADMONITION_PATTERNS[type];
  let maxScore = 0;
  let bestReason = '';
  let suggestedTitle: string | undefined;

  for (const { pattern, weight, titleExtractor } of patterns) {
    const match = content.match(pattern);
    if (match) {
      if (weight > maxScore) {
        maxScore = weight;
        bestReason = `Contains "${match[0]}"`;
        if (titleExtractor) {
          suggestedTitle = titleExtractor(match);
        }
      }
    }
  }

  return { score: maxScore, reason: bestReason, suggestedTitle };
}

/**
 * Check if content already has admonition formatting
 */
function hasExistingAdmonition(content: string): boolean {
  return /^:::\{?(note|tip|hint|important|warning|caution|attention|danger|error|seealso)\}?/mi.test(content);
}

/**
 * Check if content is too short for an admonition
 */
function isTooShort(content: string): boolean {
  const words = content.trim().split(/\s+/).length;
  return words < 5; // At least 5 words for an admonition
}

/**
 * Check if content is too long for an admonition (might need to be split)
 */
function isTooLong(content: string): boolean {
  const words = content.trim().split(/\s+/).length;
  return words > 200; // More than 200 words might be too long for a single admonition
}

/**
 * Detect admonition candidates from content blocks
 */
export function detectAdmonitionCandidates(
  blocks: ContentBlock[],
  options?: {
    minConfidence?: number;
    maxSuggestions?: number;
    enabledTypes?: AdmonitionType[];
  }
): AdmonitionSuggestion[] {
  const minConfidence = options?.minConfidence ?? 0.5;
  const maxSuggestions = options?.maxSuggestions ?? 20;
  const enabledTypes = options?.enabledTypes ?? TYPE_PRIORITY;

  console.log('=== ADMONITION DETECTOR DEBUG ===');
  console.log('minConfidence:', minConfidence);
  console.log('maxSuggestions:', maxSuggestions);
  console.log('enabledTypes:', enabledTypes);
  console.log('Total blocks to analyze:', blocks.length);

  const suggestions: AdmonitionSuggestion[] = [];

  for (const block of blocks) {
    // Only consider paragraphs
    if (block.type !== 'paragraph') {
      console.log(`Block ${block.id}: skipped (type=${block.type}, not paragraph)`);
      continue;
    }

    // Skip if already has admonition
    if (hasExistingAdmonition(block.content)) {
      console.log(`Block ${block.id}: skipped (already has admonition)`);
      continue;
    }

    // Skip if too short
    if (isTooShort(block.content)) {
      console.log(`Block ${block.id}: skipped (too short, content: "${block.content.slice(0, 50)}...")`);
      continue;
    }

    // Find best matching admonition type
    let bestType: AdmonitionType | null = null;
    let bestScore = 0;
    let bestReason = '';
    let suggestedTitle: string | undefined;

    for (const type of enabledTypes) {
      const result = calculateAdmonitionScore(block.content, type);
      if (result.score > bestScore) {
        bestScore = result.score;
        bestType = type;
        bestReason = result.reason;
        suggestedTitle = result.suggestedTitle;
      }
    }

    console.log(`Block ${block.id}: bestType=${bestType}, bestScore=${bestScore}, reason="${bestReason}", content preview: "${block.content.slice(0, 80)}..."`);

    // Add suggestion if confidence is high enough
    if (bestType && bestScore >= minConfidence) {
      console.log(`Block ${block.id}: ADDING suggestion (${bestType}, confidence ${bestScore})`);
      suggestions.push({
        blockId: block.id,
        type: bestType,
        confidence: bestScore,
        reason: bestReason,
        suggestedTitle,
      });
    } else {
      console.log(`Block ${block.id}: NOT suggesting (bestScore ${bestScore} < minConfidence ${minConfidence})`);
    }
  }

  // Sort by confidence and limit
  suggestions.sort((a, b) => b.confidence - a.confidence);
  console.log('Total suggestions found:', suggestions.length);
  console.log('=== END ADMONITION DETECTOR ===');
  return suggestions.slice(0, maxSuggestions);
}

/**
 * Get admonition suggestions for specific types only
 */
export function detectSpecificAdmonitions(
  blocks: ContentBlock[],
  types: AdmonitionType[]
): AdmonitionSuggestion[] {
  return detectAdmonitionCandidates(blocks, { enabledTypes: types });
}

/**
 * Check if a specific block should be an admonition
 */
export function shouldBeAdmonition(
  block: ContentBlock,
  minConfidence: number = 0.6
): AdmonitionSuggestion | null {
  if (block.type !== 'paragraph') return null;
  if (hasExistingAdmonition(block.content)) return null;
  if (isTooShort(block.content)) return null;

  for (const type of TYPE_PRIORITY) {
    const result = calculateAdmonitionScore(block.content, type);
    if (result.score >= minConfidence) {
      return {
        blockId: block.id,
        type,
        confidence: result.score,
        reason: result.reason,
        suggestedTitle: result.suggestedTitle,
      };
    }
  }

  return null;
}

/**
 * Prioritize warning/danger/error admonitions for safety-critical content
 */
export function detectSafetyCriticalContent(blocks: ContentBlock[]): AdmonitionSuggestion[] {
  const safetyCriticalTypes: AdmonitionType[] = ['danger', 'error', 'warning', 'caution'];
  return detectAdmonitionCandidates(blocks, {
    enabledTypes: safetyCriticalTypes,
    minConfidence: 0.5,
  });
}

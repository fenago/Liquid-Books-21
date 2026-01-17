/**
 * Chapter Analyzer - Holistic analysis of chapter structure
 *
 * Analyzes the entire chapter to understand:
 * - Section hierarchy and flow
 * - Content patterns (code → explanation, intro → body → summary)
 * - Key concepts and themes
 * - Optimal placement opportunities for MyST features
 */

import { ContentBlock, parseContent, countWords } from './contentParser';

export interface ChapterSection {
  id: string;
  title: string;
  level: number;
  startBlockIndex: number;
  endBlockIndex: number;
  wordCount: number;
  hasCode: boolean;
  hasList: boolean;
  hasQuote: boolean;
  blocks: ContentBlock[];
}

export interface ContentPattern {
  type: 'code-explanation' | 'intro-body' | 'concept-example' | 'warning-context' | 'tip-context' | 'reference-section';
  blockIds: string[];
  confidence: number;
  description: string;
}

export interface ChapterStructure {
  title: string;
  totalWordCount: number;
  totalBlocks: number;
  sections: ChapterSection[];
  patterns: ContentPattern[];
  codeBlockCount: number;
  listCount: number;
  paragraphCount: number;
  headingCount: number;
  estimatedReadingTime: number; // minutes
  complexity: 'simple' | 'moderate' | 'complex';
  suggestedFeatureCount: FeatureDistribution;
}

export interface FeatureDistribution {
  notes: number;
  tips: number;
  warnings: number;
  important: number;
  cautions: number;
  seeAlso: number;
  cards: number;
  dropdowns: number;
}

/**
 * Analyze chapter structure holistically
 */
export function analyzeChapter(content: string, chapterTitle?: string): ChapterStructure {
  const parsed = parseContent(content);
  const blocks = parsed.blocks;

  // Extract sections based on headings
  const sections = extractSections(blocks);

  // Detect content patterns
  const patterns = detectContentPatterns(blocks);

  // Count block types
  const codeBlockCount = blocks.filter(b => b.type === 'code').length;
  const listCount = blocks.filter(b => b.type === 'list').length;
  const paragraphCount = blocks.filter(b => b.type === 'paragraph').length;
  const headingCount = blocks.filter(b => b.type === 'heading').length;

  // Calculate complexity based on code, sections, and word count
  const totalWordCount = parsed.wordCount;
  const complexity = calculateComplexity(totalWordCount, codeBlockCount, sections.length);

  // Estimate reading time (average 200 words/minute, slower for code)
  const codeWords = blocks
    .filter(b => b.type === 'code')
    .reduce((sum, b) => sum + countWords(b.content), 0);
  const textWords = totalWordCount - codeWords;
  const estimatedReadingTime = Math.ceil((textWords / 200) + (codeWords / 50));

  // Calculate suggested feature distribution
  const suggestedFeatureCount = calculateFeatureDistribution(
    totalWordCount,
    sections.length,
    patterns,
    complexity
  );

  return {
    title: chapterTitle || extractTitle(blocks) || 'Untitled Chapter',
    totalWordCount,
    totalBlocks: blocks.length,
    sections,
    patterns,
    codeBlockCount,
    listCount,
    paragraphCount,
    headingCount,
    estimatedReadingTime,
    complexity,
    suggestedFeatureCount,
  };
}

/**
 * Extract sections from content based on headings
 */
function extractSections(blocks: ContentBlock[]): ChapterSection[] {
  const sections: ChapterSection[] = [];
  let currentSection: ChapterSection | null = null;
  let sectionId = 0;

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];

    if (block.type === 'heading') {
      // Save previous section
      if (currentSection) {
        currentSection.endBlockIndex = i - 1;
        currentSection.wordCount = currentSection.blocks.reduce(
          (sum, b) => sum + countWords(b.content), 0
        );
        sections.push(currentSection);
      }

      // Start new section
      currentSection = {
        id: `section-${++sectionId}`,
        title: block.content.replace(/^#+\s*/, ''),
        level: block.metadata.headingLevel || 1,
        startBlockIndex: i,
        endBlockIndex: i,
        wordCount: 0,
        hasCode: false,
        hasList: false,
        hasQuote: false,
        blocks: [block],
      };
    } else if (currentSection) {
      currentSection.blocks.push(block);
      if (block.type === 'code') currentSection.hasCode = true;
      if (block.type === 'list') currentSection.hasList = true;
      if (block.type === 'quote') currentSection.hasQuote = true;
    } else {
      // Content before first heading - create implicit section
      currentSection = {
        id: `section-${++sectionId}`,
        title: 'Introduction',
        level: 0,
        startBlockIndex: i,
        endBlockIndex: i,
        wordCount: 0,
        hasCode: block.type === 'code',
        hasList: block.type === 'list',
        hasQuote: block.type === 'quote',
        blocks: [block],
      };
    }
  }

  // Save last section
  if (currentSection) {
    currentSection.endBlockIndex = blocks.length - 1;
    currentSection.wordCount = currentSection.blocks.reduce(
      (sum, b) => sum + countWords(b.content), 0
    );
    sections.push(currentSection);
  }

  return sections;
}

/**
 * Detect content patterns that suggest formatting opportunities
 */
function detectContentPatterns(blocks: ContentBlock[]): ContentPattern[] {
  const patterns: ContentPattern[] = [];

  for (let i = 0; i < blocks.length; i++) {
    const block = blocks[i];
    const prevBlock = blocks[i - 1];
    const nextBlock = blocks[i + 1];

    // Pattern: Code followed by explanation
    if (block.type === 'code' && nextBlock?.type === 'paragraph') {
      const explanation = nextBlock.content.toLowerCase();
      if (
        explanation.includes('this') ||
        explanation.includes('the above') ||
        explanation.includes('here') ||
        explanation.includes('output') ||
        explanation.includes('result')
      ) {
        patterns.push({
          type: 'code-explanation',
          blockIds: [block.id, nextBlock.id],
          confidence: 0.7,
          description: 'Code block followed by explanation paragraph',
        });
      }
    }

    // Pattern: Warning context (mentions risk, danger, avoid)
    if (block.type === 'paragraph') {
      const content = block.content.toLowerCase();
      if (
        content.includes('warning') ||
        content.includes('caution') ||
        content.includes('danger') ||
        content.includes('avoid') ||
        content.includes('never') ||
        content.includes('do not') ||
        content.includes("don't")
      ) {
        patterns.push({
          type: 'warning-context',
          blockIds: [block.id],
          confidence: 0.8,
          description: 'Paragraph contains warning-related keywords',
        });
      }
    }

    // Pattern: Tip context (mentions tip, trick, shortcut, best practice)
    if (block.type === 'paragraph') {
      const content = block.content.toLowerCase();
      if (
        content.includes('tip') ||
        content.includes('trick') ||
        content.includes('shortcut') ||
        content.includes('best practice') ||
        content.includes('pro tip') ||
        content.includes('recommend')
      ) {
        patterns.push({
          type: 'tip-context',
          blockIds: [block.id],
          confidence: 0.8,
          description: 'Paragraph contains tip-related keywords',
        });
      }
    }

    // Pattern: Reference section (links, "see also", "learn more")
    if (block.type === 'paragraph') {
      const content = block.content.toLowerCase();
      if (
        content.includes('see also') ||
        content.includes('learn more') ||
        content.includes('further reading') ||
        content.includes('for more information') ||
        content.includes('reference')
      ) {
        patterns.push({
          type: 'reference-section',
          blockIds: [block.id],
          confidence: 0.75,
          description: 'Paragraph contains reference/see-also keywords',
        });
      }
    }

    // Pattern: Concept followed by example
    if (block.type === 'paragraph' && nextBlock?.type === 'code') {
      const content = block.content.toLowerCase();
      if (
        content.includes('example') ||
        content.includes('for instance') ||
        content.includes('consider') ||
        content.includes('let\'s') ||
        content.includes('following')
      ) {
        patterns.push({
          type: 'concept-example',
          blockIds: [block.id, nextBlock.id],
          confidence: 0.7,
          description: 'Concept explanation followed by code example',
        });
      }
    }
  }

  return patterns;
}

/**
 * Calculate chapter complexity
 */
function calculateComplexity(
  wordCount: number,
  codeBlocks: number,
  sections: number
): 'simple' | 'moderate' | 'complex' {
  const score =
    (wordCount > 3000 ? 2 : wordCount > 1000 ? 1 : 0) +
    (codeBlocks > 5 ? 2 : codeBlocks > 2 ? 1 : 0) +
    (sections > 5 ? 2 : sections > 2 ? 1 : 0);

  if (score >= 4) return 'complex';
  if (score >= 2) return 'moderate';
  return 'simple';
}

/**
 * Calculate suggested feature distribution based on chapter analysis
 */
function calculateFeatureDistribution(
  wordCount: number,
  sectionCount: number,
  patterns: ContentPattern[],
  complexity: 'simple' | 'moderate' | 'complex'
): FeatureDistribution {
  // Base counts scaled by word count (roughly 1 feature per 500 words)
  const baseCount = Math.max(1, Math.floor(wordCount / 500));

  // Count pattern types
  const warningPatterns = patterns.filter(p => p.type === 'warning-context').length;
  const tipPatterns = patterns.filter(p => p.type === 'tip-context').length;
  const referencePatterns = patterns.filter(p => p.type === 'reference-section').length;
  const codeExplanationPatterns = patterns.filter(p => p.type === 'code-explanation').length;

  // Distribute features based on patterns and complexity
  const multiplier = complexity === 'complex' ? 1.5 : complexity === 'moderate' ? 1.2 : 1;

  return {
    notes: Math.max(1, Math.round(baseCount * multiplier * 0.3) + Math.floor(codeExplanationPatterns / 2)),
    tips: Math.max(0, Math.round(baseCount * 0.2) + tipPatterns),
    warnings: Math.max(0, warningPatterns),
    important: Math.max(0, Math.round(baseCount * 0.1)),
    cautions: Math.max(0, Math.floor(warningPatterns / 2)),
    seeAlso: Math.max(0, referencePatterns),
    cards: Math.max(0, Math.round(baseCount * 0.1)),
    dropdowns: Math.max(0, Math.round(codeExplanationPatterns * 0.3)),
  };
}

/**
 * Extract title from first heading
 */
function extractTitle(blocks: ContentBlock[]): string | null {
  const firstHeading = blocks.find(b => b.type === 'heading');
  if (firstHeading) {
    return firstHeading.content.replace(/^#+\s*/, '');
  }
  return null;
}

/**
 * Create a summary of the chapter for AI planning
 */
export function createChapterSummary(structure: ChapterStructure): string {
  const lines: string[] = [];

  lines.push(`# Chapter Analysis: ${structure.title}`);
  lines.push('');
  lines.push(`**Overview:**`);
  lines.push(`- Word count: ${structure.totalWordCount}`);
  lines.push(`- Sections: ${structure.sections.length}`);
  lines.push(`- Code blocks: ${structure.codeBlockCount}`);
  lines.push(`- Complexity: ${structure.complexity}`);
  lines.push(`- Est. reading time: ${structure.estimatedReadingTime} min`);
  lines.push('');

  lines.push(`**Section Outline:**`);
  for (const section of structure.sections) {
    const indent = '  '.repeat(Math.max(0, section.level - 1));
    const features = [
      section.hasCode ? 'code' : '',
      section.hasList ? 'list' : '',
      section.hasQuote ? 'quote' : '',
    ].filter(Boolean).join(', ');
    lines.push(`${indent}- ${section.title} (${section.wordCount} words${features ? `, has: ${features}` : ''})`);
  }
  lines.push('');

  lines.push(`**Detected Patterns:**`);
  const patternCounts = new Map<string, number>();
  for (const pattern of structure.patterns) {
    patternCounts.set(pattern.type, (patternCounts.get(pattern.type) || 0) + 1);
  }
  for (const [type, count] of patternCounts) {
    lines.push(`- ${type}: ${count} occurrences`);
  }
  lines.push('');

  lines.push(`**Suggested Feature Distribution:**`);
  const dist = structure.suggestedFeatureCount;
  lines.push(`- Notes: ${dist.notes}`);
  lines.push(`- Tips: ${dist.tips}`);
  lines.push(`- Warnings: ${dist.warnings}`);
  lines.push(`- Important: ${dist.important}`);
  lines.push(`- See Also: ${dist.seeAlso}`);
  lines.push(`- Cards: ${dist.cards}`);
  lines.push(`- Dropdowns: ${dist.dropdowns}`);

  return lines.join('\n');
}

/**
 * Get block context for AI planning (what comes before/after)
 */
export function getBlockContext(
  blocks: ContentBlock[],
  blockId: string,
  contextSize: number = 1
): { before: ContentBlock[]; current: ContentBlock | null; after: ContentBlock[] } {
  const index = blocks.findIndex(b => b.id === blockId);
  if (index === -1) {
    return { before: [], current: null, after: [] };
  }

  return {
    before: blocks.slice(Math.max(0, index - contextSize), index),
    current: blocks[index],
    after: blocks.slice(index + 1, index + 1 + contextSize),
  };
}

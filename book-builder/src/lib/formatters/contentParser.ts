/**
 * Content Parser - Rule-based parsing of raw content into typed blocks
 *
 * This module parses raw text content into structured blocks that can be
 * transformed with MyST formatting while preserving 100% of the original content.
 */

export type BlockType =
  | 'paragraph'
  | 'code'
  | 'list'
  | 'quote'
  | 'heading'
  | 'table'
  | 'math'
  | 'empty';

export interface ContentBlock {
  id: string;
  type: BlockType;
  content: string;
  rawContent: string; // Original content exactly as it appeared
  metadata: BlockMetadata;
  startLine: number;
  endLine: number;
}

export interface BlockMetadata {
  language?: string;
  listType?: 'bullet' | 'numbered';
  headingLevel?: number;
  isFenced?: boolean;
  isIndented?: boolean;
  quoteDepth?: number;
  mathType?: 'inline' | 'block' | 'dollar';
}

export interface ParsedContent {
  blocks: ContentBlock[];
  rawContent: string;
  totalLines: number;
  wordCount: number;
}

// Generate a unique ID for each block
let blockIdCounter = 0;
function generateBlockId(): string {
  return `block-${++blockIdCounter}`;
}

// Reset counter (useful for testing)
export function resetBlockIdCounter(): void {
  blockIdCounter = 0;
}

/**
 * Count words in a string (handles multiple whitespace and special chars)
 */
export function countWords(text: string): number {
  const stripped = text
    .replace(/```[\s\S]*?```/g, match => {
      // Keep code content but not the fence markers for word counting
      const content = match.slice(3, -3).replace(/^\w+\n?/, ''); // Remove language identifier
      return content;
    })
    .replace(/:::\{?\w+\}?/g, '') // Remove MyST directive markers
    .replace(/:::/g, '')
    .replace(/[#*_`>\[\]\(\)\{\}]/g, ' ') // Replace markdown chars with space
    .trim();

  if (!stripped) return 0;
  return stripped.split(/\s+/).filter(word => word.length > 0).length;
}

/**
 * Detect if a line is a heading
 */
function isHeading(line: string): { isHeading: boolean; level: number } {
  const match = line.match(/^(#{1,6})\s+/);
  if (match) {
    return { isHeading: true, level: match[1].length };
  }
  return { isHeading: false, level: 0 };
}

/**
 * Detect if a line starts a fenced code block
 */
function isFencedCodeStart(line: string): { isStart: boolean; language: string } {
  const match = line.match(/^(`{3,}|~{3,})(\w+)?/);
  if (match) {
    return { isStart: true, language: match[2] || '' };
  }
  return { isStart: false, language: '' };
}

/**
 * Detect if a line ends a fenced code block
 */
function isFencedCodeEnd(line: string, fenceChar: string, fenceLength: number): boolean {
  const regex = new RegExp(`^${fenceChar}{${fenceLength},}\\s*$`);
  return regex.test(line);
}

/**
 * Detect if a line is a quote
 */
function isQuote(line: string): { isQuote: boolean; depth: number; content: string } {
  const match = line.match(/^((?:>\s*)+)/);
  if (match) {
    const depth = (match[1].match(/>/g) || []).length;
    const content = line.slice(match[1].length);
    return { isQuote: true, depth, content };
  }
  return { isQuote: false, depth: 0, content: line };
}

/**
 * Detect if a line is a list item
 */
function isListItem(line: string): { isList: boolean; type: 'bullet' | 'numbered'; content: string; indent: number } {
  // Bullet list: -, *, +
  const bulletMatch = line.match(/^(\s*)([-*+])\s+(.*)$/);
  if (bulletMatch) {
    return {
      isList: true,
      type: 'bullet',
      content: bulletMatch[3],
      indent: bulletMatch[1].length
    };
  }

  // Numbered list: 1., 2., etc.
  const numberedMatch = line.match(/^(\s*)(\d+)\.\s+(.*)$/);
  if (numberedMatch) {
    return {
      isList: true,
      type: 'numbered',
      content: numberedMatch[3],
      indent: numberedMatch[1].length
    };
  }

  return { isList: false, type: 'bullet', content: line, indent: 0 };
}

/**
 * Detect if a line is part of a table
 */
function isTableLine(line: string): boolean {
  // Simple markdown table detection
  return /^\|.*\|$/.test(line.trim()) || /^[\s|:-]+$/.test(line.trim());
}

/**
 * Detect if a line starts/is a math block
 */
function isMathBlock(line: string): { isMath: boolean; type: 'block' | 'inline'; isStart?: boolean; isEnd?: boolean } {
  // Block math: $$ or ```{math}
  if (line.trim() === '$$') {
    return { isMath: true, type: 'block', isStart: true, isEnd: true };
  }
  if (line.trim().startsWith('```{math}')) {
    return { isMath: true, type: 'block', isStart: true };
  }
  return { isMath: false, type: 'inline' };
}

/**
 * Detect if a line is a MyST directive start
 */
function isMystDirectiveStart(line: string): boolean {
  return /^:{2,3}\{[\w-]+\}/.test(line.trim()) || /^`{3,}\{[\w-]+\}/.test(line.trim());
}

/**
 * Detect if a line is a MyST directive end
 */
function isMystDirectiveEnd(line: string): boolean {
  return /^:{2,3}$/.test(line.trim()) || /^`{3,}$/.test(line.trim());
}

/**
 * Check if line is empty or whitespace only
 */
function isEmptyLine(line: string): boolean {
  return line.trim() === '';
}

/**
 * Parse raw content into structured blocks
 */
export function parseContent(rawContent: string): ParsedContent {
  const lines = rawContent.split('\n');
  const blocks: ContentBlock[] = [];
  let currentBlock: ContentBlock | null = null;
  let inFencedCode = false;
  let fenceChar = '';
  let fenceLength = 0;
  let inMathBlock = false;
  let inDirective = false;
  let directiveNestingLevel = 0;

  function finalizeBlock() {
    if (currentBlock && currentBlock.content.trim()) {
      currentBlock.rawContent = currentBlock.content;
      blocks.push(currentBlock);
    }
    currentBlock = null;
  }

  function startNewBlock(type: BlockType, line: string, lineIndex: number, metadata: BlockMetadata = {}): ContentBlock {
    return {
      id: generateBlockId(),
      type,
      content: line,
      rawContent: line,
      metadata,
      startLine: lineIndex,
      endLine: lineIndex,
    };
  }

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];

    // Handle fenced code blocks
    if (!inFencedCode && !inDirective) {
      const fencedStart = isFencedCodeStart(line);
      if (fencedStart.isStart && !line.includes('{')) {
        // Pure code block (not a directive like ```{mermaid})
        finalizeBlock();
        inFencedCode = true;
        fenceChar = line[0];
        fenceLength = (line.match(new RegExp(`^${fenceChar}+`)) || [''])[0].length;
        currentBlock = startNewBlock('code', line + '\n', i, {
          language: fencedStart.language,
          isFenced: true
        });
        continue;
      }
    }

    if (inFencedCode) {
      currentBlock!.content += line + '\n';
      currentBlock!.endLine = i;
      if (isFencedCodeEnd(line, fenceChar, fenceLength)) {
        inFencedCode = false;
        finalizeBlock();
      }
      continue;
    }

    // Handle MyST directives (preserve as-is but track nesting)
    if (isMystDirectiveStart(line)) {
      finalizeBlock();
      inDirective = true;
      directiveNestingLevel = (line.match(/^:{2,}/)?.[0] || line.match(/^`{3,}/)?.[0] || '').length;
      currentBlock = startNewBlock('paragraph', line + '\n', i);
      continue;
    }

    if (inDirective) {
      currentBlock!.content += line + '\n';
      currentBlock!.endLine = i;
      // Check for directive end at same nesting level
      const endMatch = line.match(/^(:{2,}|`{3,})$/);
      if (endMatch && endMatch[1].length === directiveNestingLevel) {
        inDirective = false;
        directiveNestingLevel = 0;
        finalizeBlock();
      }
      continue;
    }

    // Handle math blocks
    const mathCheck = isMathBlock(line);
    if (mathCheck.isMath && mathCheck.type === 'block') {
      if (!inMathBlock) {
        finalizeBlock();
        inMathBlock = true;
        currentBlock = startNewBlock('math', line + '\n', i, { mathType: 'block' });
      } else {
        currentBlock!.content += line + '\n';
        currentBlock!.endLine = i;
        inMathBlock = false;
        finalizeBlock();
      }
      continue;
    }

    if (inMathBlock) {
      currentBlock!.content += line + '\n';
      currentBlock!.endLine = i;
      continue;
    }

    // Handle empty lines
    if (isEmptyLine(line)) {
      finalizeBlock();
      // Don't create blocks for empty lines, but preserve them
      blocks.push({
        id: generateBlockId(),
        type: 'empty',
        content: line,
        rawContent: line,
        metadata: {},
        startLine: i,
        endLine: i,
      });
      continue;
    }

    // Handle headings
    const headingCheck = isHeading(line);
    if (headingCheck.isHeading) {
      finalizeBlock();
      currentBlock = startNewBlock('heading', line, i, { headingLevel: headingCheck.level });
      finalizeBlock();
      continue;
    }

    // Handle quotes
    const quoteCheck = isQuote(line);
    if (quoteCheck.isQuote) {
      if (currentBlock?.type === 'quote') {
        currentBlock.content += '\n' + line;
        currentBlock.endLine = i;
      } else {
        finalizeBlock();
        currentBlock = startNewBlock('quote', line, i, { quoteDepth: quoteCheck.depth });
      }
      continue;
    }

    // Handle lists
    const listCheck = isListItem(line);
    if (listCheck.isList) {
      if (currentBlock?.type === 'list' && currentBlock.metadata.listType === listCheck.type) {
        currentBlock.content += '\n' + line;
        currentBlock.endLine = i;
      } else {
        finalizeBlock();
        currentBlock = startNewBlock('list', line, i, { listType: listCheck.type });
      }
      continue;
    }

    // Handle tables
    if (isTableLine(line)) {
      if (currentBlock?.type === 'table') {
        currentBlock.content += '\n' + line;
        currentBlock.endLine = i;
      } else {
        finalizeBlock();
        currentBlock = startNewBlock('table', line, i);
      }
      continue;
    }

    // Default: paragraph
    if (currentBlock?.type === 'paragraph') {
      currentBlock.content += '\n' + line;
      currentBlock.endLine = i;
    } else {
      finalizeBlock();
      currentBlock = startNewBlock('paragraph', line, i);
    }
  }

  // Finalize any remaining block
  finalizeBlock();

  return {
    blocks,
    rawContent,
    totalLines: lines.length,
    wordCount: countWords(rawContent),
  };
}

/**
 * Reconstruct content from blocks (for verification)
 */
export function reconstructContent(blocks: ContentBlock[]): string {
  return blocks.map(block => {
    // Handle trailing newlines consistently
    const content = block.content.endsWith('\n')
      ? block.content.slice(0, -1)
      : block.content;
    return content;
  }).join('\n');
}

/**
 * Get blocks of a specific type
 */
export function getBlocksByType(blocks: ContentBlock[], type: BlockType): ContentBlock[] {
  return blocks.filter(block => block.type === type);
}

/**
 * Get paragraph blocks only (most common for admonition candidates)
 */
export function getParagraphBlocks(blocks: ContentBlock[]): ContentBlock[] {
  return getBlocksByType(blocks, 'paragraph');
}

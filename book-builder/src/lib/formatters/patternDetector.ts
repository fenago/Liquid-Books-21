/**
 * Pattern Detector - Rule-based detection of code, lists, quotes, and other patterns
 *
 * Uses regex patterns to detect various content structures without AI,
 * ensuring deterministic and fast pattern detection.
 */

import { ContentBlock } from './contentParser';

export interface DetectedPattern {
  blockId: string;
  patternType: PatternType;
  confidence: number; // 0-1 confidence score
  metadata: PatternMetadata;
  suggestion?: string;
}

export type PatternType =
  | 'code'
  | 'list'
  | 'quote'
  | 'table'
  | 'math'
  | 'heading'
  | 'link'
  | 'image'
  | 'emphasis';

export interface PatternMetadata {
  language?: string;
  listType?: 'bullet' | 'numbered' | 'definition';
  headingLevel?: number;
  isInline?: boolean;
  needsFormatting?: boolean;
  existingFormat?: string;
}

// Language detection patterns
const LANGUAGE_PATTERNS: Record<string, RegExp[]> = {
  python: [
    /\b(def|class|import|from|if __name__|print\(|self\.|lambda|yield|async def|await)\b/,
    /^\s*(def|class|import|from)\s+\w+/m,
    /:$/m, // Python-style blocks end with colon
    /\bNone\b/,
    /\bTrue\b|\bFalse\b/,
  ],
  javascript: [
    /\b(const|let|var|function|=>|async|await|import|export|require\(|console\.)\b/,
    /\bfunction\s*\w*\s*\(/,
    /=>\s*[{(]/,
    /\bmodule\.exports\b/,
  ],
  typescript: [
    /\b(interface|type|enum|namespace|declare|readonly|as|implements)\b/,
    /:\s*(string|number|boolean|void|any|unknown|never|object)\b/,
    /<\w+(\s*,\s*\w+)*>/,
    /\b(public|private|protected)\s+\w+/,
  ],
  java: [
    /\b(public|private|protected|static|final|class|interface|extends|implements|void|new)\b/,
    /\bSystem\.(out|err)\./,
    /\bthrows\s+\w+/,
    /@Override\b/,
  ],
  csharp: [
    /\b(namespace|using|public|private|protected|internal|class|struct|interface|enum|override|virtual|async|await)\b/,
    /\bvar\s+\w+\s*=/,
    /\bConsole\.(WriteLine|Write|ReadLine)\b/,
    /\bnew\s+\w+\(/,
  ],
  cpp: [
    /\b(#include|#define|#ifdef|#ifndef|#endif|namespace|class|struct|template|typename|public:|private:|protected:)\b/,
    /\bstd::\w+/,
    /\b(cout|cin|endl)\b/,
    /->/,
  ],
  rust: [
    /\b(fn|let|mut|impl|struct|enum|trait|pub|mod|use|match|if let|Some|None|Ok|Err)\b/,
    /\bprintln!\(/,
    /::\s*\w+/,
    /&\s*(mut\s+)?\w+/,
  ],
  go: [
    /\b(func|package|import|struct|interface|chan|go|defer|make|range|type)\b/,
    /\bfmt\.\w+/,
    /:=\s*/,
    /\berr\s*!=\s*nil\b/,
  ],
  ruby: [
    /\b(def|end|class|module|require|puts|attr_|do\s*\|)/,
    /\bputs\b/,
    /@\w+/,
    /\|\w+\|/,
  ],
  php: [
    /\b(\$\w+|function|class|public|private|protected|echo|require|include|namespace|use)\b/,
    /<\?php/,
    /\$this->/,
    /->\w+\(/,
  ],
  sql: [
    /\b(SELECT|INSERT|UPDATE|DELETE|CREATE|DROP|ALTER|FROM|WHERE|JOIN|ON|GROUP BY|ORDER BY|HAVING|LIMIT)\b/i,
    /\bINNER\s+JOIN\b/i,
    /\bLEFT\s+(OUTER\s+)?JOIN\b/i,
    /\bCOUNT\(|\bSUM\(|\bAVG\(/i,
  ],
  html: [
    /<\/?[a-z][\w-]*(?:\s+[\w-]+(?:=["'][^"']*["'])?)*\s*\/?>/i,
    /<html|<head|<body|<div|<span|<p\s|<a\s/i,
    /<!DOCTYPE\s+html/i,
  ],
  css: [
    /\{[\s\S]*?}/,
    /\b(color|background|font-size|margin|padding|display|flex|grid):/,
    /\.[a-zA-Z][\w-]*\s*\{/,
    /#[a-fA-F0-9]{3,6}\b/,
  ],
  json: [
    /^\s*\{[\s\S]*\}\s*$/,
    /^\s*\[[\s\S]*\]\s*$/,
    /"[\w-]+"\s*:/,
  ],
  yaml: [
    /^\s*[\w-]+:\s*/m,
    /^\s*-\s+[\w-]+:/m,
    /^\s*-\s+\w+$/m,
  ],
  bash: [
    /\b(echo|export|source|if|then|else|fi|for|do|done|while|case|esac|function)\b/,
    /^\s*#!\/bin\/(ba)?sh/m,
    /\$\{?\w+\}?/,
    /\|\s*\w+/,
  ],
  shell: [
    /^\s*\$\s+\w+/m,
    /\b(npm|yarn|pip|cargo|go|git|docker|kubectl)\s+/,
    /--\w+/,
  ],
  markdown: [
    /^#{1,6}\s+/m,
    /\*\*[^*]+\*\*/,
    /\[.+\]\(.+\)/,
    /^>\s+/m,
  ],
  latex: [
    /\\(begin|end)\{[\w*]+\}/,
    /\\(frac|sqrt|sum|int|alpha|beta|gamma|delta|theta|lambda|sigma)\b/,
    /\$[^$]+\$/,
    /\\[a-zA-Z]+/,
  ],
  mermaid: [
    /\b(flowchart|sequenceDiagram|classDiagram|stateDiagram|gantt|pie|erDiagram)\b/,
    /-->/,
    /->>>/,
  ],
};

/**
 * Detect programming language from code content
 */
export function detectLanguage(code: string): { language: string; confidence: number } {
  const scores: Record<string, number> = {};

  for (const [lang, patterns] of Object.entries(LANGUAGE_PATTERNS)) {
    let matchCount = 0;
    for (const pattern of patterns) {
      if (pattern.test(code)) {
        matchCount++;
      }
    }
    if (matchCount > 0) {
      scores[lang] = matchCount / patterns.length;
    }
  }

  // Find the best match
  let bestLang = '';
  let bestScore = 0;
  for (const [lang, score] of Object.entries(scores)) {
    if (score > bestScore) {
      bestScore = score;
      bestLang = lang;
    }
  }

  // Minimum threshold for detection
  if (bestScore < 0.2) {
    return { language: '', confidence: 0 };
  }

  return { language: bestLang, confidence: bestScore };
}

/**
 * Detect if content looks like code (but isn't in a code block)
 */
export function detectUnformattedCode(content: string): { isCode: boolean; language: string; confidence: number } {
  // Check for common code indicators
  const codeIndicators = [
    /[{}\[\]();]/g,
    /\b(function|class|def|var|let|const|import|export)\b/,
    /\s{4,}\S/, // Indented content
    /\/\/.*$|\/\*[\s\S]*?\*\/|#[^!].*$/m, // Comments
    /\b\w+\s*\([^)]*\)\s*[{:;]/m, // Function definitions/calls
  ];

  let indicatorCount = 0;
  for (const pattern of codeIndicators) {
    if (pattern.test(content)) {
      indicatorCount++;
    }
  }

  if (indicatorCount >= 2) {
    const langResult = detectLanguage(content);
    return {
      isCode: true,
      language: langResult.language || 'text',
      confidence: Math.max(0.5, langResult.confidence),
    };
  }

  return { isCode: false, language: '', confidence: 0 };
}

/**
 * Detect code blocks in content
 */
export function detectCodeBlocks(blocks: ContentBlock[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  for (const block of blocks) {
    if (block.type === 'code') {
      // Already a code block, check if it has a language
      const lang = block.metadata.language || '';
      if (!lang) {
        const detected = detectLanguage(block.content);
        patterns.push({
          blockId: block.id,
          patternType: 'code',
          confidence: detected.confidence,
          metadata: {
            language: detected.language,
            needsFormatting: true,
            existingFormat: 'fenced',
          },
          suggestion: detected.language ? `Add language: ${detected.language}` : undefined,
        });
      }
    } else if (block.type === 'paragraph') {
      // Check if paragraph looks like code
      const codeCheck = detectUnformattedCode(block.content);
      if (codeCheck.isCode) {
        patterns.push({
          blockId: block.id,
          patternType: 'code',
          confidence: codeCheck.confidence,
          metadata: {
            language: codeCheck.language,
            needsFormatting: true,
          },
          suggestion: `Wrap in code block with language: ${codeCheck.language}`,
        });
      }
    }
  }

  return patterns;
}

/**
 * Detect list patterns
 */
export function detectLists(blocks: ContentBlock[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  for (const block of blocks) {
    if (block.type === 'list') {
      patterns.push({
        blockId: block.id,
        patternType: 'list',
        confidence: 1.0,
        metadata: {
          listType: block.metadata.listType,
        },
      });
    } else if (block.type === 'paragraph') {
      // Check if paragraph contains list-like content
      const lines = block.content.split('\n');
      const bulletLikeLines = lines.filter(l => /^\s*[-*•]\s/.test(l)).length;
      const numberedLikeLines = lines.filter(l => /^\s*\d+[.)]\s/.test(l)).length;

      if (bulletLikeLines > 1 && bulletLikeLines / lines.length > 0.5) {
        patterns.push({
          blockId: block.id,
          patternType: 'list',
          confidence: 0.8,
          metadata: {
            listType: 'bullet',
            needsFormatting: true,
          },
          suggestion: 'Convert to bullet list',
        });
      } else if (numberedLikeLines > 1 && numberedLikeLines / lines.length > 0.5) {
        patterns.push({
          blockId: block.id,
          patternType: 'list',
          confidence: 0.8,
          metadata: {
            listType: 'numbered',
            needsFormatting: true,
          },
          suggestion: 'Convert to numbered list',
        });
      }
    }
  }

  return patterns;
}

/**
 * Detect quote patterns
 */
export function detectQuotes(blocks: ContentBlock[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  for (const block of blocks) {
    if (block.type === 'quote') {
      patterns.push({
        blockId: block.id,
        patternType: 'quote',
        confidence: 1.0,
        metadata: {},
      });
    } else if (block.type === 'paragraph') {
      // Check for quote-like patterns
      const content = block.content.trim();

      // Starts with quotation marks
      if (/^["'"]/.test(content) && /["'"]$/.test(content)) {
        patterns.push({
          blockId: block.id,
          patternType: 'quote',
          confidence: 0.7,
          metadata: { needsFormatting: true },
          suggestion: 'Format as blockquote',
        });
      }

      // Attribution pattern: content followed by "-- Author" or "- Author"
      if (/\n\s*[-–—]\s*[\w\s,.]+$/.test(content)) {
        patterns.push({
          blockId: block.id,
          patternType: 'quote',
          confidence: 0.8,
          metadata: { needsFormatting: true },
          suggestion: 'Format as epigraph with attribution',
        });
      }
    }
  }

  return patterns;
}

/**
 * Detect math patterns
 */
export function detectMath(blocks: ContentBlock[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  for (const block of blocks) {
    if (block.type === 'math') {
      patterns.push({
        blockId: block.id,
        patternType: 'math',
        confidence: 1.0,
        metadata: { isInline: false },
      });
    } else if (block.type === 'paragraph') {
      const content = block.content;

      // Check for LaTeX-style math
      const hasInlineMath = /\$[^$\n]+\$/.test(content);
      const hasBlockMath = /\$\$[\s\S]+?\$\$/.test(content);
      const hasLatexCommands = /\\(frac|sqrt|sum|int|alpha|beta|gamma|times|div|pm|leq|geq)/.test(content);

      if (hasBlockMath) {
        patterns.push({
          blockId: block.id,
          patternType: 'math',
          confidence: 0.95,
          metadata: { isInline: false },
        });
      } else if (hasInlineMath || hasLatexCommands) {
        patterns.push({
          blockId: block.id,
          patternType: 'math',
          confidence: 0.8,
          metadata: { isInline: true },
        });
      }
    }
  }

  return patterns;
}

/**
 * Detect link and image patterns
 */
export function detectLinksAndImages(blocks: ContentBlock[]): DetectedPattern[] {
  const patterns: DetectedPattern[] = [];

  for (const block of blocks) {
    if (block.type !== 'paragraph') continue;

    const content = block.content;

    // Markdown images
    const imageMatches = content.match(/!\[([^\]]*)\]\(([^)]+)\)/g);
    if (imageMatches && imageMatches.length > 0) {
      patterns.push({
        blockId: block.id,
        patternType: 'image',
        confidence: 1.0,
        metadata: {},
        suggestion: 'Consider converting to figure with caption',
      });
    }

    // Raw URLs that could be links
    const rawUrls = content.match(/(?<!\()(https?:\/\/[^\s<>"']+)(?!\))/g);
    if (rawUrls && rawUrls.length > 0) {
      patterns.push({
        blockId: block.id,
        patternType: 'link',
        confidence: 0.7,
        metadata: { needsFormatting: true },
        suggestion: 'Format raw URLs as markdown links',
      });
    }
  }

  return patterns;
}

/**
 * Detect all patterns in content blocks
 */
export function detectAllPatterns(blocks: ContentBlock[]): DetectedPattern[] {
  return [
    ...detectCodeBlocks(blocks),
    ...detectLists(blocks),
    ...detectQuotes(blocks),
    ...detectMath(blocks),
    ...detectLinksAndImages(blocks),
  ];
}

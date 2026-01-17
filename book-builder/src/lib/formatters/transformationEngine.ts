/**
 * Transformation Engine - Apply MyST transformations to content
 *
 * This is the main orchestrator that applies rule-based transformations
 * while guaranteeing 100% content preservation.
 */

import { ContentBlock, ParsedContent, parseContent, countWords } from './contentParser';
import { detectAllPatterns, detectLanguage, DetectedPattern } from './patternDetector';
import { detectAdmonitionCandidates, AdmonitionSuggestion } from './admonitionDetector';
import {
  wrapInAdmonition,
  formatCodeBlock,
  formatCodeBlockWithOptions,
  AdmonitionType,
} from './mystTransformers';

export interface TransformationConfig {
  selectedFeatures: string[];
  enableAdmonitions: boolean;
  enableCodeBlocks: boolean;
  enableAutoLanguageDetection: boolean;
  admonitionConfidenceThreshold: number;
  preserveExistingFormatting: boolean;
  aiSuggestions?: AISuggestion[];
}

export interface AISuggestion {
  paragraphId: string;
  type: string;
  title?: string;
  reason: string;
  confidence: number;
}

export interface TransformationResult {
  formattedContent: string;
  originalWordCount: number;
  formattedWordCount: number;
  appliedTransformations: AppliedTransformation[];
  suggestions: TransformationSuggestion[];
  warnings: string[];
}

export interface AppliedTransformation {
  blockId: string;
  type: 'admonition' | 'code-language' | 'code-block' | 'list' | 'quote' | 'heading';
  description: string;
  originalContent: string;
  transformedContent: string;
}

export interface TransformationSuggestion {
  blockId: string;
  type: string;
  suggestion: string;
  confidence: number;
}

// Map feature IDs to transformation capabilities
const FEATURE_CAPABILITIES: Record<string, string[]> = {
  // Admonitions (individual types)
  'note': ['admonition-note'],
  'tip': ['admonition-tip'],
  'hint': ['admonition-hint'],
  'important': ['admonition-important'],
  'warning': ['admonition-warning'],
  'caution': ['admonition-caution'],
  'attention': ['admonition-attention'],
  'danger': ['admonition-danger'],
  'error': ['admonition-error'],
  'seealso': ['admonition-seealso'],
  // Code features
  'code-block': ['code-block', 'code-language'],
  'code-linenos': ['code-linenos'],
  'code-caption': ['code-caption'],
  'code-emphasize': ['code-emphasize'],
  'code-filename': ['code-filename'],
  // Other features (mostly pass-through, user applies manually)
  'figure': ['figure'],
  'margin': ['margin'],
  'aside': ['aside'],
  'dropdown': ['dropdown'],
  'tab-set': ['tabs'],
  'card': ['card'],
  'mermaid-flowchart': ['mermaid'],
  'inline-math': ['math-inline'],
  'equation-block': ['math-block'],
};

/**
 * Expand generic feature IDs to specific feature IDs
 * e.g., 'admonitions' -> ['note', 'tip', 'warning', 'important', 'caution', 'danger', 'error', 'seealso']
 */
function expandFeatureIds(features: string[]): string[] {
  const expanded = new Set<string>();

  // Map generic IDs from MYST_FEATURES to specific IDs
  const expansionMap: Record<string, string[]> = {
    // 'admonitions' expands to all individual admonition types
    'admonitions': ['note', 'tip', 'hint', 'important', 'warning', 'caution', 'attention', 'danger', 'error', 'seealso'],
    // 'code-blocks' expands to code formatting features
    'code-blocks': ['code-block', 'code-linenos', 'code-caption', 'code-emphasize', 'code-filename'],
    // 'figures' expands to figure-related features
    'figures': ['figure'],
    // 'math' expands to math features
    'math': ['inline-math', 'equation-block'],
    // 'tabs' expands to tab-set
    'tabs': ['tab-set'],
    // 'dropdowns' expands to dropdown
    'dropdowns': ['dropdown'],
    // 'cards' expands to card
    'cards': ['card'],
  };

  for (const feature of features) {
    if (expansionMap[feature]) {
      // Expand generic feature to specific features
      for (const specific of expansionMap[feature]) {
        expanded.add(specific);
      }
    } else {
      // Keep the feature as-is (it's already specific)
      expanded.add(feature);
    }
  }

  return Array.from(expanded);
}

/**
 * Get enabled capabilities from selected features
 */
function getEnabledCapabilities(selectedFeatures: string[]): Set<string> {
  const capabilities = new Set<string>();

  for (const feature of selectedFeatures) {
    const featureCapabilities = FEATURE_CAPABILITIES[feature];
    if (featureCapabilities) {
      for (const cap of featureCapabilities) {
        capabilities.add(cap);
      }
    }
  }

  // Add generic capabilities based on feature categories
  const hasAdmonitions = selectedFeatures.some(f =>
    ['note', 'tip', 'hint', 'important', 'warning', 'caution', 'attention', 'danger', 'error', 'seealso'].includes(f)
  );
  if (hasAdmonitions) {
    capabilities.add('admonitions');
  }

  const hasCodeFeatures = selectedFeatures.some(f =>
    f.startsWith('code-') || f === 'code-block'
  );
  if (hasCodeFeatures) {
    capabilities.add('code-formatting');
  }

  return capabilities;
}

/**
 * Get enabled admonition types from selected features
 */
function getEnabledAdmonitionTypes(selectedFeatures: string[]): AdmonitionType[] {
  const types: AdmonitionType[] = [];
  const admonitionFeatures: AdmonitionType[] = [
    'note', 'tip', 'hint', 'important', 'warning',
    'caution', 'attention', 'danger', 'error', 'seealso'
  ];

  for (const feature of selectedFeatures) {
    if (admonitionFeatures.includes(feature as AdmonitionType)) {
      types.push(feature as AdmonitionType);
    }
  }

  return types;
}

/**
 * Transform a single block based on its type and detected patterns
 */
function transformBlock(
  block: ContentBlock,
  patterns: DetectedPattern[],
  admonitionSuggestion: AdmonitionSuggestion | undefined,
  capabilities: Set<string>,
  config: TransformationConfig
): { content: string; transformation?: AppliedTransformation } {
  const blockPatterns = patterns.filter(p => p.blockId === block.id);

  // Handle code blocks - add language if missing
  if (block.type === 'code' && capabilities.has('code-formatting')) {
    const codePattern = blockPatterns.find(p => p.patternType === 'code');
    if (codePattern?.metadata.needsFormatting && codePattern.metadata.language) {
      const transformed = formatCodeBlock(block.content, codePattern.metadata.language);
      return {
        content: transformed,
        transformation: {
          blockId: block.id,
          type: 'code-language',
          description: `Added language: ${codePattern.metadata.language}`,
          originalContent: block.content,
          transformedContent: transformed,
        },
      };
    }
    // Code block already has language, return as-is
    return { content: block.content };
  }

  // Handle paragraphs - potential admonitions
  if (block.type === 'paragraph' && capabilities.has('admonitions')) {
    if (admonitionSuggestion && admonitionSuggestion.confidence >= config.admonitionConfidenceThreshold) {
      // Check if this admonition type is enabled
      const enabledTypes = getEnabledAdmonitionTypes(config.selectedFeatures);
      if (enabledTypes.includes(admonitionSuggestion.type)) {
        const transformed = wrapInAdmonition(
          block.content,
          admonitionSuggestion.type,
          admonitionSuggestion.suggestedTitle
        );
        return {
          content: transformed,
          transformation: {
            blockId: block.id,
            type: 'admonition',
            description: `Wrapped in ${admonitionSuggestion.type} admonition (${admonitionSuggestion.reason})`,
            originalContent: block.content,
            transformedContent: transformed,
          },
        };
      }
    }
  }

  // Handle paragraphs that look like code
  if (block.type === 'paragraph' && capabilities.has('code-formatting')) {
    const codePattern = blockPatterns.find(p => p.patternType === 'code' && p.metadata.needsFormatting);
    if (codePattern && codePattern.confidence >= 0.7) {
      const language = codePattern.metadata.language || 'text';
      const transformed = formatCodeBlock(block.content, language);
      return {
        content: transformed,
        transformation: {
          blockId: block.id,
          type: 'code-block',
          description: `Converted to ${language} code block`,
          originalContent: block.content,
          transformedContent: transformed,
        },
      };
    }
  }

  // Default: return content unchanged
  return { content: block.content };
}

/**
 * Ensure proper spacing around headings and directives
 */
function ensureProperSpacing(content: string): string {
  let result = content;

  // Ensure blank line before headings
  result = result.replace(/([^\n])\n(#{1,6}\s)/g, '$1\n\n$2');

  // Ensure blank line after headings
  result = result.replace(/(#{1,6}[^\n]+)\n([^\n#])/g, '$1\n\n$2');

  // Ensure blank line before admonitions
  result = result.replace(/([^\n])\n(:::\{)/g, '$1\n\n$2');

  // Ensure blank line after admonitions
  result = result.replace(/(:::)\n([^\n:])/g, '$1\n\n$2');

  // Ensure blank line before code blocks
  result = result.replace(/([^\n])\n(```)/g, '$1\n\n$2');

  // Ensure blank line after code blocks
  result = result.replace(/(```)\n([^\n`])/g, '$1\n\n$2');

  // Remove excessive blank lines (more than 2)
  result = result.replace(/\n{4,}/g, '\n\n\n');

  return result;
}

/**
 * Main transformation function
 */
export function transformContent(
  rawContent: string,
  config: Partial<TransformationConfig> = {}
): TransformationResult {
  // Expand generic feature IDs (like 'admonitions') to specific IDs (like 'note', 'tip', 'warning')
  const expandedFeatures = expandFeatureIds(config.selectedFeatures ?? []);

  console.log('=== TRANSFORMATION ENGINE DEBUG ===');
  console.log('Input features:', config.selectedFeatures);
  console.log('Expanded features:', expandedFeatures);

  const fullConfig: TransformationConfig = {
    selectedFeatures: expandedFeatures,
    enableAdmonitions: config.enableAdmonitions ?? true,
    enableCodeBlocks: config.enableCodeBlocks ?? true,
    enableAutoLanguageDetection: config.enableAutoLanguageDetection ?? true,
    admonitionConfidenceThreshold: config.admonitionConfidenceThreshold ?? 0.65,
    preserveExistingFormatting: config.preserveExistingFormatting ?? true,
    aiSuggestions: config.aiSuggestions ?? [],
  };

  const parsed = parseContent(rawContent);
  const capabilities = getEnabledCapabilities(fullConfig.selectedFeatures);
  console.log('Enabled capabilities:', Array.from(capabilities));
  const patterns = detectAllPatterns(parsed.blocks);

  // Get rule-based admonition suggestions (fallback)
  const enabledAdmonitionTypes = getEnabledAdmonitionTypes(fullConfig.selectedFeatures);
  console.log('Enabled admonition types:', enabledAdmonitionTypes);
  console.log('enableAdmonitions flag:', fullConfig.enableAdmonitions);
  console.log('Parsed blocks count:', parsed.blocks.length);
  console.log('Parsed blocks:', parsed.blocks.map(b => ({ id: b.id, type: b.type, preview: b.content.slice(0, 50) })));

  const ruleBasedSuggestions = fullConfig.enableAdmonitions && enabledAdmonitionTypes.length > 0
    ? detectAdmonitionCandidates(parsed.blocks, {
        minConfidence: fullConfig.admonitionConfidenceThreshold,
        enabledTypes: enabledAdmonitionTypes,
      })
    : [];

  console.log('Rule-based suggestions found:', ruleBasedSuggestions.length);
  console.log('Rule-based suggestions:', ruleBasedSuggestions);

  // Create a map of block ID to admonition suggestion
  // AI suggestions take priority over rule-based suggestions
  const admonitionMap = new Map<string, AdmonitionSuggestion>();

  // First add rule-based suggestions
  for (const suggestion of ruleBasedSuggestions) {
    admonitionMap.set(suggestion.blockId, suggestion);
  }

  // Then override with AI suggestions (higher priority)
  if (fullConfig.aiSuggestions && fullConfig.aiSuggestions.length > 0) {
    console.log('AI suggestions provided:', fullConfig.aiSuggestions.length);
    console.log('AI suggestions:', fullConfig.aiSuggestions);
    for (const aiSuggestion of fullConfig.aiSuggestions) {
      // Convert AI suggestion to AdmonitionSuggestion format
      const admonitionTypes: AdmonitionType[] = ['note', 'tip', 'hint', 'important', 'warning', 'caution', 'attention', 'danger', 'error', 'seealso'];
      if (admonitionTypes.includes(aiSuggestion.type as AdmonitionType)) {
        admonitionMap.set(aiSuggestion.paragraphId, {
          blockId: aiSuggestion.paragraphId,
          type: aiSuggestion.type as AdmonitionType,
          confidence: aiSuggestion.confidence,
          reason: aiSuggestion.reason,
          suggestedTitle: aiSuggestion.title,
        });
      }
    }
  }

  console.log('Total admonition map entries:', admonitionMap.size);

  // Transform blocks
  const appliedTransformations: AppliedTransformation[] = [];
  const transformedBlocks: string[] = [];

  for (const block of parsed.blocks) {
    const admonitionSuggestion = admonitionMap.get(block.id);
    const result = transformBlock(
      block,
      patterns,
      admonitionSuggestion,
      capabilities,
      fullConfig
    );

    transformedBlocks.push(result.content);
    if (result.transformation) {
      appliedTransformations.push(result.transformation);
    }
  }

  // Join blocks and ensure proper spacing
  let formattedContent = transformedBlocks.join('\n');
  formattedContent = ensureProperSpacing(formattedContent);

  // Calculate word counts
  const originalWordCount = countWords(rawContent);
  const formattedWordCount = countWords(formattedContent);

  console.log('=== TRANSFORMATION RESULTS ===');
  console.log('Applied transformations:', appliedTransformations.length);
  console.log('Transformations:', appliedTransformations.map(t => ({ blockId: t.blockId, type: t.type, description: t.description })));
  console.log('Original word count:', originalWordCount);
  console.log('Formatted word count:', formattedWordCount);
  console.log('Formatted content preview (first 500 chars):', formattedContent.slice(0, 500));

  // Generate suggestions for patterns that weren't auto-applied
  const suggestions: TransformationSuggestion[] = [];
  for (const pattern of patterns) {
    if (pattern.suggestion && !appliedTransformations.some(t => t.blockId === pattern.blockId)) {
      suggestions.push({
        blockId: pattern.blockId,
        type: pattern.patternType,
        suggestion: pattern.suggestion,
        confidence: pattern.confidence,
      });
    }
  }

  // Check for warnings
  const warnings: string[] = [];
  if (formattedWordCount < originalWordCount * 0.95) {
    warnings.push(`Word count decreased significantly: ${originalWordCount} -> ${formattedWordCount}`);
  }

  return {
    formattedContent,
    originalWordCount,
    formattedWordCount,
    appliedTransformations,
    suggestions,
    warnings,
  };
}

/**
 * Transform content with detailed logging (for debugging)
 */
export function transformContentWithLogging(
  rawContent: string,
  config: Partial<TransformationConfig> = {}
): TransformationResult & { log: string[] } {
  const log: string[] = [];

  log.push(`Starting transformation...`);
  log.push(`Input word count: ${countWords(rawContent)}`);
  log.push(`Selected features: ${config.selectedFeatures?.join(', ') || 'none'}`);

  const result = transformContent(rawContent, config);

  log.push(`Applied ${result.appliedTransformations.length} transformations`);
  for (const t of result.appliedTransformations) {
    log.push(`  - ${t.type}: ${t.description}`);
  }

  log.push(`Output word count: ${result.formattedWordCount}`);
  if (result.warnings.length > 0) {
    log.push(`Warnings: ${result.warnings.join(', ')}`);
  }

  return { ...result, log };
}

/**
 * Quick format - just add language detection to code blocks
 */
export function quickFormatCodeBlocks(content: string): string {
  const lines = content.split('\n');
  const result: string[] = [];
  let inCodeBlock = false;
  let codeBlockContent = '';
  let codeBlockStart = '';

  for (const line of lines) {
    if (!inCodeBlock && line.match(/^```\s*$/)) {
      // Start of code block without language
      inCodeBlock = true;
      codeBlockStart = line;
      codeBlockContent = '';
    } else if (inCodeBlock && line.match(/^```\s*$/)) {
      // End of code block
      inCodeBlock = false;
      const detected = detectLanguage(codeBlockContent);
      if (detected.language && detected.confidence >= 0.4) {
        result.push(`\`\`\`${detected.language}`);
      } else {
        result.push(codeBlockStart);
      }
      result.push(codeBlockContent.trimEnd());
      result.push(line);
    } else if (inCodeBlock) {
      codeBlockContent += line + '\n';
    } else {
      result.push(line);
    }
  }

  return result.join('\n');
}

/**
 * Format content with specific feature focus
 */
export function formatWithFeatures(
  content: string,
  features: string[]
): TransformationResult {
  return transformContent(content, { selectedFeatures: features });
}

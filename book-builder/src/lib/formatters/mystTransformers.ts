/**
 * MyST Transformers - Individual feature formatters
 *
 * Each transformer wraps content in MyST syntax without modifying the actual text.
 * These are pure functions that NEVER alter the content, only wrap it.
 */

export type AdmonitionType =
  | 'note'
  | 'tip'
  | 'hint'
  | 'important'
  | 'warning'
  | 'caution'
  | 'attention'
  | 'danger'
  | 'error'
  | 'seealso';

/**
 * Wrap content in an admonition block
 * NEVER modifies the content, only wraps it
 */
export function wrapInAdmonition(
  content: string,
  type: AdmonitionType,
  title?: string
): string {
  const trimmedContent = content.trim();
  if (title) {
    return `:::{${type}} ${title}\n${trimmedContent}\n:::`;
  }
  return `:::{${type}}\n${trimmedContent}\n:::`;
}

/**
 * Wrap content in a dropdown admonition
 */
export function wrapInDropdownAdmonition(
  content: string,
  type: AdmonitionType,
  title: string
): string {
  const trimmedContent = content.trim();
  return `:::{${type}} ${title}\n:class: dropdown\n${trimmedContent}\n:::`;
}

/**
 * Format a code block with language identifier
 * Preserves the code exactly as-is
 */
export function formatCodeBlock(code: string, language: string): string {
  const trimmedCode = code.trim();
  // Remove existing code fences if present
  const unfenced = trimmedCode
    .replace(/^```\w*\n?/, '')
    .replace(/\n?```$/, '');
  return `\`\`\`${language}\n${unfenced}\n\`\`\``;
}

/**
 * Format a code block with additional options (line numbers, caption, etc.)
 */
export function formatCodeBlockWithOptions(
  code: string,
  language: string,
  options: {
    linenos?: boolean;
    caption?: string;
    label?: string;
    emphasizeLines?: number[];
    filename?: string;
  }
): string {
  const trimmedCode = code.trim();
  const unfenced = trimmedCode
    .replace(/^```\w*\n?/, '')
    .replace(/\n?```$/, '');

  let result = `\`\`\`{code} ${language}\n`;

  if (options.label) {
    result += `:label: ${options.label}\n`;
  }
  if (options.caption) {
    result += `:caption: ${options.caption}\n`;
  }
  if (options.filename) {
    result += `:filename: ${options.filename}\n`;
  }
  if (options.linenos) {
    result += `:linenos:\n`;
  }
  if (options.emphasizeLines && options.emphasizeLines.length > 0) {
    result += `:emphasize-lines: ${options.emphasizeLines.join(',')}\n`;
  }

  result += `${unfenced}\n\`\`\``;
  return result;
}

/**
 * Format content as a blockquote
 */
export function formatBlockquote(content: string): string {
  const lines = content.trim().split('\n');
  return lines.map(line => `> ${line}`).join('\n');
}

/**
 * Format content as an epigraph (quote with attribution)
 */
export function formatEpigraph(content: string, attribution?: string): string {
  const lines = content.trim().split('\n');
  const quotedLines = lines.map(line => `> ${line}`).join('\n');
  if (attribution) {
    return `${quotedLines}\n> -- ${attribution}`;
  }
  return quotedLines;
}

/**
 * Format content as a figure with caption
 */
export function formatFigure(
  imagePath: string,
  caption: string,
  options?: {
    alt?: string;
    label?: string;
    width?: string;
    align?: 'left' | 'center' | 'right';
  }
): string {
  let result = `\`\`\`{figure} ${imagePath}\n`;

  if (options?.label) {
    result += `:label: ${options.label}\n`;
  }
  if (options?.alt) {
    result += `:alt: ${options.alt}\n`;
  }
  if (options?.width) {
    result += `:width: ${options.width}\n`;
  }
  if (options?.align) {
    result += `:align: ${options.align}\n`;
  }

  result += `\n${caption}\n\`\`\``;
  return result;
}

/**
 * Format content as a margin note
 */
export function formatMarginNote(content: string): string {
  const trimmedContent = content.trim();
  return `:::{margin}\n${trimmedContent}\n:::`;
}

/**
 * Format content as an aside
 */
export function formatAside(content: string): string {
  const trimmedContent = content.trim();
  return `:::{aside}\n${trimmedContent}\n:::`;
}

/**
 * Format content as a sidebar
 */
export function formatSidebar(content: string, title: string): string {
  const trimmedContent = content.trim();
  return `:::{sidebar} ${title}\n${trimmedContent}\n:::`;
}

/**
 * Format content as a dropdown
 */
export function formatDropdown(content: string, title: string): string {
  const trimmedContent = content.trim();
  return `:::{dropdown} ${title}\n${trimmedContent}\n:::`;
}

/**
 * Format content as tabs
 */
export function formatTabs(tabs: Array<{ label: string; content: string }>): string {
  let result = '::::{tab-set}\n';

  for (const tab of tabs) {
    result += `:::{tab-item} ${tab.label}\n${tab.content.trim()}\n:::\n`;
  }

  result += '::::';
  return result;
}

/**
 * Format content as a card
 */
export function formatCard(
  content: string,
  title: string,
  options?: {
    header?: string;
    footer?: string;
    link?: string;
  }
): string {
  let result = `:::{card} ${title}\n`;

  if (options?.header) {
    result += `:header: ${options.header}\n`;
  }
  if (options?.footer) {
    result += `:footer: ${options.footer}\n`;
  }
  if (options?.link) {
    result += `:link: ${options.link}\n`;
  }

  result += `${content.trim()}\n:::`;
  return result;
}

/**
 * Format content as a grid of cards
 */
export function formatCardGrid(
  cards: Array<{ title: string; content: string }>,
  columns: string = '1 1 2 3'
): string {
  let result = `::::{grid} ${columns}\n`;

  for (const card of cards) {
    result += `:::{card} ${card.title}\n${card.content.trim()}\n:::\n`;
  }

  result += '::::';
  return result;
}

/**
 * Format a math block
 */
export function formatMathBlock(equation: string, label?: string): string {
  const trimmedEquation = equation.trim();
  if (label) {
    return `\`\`\`{math}\n:label: ${label}\n${trimmedEquation}\n\`\`\``;
  }
  return `$$\n${trimmedEquation}\n$$`;
}

/**
 * Format a Mermaid diagram
 */
export function formatMermaidDiagram(diagram: string): string {
  const trimmedDiagram = diagram.trim();
  return `\`\`\`{mermaid}\n${trimmedDiagram}\n\`\`\``;
}

/**
 * Format content as an exercise
 */
export function formatExercise(content: string, label?: string): string {
  const trimmedContent = content.trim();
  let result = '```{exercise}\n';
  if (label) {
    result += `:label: ${label}\n`;
  }
  result += `${trimmedContent}\n\`\`\``;
  return result;
}

/**
 * Format content as a solution (linked to exercise)
 */
export function formatSolution(content: string, exerciseLabel: string, solutionLabel?: string): string {
  const trimmedContent = content.trim();
  let result = `\`\`\`\`{solution} ${exerciseLabel}\n`;
  if (solutionLabel) {
    result += `:label: ${solutionLabel}\n`;
  }
  result += `${trimmedContent}\n\`\`\`\``;
  return result;
}

/**
 * Format a proof block
 */
export function formatProof(content: string, type: 'theorem' | 'lemma' | 'proof' | 'definition' | 'corollary' = 'proof', title?: string, label?: string): string {
  const trimmedContent = content.trim();
  let result = `:::{prf:${type}}`;
  if (title) {
    result += ` ${title}`;
  }
  result += '\n';
  if (label) {
    result += `:label: ${label}\n`;
  }
  result += `${trimmedContent}\n:::`;
  return result;
}

/**
 * Format a glossary
 */
export function formatGlossary(terms: Array<{ term: string; definition: string }>): string {
  let result = '```{glossary}\n';
  for (const { term, definition } of terms) {
    result += `${term}\n  ${definition}\n\n`;
  }
  result += '```';
  return result;
}

/**
 * Format a table (list-table format for better control)
 */
export function formatListTable(
  headers: string[],
  rows: string[][],
  title?: string
): string {
  let result = '```{list-table}';
  if (title) {
    result += ` ${title}`;
  }
  result += '\n:header-rows: 1\n\n';

  // Add header row
  result += '* - ' + headers.join('\n  - ') + '\n';

  // Add data rows
  for (const row of rows) {
    result += '* - ' + row.join('\n  - ') + '\n';
  }

  result += '```';
  return result;
}

/**
 * Wrap content in a topic block
 */
export function formatTopic(content: string, title: string): string {
  const trimmedContent = content.trim();
  return `:::{topic} ${title}\n${trimmedContent}\n:::`;
}

/**
 * Format a pull quote
 */
export function formatPullQuote(content: string): string {
  const trimmedContent = content.trim();
  return `:::{pull-quote}\n${trimmedContent}\n:::`;
}

/**
 * Add a label to content for cross-referencing
 */
export function addLabel(content: string, label: string): string {
  return `(${label})=\n${content}`;
}

/**
 * Format a version added notice
 */
export function formatVersionAdded(content: string, version: string): string {
  const trimmedContent = content.trim();
  return `:::{versionadded} ${version}\n${trimmedContent}\n:::`;
}

/**
 * Format a deprecated notice
 */
export function formatDeprecated(content: string, version: string): string {
  const trimmedContent = content.trim();
  return `:::{deprecated} ${version}\n${trimmedContent}\n:::`;
}

/**
 * Apply multiple inline styles
 */
export function applyInlineStyles(
  content: string,
  styles: {
    bold?: boolean;
    italic?: boolean;
    code?: boolean;
    strikethrough?: boolean;
  }
): string {
  let result = content;

  if (styles.code) {
    result = `\`${result}\``;
  }
  if (styles.bold) {
    result = `**${result}**`;
  }
  if (styles.italic) {
    result = `*${result}*`;
  }
  if (styles.strikethrough) {
    result = `~~${result}~~`;
  }

  return result;
}

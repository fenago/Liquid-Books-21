/**
 * AI Formatting Planner - Holistic chapter analysis for MyST formatting
 *
 * This analyzes the ENTIRE chapter content and creates a formatting plan
 * based on semantic meaning, not just keyword matching.
 *
 * Supports ALL 130+ MyST features across 13 categories:
 * - Admonitions (note, tip, warning, important, caution, danger, etc.)
 * - UI Components (cards, dropdowns, tabs, grids, buttons)
 * - Interactive Code (code-cell, jupyterlite, thebe, widgets)
 * - Exercises (exercise, solution)
 * - Math (inline-math, equation-block, matrices)
 * - Diagrams (mermaid flowcharts, sequence, class diagrams)
 * - Code (code blocks with line numbers, captions, emphasis)
 * - Figures (images, figures, videos, iframes)
 * - Tables (markdown, list-table, csv-table)
 * - Layout (margin, aside, sidebar, epigraph, pull-quote)
 * - References (cross-reference, citation, glossary, footnote)
 * - Content (abbreviation, keyboard, download, include)
 * - Proofs & Theorems (theorem, proof, lemma, definition, algorithm)
 */

import { NextRequest, NextResponse } from 'next/server';

// All supported MyST feature types for formatting suggestions
type MystFeatureType =
  // Admonitions
  | 'note' | 'tip' | 'hint' | 'important' | 'warning' | 'caution' | 'attention' | 'danger' | 'error' | 'seealso' | 'admonition-dropdown' | 'admonition-custom'
  // UI Components
  | 'dropdown' | 'card' | 'card-link' | 'grid' | 'tab-set' | 'button' | 'toggle' | 'badge' | 'button-link' | 'button-ref' | 'grid-item' | 'grid-item-card'
  // Interactive Code
  | 'jupyterlite' | 'pyodide' | 'thebe' | 'binder-launch' | 'colab-launch' | 'ipywidgets' | 'plotly-interactive' | 'bokeh-interactive' | 'altair-interactive' | 'code-cell' | 'hide-input' | 'hide-output' | 'hide-cell' | 'remove-input' | 'remove-output' | 'remove-cell' | 'glue'
  // Exercises
  | 'exercise' | 'solution' | 'exercise-dropdown'
  // Math
  | 'inline-math' | 'equation-block' | 'dollar-math' | 'align-env' | 'matrix' | 'chemical-formula' | 'si-units'
  // Diagrams
  | 'mermaid-flowchart' | 'mermaid-sequence' | 'mermaid-class' | 'mermaid-state' | 'mermaid-gantt' | 'mermaid-pie'
  // Code
  | 'code-block' | 'code-caption' | 'code-linenos' | 'code-emphasize' | 'code-filename' | 'literalinclude'
  // Figures
  | 'image' | 'figure' | 'subfigure' | 'video' | 'iframe'
  // Tables
  | 'markdown-table' | 'list-table' | 'csv-table'
  // Layout
  | 'aside' | 'margin' | 'sidebar' | 'epigraph' | 'blockquote' | 'pull-quote' | 'container' | 'div' | 'hlist' | 'rubric' | 'centered' | 'topic'
  // References
  | 'cross-reference' | 'citation' | 'bibliography' | 'glossary' | 'glossary-term' | 'footnote' | 'doc-reference' | 'numref' | 'eq-reference' | 'index-entry'
  // Content
  | 'abbreviation' | 'subscript' | 'superscript' | 'keyboard' | 'underline' | 'strikethrough' | 'smallcaps' | 'download-link' | 'versionadded' | 'versionchanged' | 'deprecated' | 'guilabel' | 'menuselection' | 'file-role' | 'command' | 'envvar' | 'option' | 'regexp' | 'include' | 'embed' | 'toctree' | 'raw' | 'only' | 'definition-list' | 'substitution'
  // Proofs & Theorems
  | 'theorem' | 'proof' | 'lemma' | 'definition' | 'corollary' | 'proposition' | 'axiom' | 'algorithm' | 'example-prf' | 'remark' | 'conjecture' | 'criterion' | 'observation' | 'property' | 'assumption';

interface FormattingPlan {
  paragraphId: string;
  type: MystFeatureType;
  title?: string;
  reason: string;
  confidence: number;
  options?: Record<string, string>; // Additional options like :label:, :class:, etc.
}

interface PlanRequest {
  content: string;
  chapterTitle?: string;
  selectedFeatures: string[];
  provider: 'gemini' | 'claude' | 'openai';
  apiKey: string;
  model?: string;
}

// Build dynamic system prompt based on selected features
function buildSystemPrompt(selectedFeatures: string[]): string {
  const expandedFeatures = expandFeatureIds(selectedFeatures);

  let prompt = `You are an expert technical book editor. Your job is to analyze a chapter and recommend where to apply MyST Markdown formatting to enhance readability and educational value.

You will receive:
1. The full chapter content (with paragraph IDs marked as [P1], [P2], etc.)
2. The MyST features the author has enabled

Your task is to identify paragraphs that would benefit from formatting based on their SEMANTIC MEANING, not just keywords.

## Enabled Feature Categories and When to Use Them:

`;

  // Add guidance for each enabled feature category
  if (hasFeatureCategory(expandedFeatures, 'admonitions')) {
    prompt += `### ADMONITIONS (Callout Boxes)
Identify content that should be highlighted as special information:
- **note**: General information, learning objectives, key concepts, definitions
- **tip**: Best practices, shortcuts, efficiency advice, pro tips
- **hint**: Subtle guidance, gentle suggestions
- **important**: Critical information that must not be missed
- **warning**: Common mistakes, potential problems, things to avoid
- **caution**: Situations requiring careful attention, edge cases
- **danger**: Serious risks, data loss, security issues, irreversible actions
- **seealso**: References to related topics, further reading

`;
  }

  if (hasFeatureCategory(expandedFeatures, 'ui-components')) {
    prompt += `### UI COMPONENTS
Identify content that would benefit from interactive/visual components:
- **card**: Case studies, real-world examples, featured scenarios, highlighted content
- **dropdown**: Optional details, extended examples, content that might overwhelm the main flow
- **tab-set**: Alternative implementations (e.g., Python vs JavaScript), multiple approaches
- **toggle**: Hidden content readers can reveal, spoilers, answers
- **grid**: Multiple related items that should be displayed side-by-side

`;
  }

  if (hasFeatureCategory(expandedFeatures, 'proofs-theorems')) {
    prompt += `### PROOFS & THEOREMS (Academic/Mathematical Content)
Identify formal mathematical or academic content:
- **theorem**: Mathematical theorem statements
- **proof**: Mathematical proofs
- **lemma**: Supporting mathematical lemmas
- **definition**: Formal definitions of terms or concepts
- **corollary**: Results following from theorems
- **proposition**: Mathematical propositions
- **axiom**: Fundamental assumptions
- **algorithm**: Step-by-step procedures or algorithms
- **example-prf**: Mathematical examples
- **remark**: Additional observations or remarks
- **conjecture**: Unproven mathematical conjectures

`;
  }

  if (hasFeatureCategory(expandedFeatures, 'exercises')) {
    prompt += `### EXERCISES
Identify practice problems or exercises:
- **exercise**: Practice problems, challenges for readers
- **solution**: Answers to exercises (usually should be hidden/collapsible)

`;
  }

  if (hasFeatureCategory(expandedFeatures, 'math')) {
    prompt += `### MATH & EQUATIONS
Identify mathematical content:
- **equation-block**: Important equations that should be displayed prominently
- **inline-math**: Mathematical expressions within text
- **matrix**: Matrix notation
- **align-env**: Multiple aligned equations

`;
  }

  if (hasFeatureCategory(expandedFeatures, 'diagrams')) {
    prompt += `### DIAGRAMS
Identify content that would benefit from visual diagrams:
- **mermaid-flowchart**: Processes, workflows, decision trees
- **mermaid-sequence**: Interactions between components, API flows
- **mermaid-class**: Object relationships, class hierarchies
- **mermaid-state**: State machines, lifecycle diagrams
- **mermaid-gantt**: Project timelines, schedules
- **mermaid-pie**: Distribution data, percentages

`;
  }

  if (hasFeatureCategory(expandedFeatures, 'code')) {
    prompt += `### CODE BLOCKS
Identify code that needs special formatting:
- **code-linenos**: Code that would benefit from line numbers (longer examples)
- **code-emphasize**: Code where specific lines should be highlighted
- **code-caption**: Code that needs a descriptive caption
- **code-filename**: Code that represents a specific file

`;
  }

  if (hasFeatureCategory(expandedFeatures, 'layout')) {
    prompt += `### LAYOUT
Identify content that needs special positioning:
- **margin**: Brief side notes, quick definitions, marginal commentary
- **aside**: Content that supplements the main text
- **sidebar**: Extended supplementary content
- **pull-quote**: Impactful quotes that should be highlighted
- **epigraph**: Opening quotes for sections
- **topic**: Self-contained topic blocks

`;
  }

  if (hasFeatureCategory(expandedFeatures, 'references')) {
    prompt += `### REFERENCES
Identify content that needs cross-references or citations:
- **glossary**: Terms that should be defined in a glossary
- **footnote**: Additional details that would work as footnotes
- **citation**: References to external sources

`;
  }

  if (hasFeatureCategory(expandedFeatures, 'content')) {
    prompt += `### CONTENT ANNOTATIONS
Identify inline content that needs special formatting:
- **abbreviation**: Technical abbreviations that need expansion
- **keyboard**: Keyboard shortcuts (like Ctrl+C)
- **guilabel**: GUI element references (buttons, menus)
- **menuselection**: Menu navigation paths
- **file-role**: File or directory paths
- **command**: Shell commands
- **envvar**: Environment variables
- **deprecated**: Features that are deprecated
- **versionadded**: New features
- **versionchanged**: Changed behavior

`;
  }

  prompt += `## Strategy Guidelines:
- Don't over-format. Not every paragraph needs formatting.
- Aim for 1-2 formatted elements per 300-500 words on average
- Distribute formatting throughout the chapter, not clustered
- Consider the flow and reading experience
- Match the tone: academic books need more theorem/proof blocks, tutorials need more tips/warnings
- Only suggest features from the enabled list

Return a JSON array of formatting recommendations.`;

  return prompt;
}

// Check if any features from a category are enabled
function hasFeatureCategory(features: string[], category: string): boolean {
  const categoryMap: Record<string, string[]> = {
    'admonitions': ['note', 'tip', 'hint', 'important', 'warning', 'caution', 'attention', 'danger', 'error', 'seealso', 'admonitions'],
    'ui-components': ['dropdown', 'card', 'card-link', 'grid', 'tab-set', 'button', 'toggle', 'badge', 'cards', 'dropdowns', 'tabs'],
    'proofs-theorems': ['theorem', 'proof', 'lemma', 'definition', 'corollary', 'proposition', 'axiom', 'algorithm', 'example-prf', 'remark', 'conjecture', 'proofs-theorems'],
    'exercises': ['exercise', 'solution', 'exercise-dropdown', 'exercises'],
    'math': ['inline-math', 'equation-block', 'dollar-math', 'align-env', 'matrix', 'math'],
    'diagrams': ['mermaid-flowchart', 'mermaid-sequence', 'mermaid-class', 'mermaid-state', 'mermaid-gantt', 'mermaid-pie', 'mermaid', 'diagrams'],
    'code': ['code-block', 'code-caption', 'code-linenos', 'code-emphasize', 'code-filename', 'code-blocks'],
    'layout': ['aside', 'margin', 'sidebar', 'epigraph', 'blockquote', 'pull-quote', 'container', 'topic', 'layout'],
    'references': ['cross-reference', 'citation', 'glossary', 'glossary-term', 'footnote', 'references'],
    'content': ['abbreviation', 'keyboard', 'guilabel', 'menuselection', 'file-role', 'command', 'envvar', 'deprecated', 'versionadded', 'content'],
    'interactive-code': ['jupyterlite', 'pyodide', 'thebe', 'code-cell', 'ipywidgets', 'interactive-code'],
    'figures': ['image', 'figure', 'video', 'iframe', 'figures'],
    'tables': ['markdown-table', 'list-table', 'csv-table', 'tables'],
  };

  const categoryFeatures = categoryMap[category] || [];
  return features.some(f => categoryFeatures.includes(f));
}

export async function POST(request: NextRequest) {
  try {
    const body: PlanRequest = await request.json();
    const { content, chapterTitle, selectedFeatures, provider, apiKey, model } = body;

    if (!content || !selectedFeatures || !provider || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Parse content into paragraphs and mark with IDs
    const paragraphs = parseIntoParagraphs(content);

    if (paragraphs.length === 0) {
      return NextResponse.json({
        success: true,
        plan: [],
        message: 'No paragraphs found to format',
      });
    }

    // Build the content with paragraph markers
    const markedContent = paragraphs
      .map((p, i) => `[P${i + 1}] ${p.content}`)
      .join('\n\n');

    // Expand feature IDs to specific types
    const expandedFeatures = expandFeatureIds(selectedFeatures);

    const userPrompt = `# Chapter: ${chapterTitle || 'Untitled'}

## Content to Analyze:

${markedContent}

## Enabled Features:
${expandedFeatures.join(', ')}

## Instructions:
Analyze this chapter and recommend formatting. For each recommendation:
1. Identify the paragraph ID (P1, P2, etc.)
2. Suggest the formatting type (must be one of the enabled features)
3. Provide an optional title if appropriate
4. Explain briefly why this formatting improves the content

Return ONLY a JSON array in this exact format:
[
  {"paragraphId": "P1", "type": "note", "title": "Optional Title", "reason": "brief reason", "confidence": 0.85},
  {"paragraphId": "P5", "type": "warning", "reason": "brief reason", "confidence": 0.9}
]

If no formatting is needed, return an empty array: []`;

    let plan: FormattingPlan[] = [];

    // Build the dynamic system prompt based on selected features
    const systemPrompt = buildSystemPrompt(selectedFeatures);

    if (provider === 'gemini') {
      plan = await getGeminiPlan(apiKey, model || 'gemini-2.0-flash', userPrompt, systemPrompt);
    } else if (provider === 'claude') {
      plan = await getClaudePlan(apiKey, model || 'claude-sonnet-4-20250514', userPrompt, systemPrompt);
    } else if (provider === 'openai') {
      plan = await getOpenAIPlan(apiKey, model || 'gpt-4o-mini', userPrompt, systemPrompt);
    }

    // Map paragraph IDs back to block IDs
    const mappedPlan = plan.map(item => {
      const pIndex = parseInt(item.paragraphId.replace('P', '')) - 1;
      if (pIndex >= 0 && pIndex < paragraphs.length) {
        return {
          ...item,
          paragraphId: paragraphs[pIndex].id,
        };
      }
      return item;
    }).filter(item => {
      // Only include enabled feature types
      return expandedFeatures.includes(item.type);
    });

    console.log('AI Formatting Plan:', mappedPlan);

    return NextResponse.json({
      success: true,
      plan: mappedPlan,
      totalParagraphs: paragraphs.length,
      recommendationsCount: mappedPlan.length,
    });

  } catch (error) {
    console.error('AI planning error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to create formatting plan' },
      { status: 500 }
    );
  }
}

interface Paragraph {
  id: string;
  content: string;
  wordCount: number;
}

function parseIntoParagraphs(content: string): Paragraph[] {
  const paragraphs: Paragraph[] = [];

  // Split by double newlines (paragraph breaks)
  const blocks = content.split(/\n\n+/);
  let pIndex = 0;

  for (const block of blocks) {
    const trimmed = block.trim();
    if (!trimmed) continue;

    // Skip headings, code blocks, lists for now (focus on prose)
    if (trimmed.startsWith('#')) continue;
    if (trimmed.startsWith('```')) continue;
    if (trimmed.startsWith(':::')) continue;
    if (/^[-*+]\s/.test(trimmed)) continue;
    if (/^\d+\.\s/.test(trimmed)) continue;

    // Skip very short paragraphs (less than 10 words)
    const wordCount = trimmed.split(/\s+/).length;
    if (wordCount < 10) continue;

    pIndex++;
    paragraphs.push({
      id: `p-${pIndex}`,
      content: trimmed,
      wordCount,
    });
  }

  return paragraphs;
}

function expandFeatureIds(features: string[]): string[] {
  const expanded = new Set<string>();

  const expansionMap: Record<string, string[]> = {
    'admonitions': ['note', 'tip', 'warning', 'important', 'caution', 'danger', 'seealso'],
    'cards': ['card'],
    'dropdowns': ['dropdown'],
  };

  for (const feature of features) {
    if (expansionMap[feature]) {
      for (const specific of expansionMap[feature]) {
        expanded.add(specific);
      }
    } else {
      expanded.add(feature);
    }
  }

  return Array.from(expanded);
}

async function getGeminiPlan(apiKey: string, model: string, prompt: string, systemPrompt: string): Promise<FormattingPlan[]> {
  const modelId = model.replace(/^models\//, '');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${systemPrompt}\n\n${prompt}` }] }],
        generationConfig: {
          maxOutputTokens: 8192,
          temperature: 0.3,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini API request failed');
  }

  const data = await response.json();
  const text = data.candidates?.[0]?.content?.parts?.[0]?.text || '';
  return parseJsonResponse(text);
}

async function getClaudePlan(apiKey: string, model: string, prompt: string, systemPrompt: string): Promise<FormattingPlan[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 8192,
      system: systemPrompt,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Anthropic API request failed');
  }

  const data = await response.json();
  const text = data.content?.[0]?.type === 'text' ? data.content[0].text : '';
  return parseJsonResponse(text);
}

async function getOpenAIPlan(apiKey: string, model: string, prompt: string, systemPrompt: string): Promise<FormattingPlan[]> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: systemPrompt },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 8192,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API request failed');
  }

  const data = await response.json();
  const text = data.choices?.[0]?.message?.content || '';
  return parseJsonResponse(text);
}

function parseJsonResponse(text: string): FormattingPlan[] {
  try {
    // Extract JSON array from response
    const jsonMatch = text.match(/\[[\s\S]*\]/);
    if (jsonMatch) {
      const parsed = JSON.parse(jsonMatch[0]);
      if (Array.isArray(parsed)) {
        return parsed.filter(item =>
          item.paragraphId &&
          item.type &&
          typeof item.confidence === 'number'
        );
      }
    }
    return [];
  } catch (e) {
    console.error('Failed to parse AI response:', e);
    return [];
  }
}

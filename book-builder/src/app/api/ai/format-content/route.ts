/**
 * AI Content Formatter - Applies MyST formatting to user content
 *
 * This endpoint:
 * 1. Takes the user's raw content
 * 2. Gets all selected MyST features WITH their syntax examples
 * 3. Tells the AI to intelligently apply formatting WHERE appropriate
 * 4. Returns the FULLY formatted content with MyST syntax applied
 *
 * This mirrors how generateChapterContent works, but for existing content.
 */

import { NextRequest, NextResponse } from 'next/server';
import { mystFeatures } from '@/data/mystFeatures';

// Use Edge runtime for better streaming support and longer timeouts
export const runtime = 'edge';
export const maxDuration = 60;

interface FormatRequest {
  content: string;
  chapterTitle?: string;
  selectedFeatures: string[];
  provider: 'gemini' | 'claude' | 'openai';
  apiKey: string;
  model?: string;
  targetWordCount?: number;
}

// Build the feature context with syntax examples - exactly like generateChapterContent does
function buildFeaturesContext(selectedFeatureIds: string[]): string {
  if (!selectedFeatureIds?.length) return '';

  // selectedFeatureIds contains CATEGORY IDs like 'admonitions', 'figures', 'math'
  // We need to find all features that belong to these categories
  const featureLines: string[] = [];

  for (const categoryId of selectedFeatureIds) {
    // Find all features in this category
    const categoryFeatures = mystFeatures.filter(f => f.category === categoryId);

    if (categoryFeatures.length > 0) {
      for (const feature of categoryFeatures) {
        featureLines.push(
          `- **${feature.name}** (${feature.category})\n  Syntax: ${feature.syntax}\n  Example: ${feature.example}`
        );
      }
    } else {
      // Maybe it's a direct feature ID (fallback)
      const directFeature = mystFeatures.find(f => f.id === categoryId);
      if (directFeature) {
        featureLines.push(
          `- **${directFeature.name}** (${directFeature.category})\n  Syntax: ${directFeature.syntax}\n  Example: ${directFeature.example}`
        );
      }
    }
  }

  if (featureLines.length === 0) return '';

  console.log(`Built features context with ${featureLines.length} features from ${selectedFeatureIds.length} categories`);

  return `

## Available MyST Features to Apply

Use these features WHERE APPROPRIATE based on the content's semantic meaning:

${featureLines.join('\n\n')}

`;
}

const SYSTEM_PROMPT = `You are an expert technical book editor who enhances content with MyST Markdown formatting.

## CRITICAL SYNTAX RULE - READ THIS FIRST:

MyST directives use CURLY BRACES inside the colons. This is MANDATORY.

✅ CORRECT: :::{note}
❌ WRONG:   :::note

✅ CORRECT: :::{tip}
❌ WRONG:   :::tip

✅ CORRECT: :::{warning}
❌ WRONG:   :::warning

The format is ALWAYS: :::{directive-name} with curly braces around the directive name.

## ABSOLUTE REQUIREMENT #1: ZERO CONTENT LOSS

You MUST output 100% of the input content. This is NON-NEGOTIABLE.

- 12,000 word input → 12,000+ word output
- Every paragraph, every sentence, every word must appear
- NEVER truncate, summarize, or skip content
- NEVER use placeholders like "..." or "[rest of content]"

## ABSOLUTE REQUIREMENT #2: USE VARIETY OF FEATURES

DO NOT just use :::{note} for everything! You MUST use a MIX of different MyST features.

**MANDATORY FEATURE MIX** (for a 12,000 word chapter, use approximately):
- 8-10 :::{note} blocks (for definitions, concepts, learning objectives)
- 6-8 :::{tip} blocks (for best practices, recommendations)
- 4-6 :::{warning} blocks (for pitfalls, common mistakes)
- 2-3 :::{danger} blocks (for critical risks)
- 4-6 ::::{card} blocks (for case studies, real-world examples)
- 4-6 :::{dropdown} title blocks (for detailed explanations, optional content)
- 3-4 :::::{tab-set} blocks (for comparing approaches, showing alternatives)
- 2-3 :::{important} blocks (for critical information)

## EXACT SYNTAX (copy these exactly - note the CURLY BRACES):

1. **Notes** - MUST have curly braces:
\`\`\`
:::{note}
Content here
:::
\`\`\`

2. **Tips** - MUST have curly braces:
\`\`\`
:::{tip}
Content here
:::
\`\`\`

3. **Warnings** - MUST have curly braces:
\`\`\`
:::{warning}
Content here
:::
\`\`\`

4. **Danger** - MUST have curly braces:
\`\`\`
:::{danger}
Content here
:::
\`\`\`

5. **Cards** - USE 4 COLONS with curly braces:
\`\`\`
::::{card} Title Here
Content of the case study or example
::::
\`\`\`

6. **Dropdowns** - MUST have curly braces:
\`\`\`
:::{dropdown} Click to expand
Detailed content here
:::
\`\`\`

7. **Tab Sets** - USE 5 COLONS with curly braces:
\`\`\`
:::::{tab-set}
::::{tab-item} Option A
Content for option A
::::
::::{tab-item} Option B
Content for option B
::::
:::::
\`\`\`

8. **Important** - MUST have curly braces:
\`\`\`
:::{important}
Critical information
:::
\`\`\`

9. **Figures** - MUST have curly braces:
\`\`\`
:::{figure} path/to/image.png
:alt: Description
:width: 80%

Caption text here
:::
\`\`\`

10. **Math blocks** - MUST have curly braces:
\`\`\`
\`\`\`{math}
E = mc^2
\`\`\`
\`\`\`

## EXAMPLE OUTPUT WITH CORRECT SYNTAX:

:::{note}
**Learning Objectives**
After this section, you will understand...
:::

This paragraph explains the concept...

:::{tip}
A best practice is to always validate your data before processing.
:::

More explanatory content here...

::::{card} Real-World Example: Netflix
Netflix uses this approach to recommend content to millions of users...
::::

Additional content...

:::{warning}
A common mistake is assuming all data is clean. Always check for missing values.
:::

:::{dropdown} Deep Dive: Statistical Details
For those interested in the mathematical foundations...
:::

## Output Format

Output the COMPLETE chapter using a VARIETY of MyST features with CORRECT SYNTAX (curly braces!). DO NOT just use notes!`;


export async function POST(request: NextRequest) {
  try {
    const body: FormatRequest = await request.json();
    const { content, chapterTitle, selectedFeatures, provider, apiKey, model } = body;

    if (!content || !selectedFeatures || !provider || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Count original words for verification
    const originalWordCount = content.split(/\s+/).filter(w => w.length > 0).length;

    // Build the features context with syntax examples
    const featuresContext = buildFeaturesContext(selectedFeatures);

    if (!featuresContext) {
      // No valid features selected, return content as-is
      return NextResponse.json({
        success: true,
        formattedContent: content,
        originalWordCount,
        formattedWordCount: originalWordCount,
        featuresApplied: 0,
        message: 'No valid features selected for formatting',
      });
    }

    // Build list of required features based on selected categories
    const requiredFeatures: string[] = [];
    if (selectedFeatures.includes('admonitions')) {
      requiredFeatures.push(':::{note}', ':::{tip}', ':::{warning}', ':::{important}');
    }
    if (selectedFeatures.includes('cards')) {
      requiredFeatures.push('::::{card}');
    }
    if (selectedFeatures.includes('dropdowns')) {
      requiredFeatures.push(':::{dropdown}');
    }
    if (selectedFeatures.includes('tabs')) {
      requiredFeatures.push(':::::{tab-set}');
    }
    if (selectedFeatures.includes('figures')) {
      requiredFeatures.push(':::{figure}');
    }
    if (selectedFeatures.includes('math')) {
      requiredFeatures.push('```{math}');
    }

    // Calculate minimum total features (2 per 500 words)
    const totalMinFeatures = Math.max(10, Math.ceil(originalWordCount / 250));

    const userPrompt = `# Chapter: ${chapterTitle || 'Untitled Chapter'}

## ABSOLUTE REQUIREMENTS:
- **INPUT WORD COUNT**: ${originalWordCount} words
- **REQUIRED OUTPUT**: ${originalWordCount}+ words (ZERO content loss!)
- **MINIMUM TOTAL FEATURES**: ${totalMinFeatures}

## MANDATORY FEATURES TO USE:
You MUST use ALL of these feature types (user selected them):
${requiredFeatures.map(f => `- ${f}`).join('\n')}

${featuresContext}

## Content to Format (${originalWordCount} words - OUTPUT EVERY SINGLE WORD):

${content}

## STRICT Instructions:

1. **ZERO CONTENT LOSS**: Output EVERY word - if input is ${originalWordCount} words, output must be ${originalWordCount}+ words
2. **USE ALL SELECTED FEATURES**: You MUST use each of these: ${requiredFeatures.join(', ')}
3. **MINIMUM ${totalMinFeatures} FEATURES**: Distribute them throughout (beginning, middle, AND end)
4. **NO TRUNCATION**: Continue until the VERY END of the content

**VALIDATION CHECKLIST:**
✓ Word count ≥ ${originalWordCount}
✓ Used notes, tips, AND warnings (not just notes)
✓ Used cards AND dropdowns
${selectedFeatures.includes('tabs') ? '✓ Used tab-sets\n' : ''}${selectedFeatures.includes('figures') ? '✓ Used figures\n' : ''}${selectedFeatures.includes('math') ? '✓ Used math blocks\n' : ''}✓ Features spread throughout entire chapter

Return the COMPLETE formatted chapter:`;

    let formattedContent = '';
    let attempts = 0;
    const maxAttempts = 2;
    let validationResult = { isValid: false, issues: [] as string[] };

    while (attempts < maxAttempts && !validationResult.isValid) {
      attempts++;
      console.log(`=== FORMAT ATTEMPT ${attempts}/${maxAttempts} ===`);

      // Add retry context if this is a retry
      const retryContext = attempts > 1
        ? `\n\n**RETRY ATTEMPT ${attempts}**: Previous attempt failed validation:\n${validationResult.issues.map(i => `- ${i}`).join('\n')}\n\nYou MUST fix these issues this time!\n\n`
        : '';

      const finalPrompt = retryContext + userPrompt;

      if (provider === 'gemini') {
        formattedContent = await getGeminiFormatted(apiKey, model || 'gemini-exp-1206', finalPrompt);
      } else if (provider === 'claude') {
        formattedContent = await getClaudeFormatted(apiKey, model || 'claude-opus-4-5-20250514', finalPrompt);
      } else if (provider === 'openai') {
        formattedContent = await getOpenAIFormatted(apiKey, model || 'gpt-4o', finalPrompt);
      }

      // Fix common MyST syntax errors (missing curly braces)
      formattedContent = fixMystSyntax(formattedContent);

      // Validate the output - pass selectedFeatures to check ALL are used
      validationResult = validateFormattedOutput(
        formattedContent,
        originalWordCount,
        totalMinFeatures,
        selectedFeatures
      );

      console.log(`Attempt ${attempts} validation:`, validationResult);
    }

    // Count formatted words (excluding MyST directive syntax)
    const strippedContent = stripMystSyntax(formattedContent);
    const formattedWordCount = strippedContent.split(/\s+/).filter(w => w.length > 0).length;

    // Count features applied
    const featuresApplied = countFeaturesApplied(formattedContent);

    const preservationPct = Math.round((formattedWordCount / originalWordCount) * 100);

    console.log('=== AI FORMAT RESULTS ===');
    console.log('Provider:', provider);
    console.log('Model:', model);
    console.log('Original word count:', originalWordCount);
    console.log('Formatted word count:', formattedWordCount);
    console.log('Preservation:', `${preservationPct}%`);
    console.log('Features applied:', featuresApplied);
    console.log('Min features required:', totalMinFeatures);
    console.log('Feature requirement met:', featuresApplied >= totalMinFeatures ? 'YES' : 'NO');
    console.log('=========================');

    // Warn if content was truncated
    if (preservationPct < 90) {
      console.warn(`WARNING: Content may have been truncated! Only ${preservationPct}% preserved.`);
    }
    if (featuresApplied < totalMinFeatures) {
      console.warn(`WARNING: Not enough features applied! Got ${featuresApplied}, needed ${totalMinFeatures}.`);
    }

    return NextResponse.json({
      success: true,
      formattedContent,
      originalWordCount,
      formattedWordCount,
      featuresApplied,
    });

  } catch (error) {
    console.error('AI format error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to format content' },
      { status: 500 }
    );
  }
}

// Validate the formatted output
function validateFormattedOutput(
  content: string,
  originalWordCount: number,
  minFeatures: number,
  selectedFeatures?: string[]
): { isValid: boolean; issues: string[] } {
  const issues: string[] = [];

  // Check word count preservation (allow 10% loss max)
  const strippedContent = stripMystSyntax(content);
  const formattedWordCount = strippedContent.split(/\s+/).filter(w => w.length > 0).length;
  const preservationPct = (formattedWordCount / originalWordCount) * 100;

  if (preservationPct < 90) {
    issues.push(`Content truncated! Only ${preservationPct.toFixed(1)}% preserved (${formattedWordCount}/${originalWordCount} words). You MUST output ALL content.`);
  }

  // Check feature count
  const featureCounts = countFeaturesByType(content);
  const totalFeatures = Object.values(featureCounts).reduce((a, b) => a + b, 0);

  if (totalFeatures < minFeatures) {
    issues.push(`Not enough features! Only ${totalFeatures} applied, need at least ${minFeatures}.`);
  }

  // Check that ALL selected feature categories are used
  if (selectedFeatures && selectedFeatures.length > 0) {
    const missingFeatures: string[] = [];

    for (const feature of selectedFeatures) {
      const isUsed = checkFeatureCategoryUsed(feature, featureCounts);
      if (!isUsed) {
        missingFeatures.push(feature);
      }
    }

    if (missingFeatures.length > 0) {
      issues.push(`Missing selected features: ${missingFeatures.join(', ')}. You MUST use ALL selected features!`);
    }
  }

  // Log detailed feature breakdown
  console.log('Feature breakdown:', featureCounts);
  console.log('Total features applied:', totalFeatures);

  return {
    isValid: issues.length === 0,
    issues,
  };
}

// Check if a feature category was used
function checkFeatureCategoryUsed(category: string, featureCounts: Record<string, number>): boolean {
  switch (category) {
    case 'admonitions':
      return (featureCounts.note + featureCounts.tip + featureCounts.warning +
              featureCounts.danger + featureCounts.caution + featureCounts.important +
              featureCounts.seealso) > 0;
    case 'figures':
      return featureCounts.figure > 0;
    case 'math':
      return featureCounts.math > 0;
    case 'cards':
      return featureCounts.card > 0;
    case 'dropdowns':
      return featureCounts.dropdown > 0;
    case 'tabs':
      return featureCounts.tabset > 0;
    case 'code-blocks':
      // Code blocks are usually preserved from original, not added by formatting
      return true; // Don't fail on this
    case 'tables':
      // Tables are usually preserved from original, not added by formatting
      return true; // Don't fail on this
    case 'exercises':
    case 'quizzes':
    case 'dark-mode':
      // These are more structural/theme features, not inline formatting
      return true; // Don't fail on these
    default:
      return true;
  }
}

// Count features by type
function countFeaturesByType(content: string): Record<string, number> {
  return {
    note: (content.match(/:::{note}/gi) || []).length,
    tip: (content.match(/:::{tip}/gi) || []).length,
    warning: (content.match(/:::{warning}/gi) || []).length,
    danger: (content.match(/:::{danger}/gi) || []).length,
    caution: (content.match(/:::{caution}/gi) || []).length,
    important: (content.match(/:::{important}/gi) || []).length,
    seealso: (content.match(/:::{seealso}/gi) || []).length,
    card: (content.match(/::::{card}/gi) || []).length,
    dropdown: (content.match(/:::{dropdown}/gi) || []).length,
    tabset: (content.match(/:::::{tab-set}/gi) || []).length + (content.match(/::::{tab-set}/gi) || []).length,
    figure: (content.match(/:::{figure}/gi) || []).length,
    math: (content.match(/```{math}/gi) || []).length,
  };
}

// Strip MyST syntax to count actual content words
function stripMystSyntax(content: string): string {
  return content
    // Remove directive blocks markers
    .replace(/^:::{[^}]+}.*$/gm, '')
    .replace(/^:::$/gm, '')
    .replace(/^```{[^}]+}.*$/gm, '')
    .replace(/^```$/gm, '')
    // Remove inline roles
    .replace(/\{[^}]+\}`[^`]+`/g, '')
    // Remove directive options
    .replace(/^:[^:]+:.*$/gm, '')
    .trim();
}

/**
 * Fix common MyST syntax errors from AI output
 * The AI often forgets curly braces: :::note instead of :::{note}
 */
function fixMystSyntax(content: string): string {
  let fixed = content;
  let fixCount = 0;

  // List of MyST directive names to fix
  const directives = [
    'note', 'tip', 'warning', 'danger', 'caution', 'important', 'seealso',
    'hint', 'attention', 'error',
    'dropdown', 'card', 'figure', 'image',
    'tab-set', 'tab-item',
    'math', 'code-block', 'code-cell',
    'admonition', 'sidebar', 'topic',
    'epigraph', 'pull-quote', 'highlights',
    'margin', 'exercise', 'solution'
  ];

  for (const directive of directives) {
    // Fix :::directive (no braces) → :::{directive}
    // Match patterns like :::note, ::::card, :::::tab-set
    const pattern = new RegExp(`(:{2,})${directive}(?!})`, 'gi');
    const replacement = `$1{${directive}}`;

    const before = fixed;
    fixed = fixed.replace(pattern, replacement);

    if (before !== fixed) {
      const matches = before.match(pattern);
      fixCount += matches ? matches.length : 0;
    }
  }

  if (fixCount > 0) {
    console.log(`[SYNTAX FIX] Fixed ${fixCount} MyST directive(s) missing curly braces`);
  }

  return fixed;
}

// Count how many MyST features were applied
function countFeaturesApplied(content: string): number {
  let count = 0;

  // Count directive blocks
  const directiveMatches = content.match(/:::{[^}]+}/g);
  if (directiveMatches) count += directiveMatches.length;

  // Count code directive blocks
  const codeDirectiveMatches = content.match(/```{[^}]+}/g);
  if (codeDirectiveMatches) count += codeDirectiveMatches.length;

  // Count inline roles
  const roleMatches = content.match(/\{[^}]+\}`[^`]+`/g);
  if (roleMatches) count += roleMatches.length;

  return count;
}

async function getGeminiFormatted(apiKey: string, model: string, prompt: string): Promise<string> {
  const modelId = model.replace(/^models\//, '');

  console.log(`[GEMINI] Starting format with model: ${modelId}`);
  console.log(`[GEMINI] Prompt length: ${prompt.length} chars`);

  // Use maximum output tokens available
  // Gemini 2.0 Flash: 8192 output, Gemini 1.5 Pro: 8192, Gemini 2.0 Pro: 65536
  // Use 65536 and let the API cap it if needed
  const maxOutputTokens = 65536;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        contents: [{ parts: [{ text: `${SYSTEM_PROMPT}\n\n${prompt}` }] }],
        generationConfig: {
          maxOutputTokens,
          temperature: 0.2, // Lower temperature for more consistent output
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    console.error('[GEMINI] API error:', error);
    throw new Error(error.error?.message || 'Gemini API request failed');
  }

  const data = await response.json();

  // Log finish reason and token usage
  const candidate = data.candidates?.[0];
  if (candidate) {
    console.log(`[GEMINI] Finish reason: ${candidate.finishReason}`);
    if (data.usageMetadata) {
      console.log(`[GEMINI] Input tokens: ${data.usageMetadata.promptTokenCount}`);
      console.log(`[GEMINI] Output tokens: ${data.usageMetadata.candidatesTokenCount}`);
    }
  }

  const text = candidate?.content?.parts?.[0]?.text || '';
  console.log(`[GEMINI] Output length: ${text.length} chars, ~${text.split(/\s+/).length} words`);

  // Check if output was truncated due to max tokens
  if (candidate?.finishReason === 'MAX_TOKENS') {
    console.warn('[GEMINI] WARNING: Output was truncated due to max tokens limit!');
  }

  return text;
}

async function getClaudeFormatted(apiKey: string, model: string, prompt: string): Promise<string> {
  // Use streaming to handle long content and avoid timeouts
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
      'anthropic-beta': 'output-128k-2025-02-19',
    },
    body: JSON.stringify({
      model,
      max_tokens: 128000, // Maximum with beta header
      stream: true,
      system: SYSTEM_PROMPT,
      messages: [{ role: 'user', content: prompt }],
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    let errorMessage = `Claude API failed: ${response.status}`;
    try {
      const error = JSON.parse(errorText);
      errorMessage = error.error?.message || errorMessage;
    } catch {
      errorMessage = `${errorMessage} - ${errorText.substring(0, 200)}`;
    }
    throw new Error(errorMessage);
  }

  // Read the streaming response
  const reader = response.body?.getReader();
  if (!reader) {
    throw new Error('No response body from Claude API');
  }

  const decoder = new TextDecoder();
  let buffer = '';
  let fullContent = '';

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split('\n');
    buffer = lines.pop() || '';

    for (const line of lines) {
      if (line.startsWith('data: ')) {
        const data = line.slice(6);
        if (data === '[DONE]') continue;

        try {
          const parsed = JSON.parse(data);
          if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
            fullContent += parsed.delta.text;
          }
        } catch {
          // Skip invalid JSON lines
        }
      }
    }
  }

  console.log(`Claude streaming complete. Output length: ${fullContent.length} chars, ~${fullContent.split(/\s+/).length} words`);
  return fullContent;
}

async function getOpenAIFormatted(apiKey: string, model: string, prompt: string): Promise<string> {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model,
      messages: [
        { role: 'system', content: SYSTEM_PROMPT },
        { role: 'user', content: prompt },
      ],
      temperature: 0.3,
      max_tokens: 16384, // Maximum for GPT-4o
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API request failed');
  }

  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

/**
 * AI Suggestion API - Lightweight endpoint for formatting suggestions
 *
 * This sends only paragraph PREVIEWS to the AI (not full content)
 * AI returns suggestions for where to apply MyST formatting
 * The actual formatting is done client-side by the rule-based transformer
 */

import { NextRequest, NextResponse } from 'next/server';

interface ParagraphPreview {
  id: string;
  preview: string; // First ~150 chars
  wordCount: number;
  hasCode: boolean;
  hasList: boolean;
}

interface FormattingSuggestion {
  paragraphId: string;
  type: 'note' | 'tip' | 'warning' | 'important' | 'caution' | 'danger' | 'seealso' | 'card' | 'dropdown' | 'margin';
  title?: string;
  reason: string;
  confidence: number;
}

interface SuggestRequest {
  paragraphs: ParagraphPreview[];
  selectedFeatures: string[];
  provider: 'gemini' | 'claude' | 'openai';
  apiKey: string;
  model?: string;
}

const SYSTEM_PROMPT = `You are a MyST Markdown formatting expert. Analyze paragraph previews and suggest where to apply formatting.

You will receive:
1. A list of paragraph previews (first ~150 chars of each paragraph)
2. The MyST features the user has enabled

Your job is to suggest which paragraphs should be wrapped in which MyST directives.

Guidelines for suggestions:
- **note**: General information, FYI content, side notes, learning objectives
- **tip**: Best practices, pro tips, shortcuts, efficiency advice
- **warning**: Things to avoid, common mistakes, potential issues
- **important**: Critical information that must not be missed
- **caution**: Proceed carefully, potential risks
- **danger**: Serious risks, data loss, security issues
- **seealso**: References, related topics, further reading
- **card**: Case studies, examples, application boxes, highlighted scenarios
- **dropdown**: Long examples, optional details, expandable content
- **margin**: Brief side notes, quick definitions, marginal commentary

Be selective - not every paragraph needs formatting. Focus on:
- Case studies and application examples (card)
- Learning objectives (note)
- Warnings and cautions (warning/caution)
- Tips and best practices (tip)
- Important definitions or key concepts (important)
- Brief asides that could go in margins (margin)

Return a JSON array of suggestions. Only suggest for paragraphs that would genuinely benefit from formatting.`;

export async function POST(request: NextRequest) {
  try {
    const body: SuggestRequest = await request.json();
    const { paragraphs, selectedFeatures, provider, apiKey, model } = body;

    if (!paragraphs || !selectedFeatures || !provider || !apiKey) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    // Build the user prompt with paragraph previews
    const userPrompt = `Here are the paragraph previews to analyze:

${paragraphs.map((p) => `[${p.id}] (${p.wordCount} words${p.hasCode ? ', has code' : ''}${p.hasList ? ', has list' : ''})
"${p.preview}${p.preview.length >= 150 ? '...' : ''}"`).join('\n\n')}

Enabled MyST features: ${selectedFeatures.join(', ')}

Analyze these paragraphs and return a JSON array of formatting suggestions.
Only suggest features that are in the enabled list.
Format: [{"paragraphId": "p1", "type": "note", "title": "Optional Title", "reason": "brief reason", "confidence": 0.8}]

Return ONLY the JSON array, no other text.`;

    let suggestions: FormattingSuggestion[] = [];

    if (provider === 'gemini') {
      suggestions = await getGeminiSuggestions(apiKey, model || 'gemini-2.0-flash', userPrompt);
    } else if (provider === 'claude') {
      suggestions = await getClaudeSuggestions(apiKey, model || 'claude-sonnet-4-20250514', userPrompt);
    } else if (provider === 'openai') {
      suggestions = await getOpenAISuggestions(apiKey, model || 'gpt-4o-mini', userPrompt);
    }

    // Filter to only include enabled features
    // Expand generic IDs to specific types (e.g., 'admonitions' -> all admonition types)
    const expandedFeatures = new Set<string>();
    for (const feature of selectedFeatures) {
      if (feature === 'admonitions') {
        // 'admonitions' enables all admonition types
        ['note', 'tip', 'warning', 'important', 'caution', 'danger', 'seealso'].forEach(t => expandedFeatures.add(t));
      } else if (feature === 'cards') {
        expandedFeatures.add('card');
      } else if (feature === 'dropdowns') {
        expandedFeatures.add('dropdown');
      } else {
        expandedFeatures.add(feature);
      }
    }

    console.log('Selected features (input):', selectedFeatures);
    console.log('Expanded features for filtering:', Array.from(expandedFeatures));
    console.log('Raw AI suggestions:', suggestions);

    const filteredSuggestions = suggestions.filter(s => {
      // Map suggestion types to feature IDs
      const featureMap: Record<string, string> = {
        'note': 'note',
        'tip': 'tip',
        'warning': 'warning',
        'important': 'important',
        'caution': 'caution',
        'danger': 'danger',
        'seealso': 'seealso',
        'card': 'card',
        'dropdown': 'dropdown',
        'margin': 'margin',
      };
      const mappedType = featureMap[s.type] || s.type;
      const isEnabled = expandedFeatures.has(mappedType);
      console.log(`Suggestion type '${s.type}' -> mapped '${mappedType}' -> enabled: ${isEnabled}`);
      return isEnabled;
    });

    console.log('Filtered suggestions count:', filteredSuggestions.length);

    return NextResponse.json({
      success: true,
      suggestions: filteredSuggestions,
      totalParagraphs: paragraphs.length,
      suggestionsCount: filteredSuggestions.length,
    });

  } catch (error) {
    console.error('AI suggestion error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get suggestions' },
      { status: 500 }
    );
  }
}

async function getGeminiSuggestions(apiKey: string, model: string, prompt: string): Promise<FormattingSuggestion[]> {
  // Strip models/ prefix if present
  const modelId = model.replace(/^models\//, '');

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${modelId}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${SYSTEM_PROMPT}\n\n${prompt}` },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: 4096,
          temperature: 0.3, // Lower temperature for more consistent suggestions
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini API request failed');
  }

  const data = await response.json();

  if (!data.candidates?.[0]?.content?.parts?.[0]?.text) {
    return [];
  }

  const text = data.candidates[0].content.parts[0].text;
  return parseJsonResponse(text);
}

async function getClaudeSuggestions(apiKey: string, model: string, prompt: string): Promise<FormattingSuggestion[]> {
  const response = await fetch('https://api.anthropic.com/v1/messages', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': apiKey,
      'anthropic-version': '2023-06-01',
    },
    body: JSON.stringify({
      model,
      max_tokens: 4096,
      system: SYSTEM_PROMPT,
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

async function getOpenAISuggestions(apiKey: string, model: string, prompt: string): Promise<FormattingSuggestion[]> {
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
      max_tokens: 4096,
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

function parseJsonResponse(text: string): FormattingSuggestion[] {
  try {
    // Try to extract JSON array from the response
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

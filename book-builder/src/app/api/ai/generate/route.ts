import { NextRequest, NextResponse } from 'next/server';
import { AIProvider } from '@/types';

interface GenerateRequest {
  provider: AIProvider;
  apiKey: string;
  model: string;
  prompt: string;
  type: 'toc' | 'chapter' | 'content';
  context?: {
    bookTitle?: string;
    bookDescription?: string;
    chapterTitle?: string;
    previousContent?: string;
  };
}

export async function POST(request: NextRequest) {
  try {
    const body: GenerateRequest = await request.json();
    const { provider, apiKey: providedApiKey, model, prompt, type, context } = body;

    // Use provided API key or fall back to environment variable
    let apiKey = providedApiKey;
    if (!apiKey) {
      if (provider === 'claude') {
        apiKey = process.env.ANTHROPIC_API_KEY || '';
      } else if (provider === 'openai') {
        apiKey = process.env.OPENAI_API_KEY || '';
      } else if (provider === 'gemini') {
        apiKey = process.env.GEMINI_API_KEY || '';
      }
    }

    if (!provider || !apiKey || !model || !prompt) {
      console.error('Missing fields:', { provider: !!provider, apiKey: !!apiKey, model: !!model, prompt: !!prompt });
      return NextResponse.json(
        { error: `Missing required fields. API key ${apiKey ? 'provided' : 'missing for ' + provider}` },
        { status: 400 }
      );
    }

    const systemPrompt = getSystemPrompt(type, context);

    // Use streaming for Claude to avoid Netlify timeout
    if (provider === 'claude') {
      return streamWithClaude(apiKey, model, systemPrompt, prompt, type);
    }

    // Non-streaming for other providers (can add streaming later if needed)
    let content: string;
    switch (provider) {
      case 'openai':
        content = await generateWithOpenAI(apiKey, model, systemPrompt, prompt, type);
        break;
      case 'gemini':
        content = await generateWithGemini(apiKey, model, systemPrompt, prompt, type);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid provider' },
          { status: 400 }
        );
    }

    return NextResponse.json({ content });
  } catch (error) {
    console.error('Generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Generation failed' },
      { status: 500 }
    );
  }
}

function getSystemPrompt(
  type: 'toc' | 'chapter' | 'content',
  context?: GenerateRequest['context']
): string {
  switch (type) {
    case 'toc':
      return `You are an expert technical book author. Generate a table of contents as a JSON array.

CRITICAL: Output COMPACT JSON with NO descriptions to avoid truncation. Use this minimal structure:
[{"id":"ch-1","title":"Chapter Title","slug":"chapter-slug","children":[{"id":"ch-1-1","title":"Sub Title","slug":"sub-slug"}]}]

Rules:
- NO description field (saves tokens)
- Short IDs: ch-1, ch-1-1, ch-2, etc.
- Slugs: lowercase with hyphens
- Keep hierarchy flat when possible (max 2 levels deep)
- Aim for 8-15 main chapters
- Output ONLY valid JSON array, no markdown, no explanation
- Ensure JSON is COMPLETE - do not truncate`;

    case 'chapter':
      return `You are an expert technical writer creating content for the book "${context?.bookTitle || 'Technical Book'}".

Book Description: ${context?.bookDescription || 'A technical book'}

You are writing the chapter: "${context?.chapterTitle || 'Chapter'}"

Guidelines:
- Write in MyST Markdown format
- Use appropriate headings (## for main sections, ### for subsections)
- Include code examples with proper syntax highlighting using triple backticks and language identifiers
- Use admonitions for important notes:
  \`\`\`{note}
  Important information here
  \`\`\`
- Include practical examples and explanations
- Use cross-references where appropriate
- Add figures and diagrams descriptions where helpful
- Make content accessible and educational
- Include exercises or practice sections where appropriate

Write comprehensive, well-structured content that teaches the reader effectively.`;

    case 'content':
      return `You are a technical writing assistant. Help improve and expand the provided content while maintaining MyST Markdown format.

Context:
- Book: ${context?.bookTitle || 'Technical Book'}
- Chapter: ${context?.chapterTitle || 'Chapter'}

Previous content for reference:
${context?.previousContent || 'No previous content'}

Maintain consistency with the existing style and format.`;

    default:
      return 'You are a helpful assistant.';
  }
}

// Streaming response for Claude - prevents Netlify timeout
function streamWithClaude(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  type: 'toc' | 'chapter' | 'content'
): Response {
  const maxTokens = type === 'toc' ? 4096 : 16384;

  console.log(`Streaming Claude API with model: ${model}, maxTokens: ${maxTokens}`);

  const encoder = new TextEncoder();

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const response = await fetch('https://api.anthropic.com/v1/messages', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'x-api-key': apiKey,
            'anthropic-version': '2023-06-01',
          },
          body: JSON.stringify({
            model,
            max_tokens: maxTokens,
            stream: true,
            system: systemPrompt,
            messages: [{ role: 'user', content: userPrompt }],
          }),
        });

        if (!response.ok) {
          const errorText = await response.text();
          console.error('Claude API error:', response.status, errorText);
          let errorMessage = `Claude API failed: ${response.status}`;
          try {
            const error = JSON.parse(errorText);
            errorMessage = error.error?.message || errorMessage;
          } catch {
            errorMessage = `${errorMessage} - ${errorText.substring(0, 200)}`;
          }
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: errorMessage })}\n\n`));
          controller.close();
          return;
        }

        const reader = response.body?.getReader();
        if (!reader) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: 'No response body' })}\n\n`));
          controller.close();
          return;
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

                // Handle content_block_delta events
                if (parsed.type === 'content_block_delta' && parsed.delta?.text) {
                  fullContent += parsed.delta.text;
                  // Send chunk to client
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ chunk: parsed.delta.text })}\n\n`));
                }

                // Handle message_stop to send final content
                if (parsed.type === 'message_stop') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, content: fullContent })}\n\n`));
                }

                // Handle errors
                if (parsed.type === 'error') {
                  controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: parsed.error?.message || 'Stream error' })}\n\n`));
                }
              } catch {
                // Skip invalid JSON lines
              }
            }
          }
        }

        // Ensure we send the final content if message_stop wasn't received
        if (fullContent && !buffer.includes('message_stop')) {
          controller.enqueue(encoder.encode(`data: ${JSON.stringify({ done: true, content: fullContent })}\n\n`));
        }

        controller.close();
      } catch (error) {
        console.error('Stream error:', error);
        controller.enqueue(encoder.encode(`data: ${JSON.stringify({ error: error instanceof Error ? error.message : 'Stream failed' })}\n\n`));
        controller.close();
      }
    },
  });

  return new Response(stream, {
    headers: {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      'Connection': 'keep-alive',
    },
  });
}

async function generateWithOpenAI(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  type: 'toc' | 'chapter' | 'content'
): Promise<string> {
  // GPT-4o supports up to 16K output, GPT-4 Turbo up to 4K
  // Use generous limits to avoid truncation
  const maxTokens = type === 'toc' ? 16384 : 8192;

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
        { role: 'user', content: userPrompt },
      ],
      max_tokens: maxTokens,
      temperature: 0.7,
    }),
  });

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'OpenAI API request failed');
  }

  const data = await response.json();
  return data.choices[0].message.content;
}

async function generateWithGemini(
  apiKey: string,
  model: string,
  systemPrompt: string,
  userPrompt: string,
  type: 'toc' | 'chapter' | 'content'
): Promise<string> {
  // Gemini models support generous output limits
  // Use high values to avoid truncation
  const maxTokens = type === 'toc' ? 32768 : 8192;

  const response = await fetch(
    `https://generativelanguage.googleapis.com/v1/models/${model}:generateContent?key=${apiKey}`,
    {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        contents: [
          {
            parts: [
              { text: `${systemPrompt}\n\n${userPrompt}` },
            ],
          },
        ],
        generationConfig: {
          maxOutputTokens: maxTokens,
          temperature: 0.7,
        },
      }),
    }
  );

  if (!response.ok) {
    const error = await response.json();
    throw new Error(error.error?.message || 'Gemini API request failed');
  }

  const data = await response.json();
  return data.candidates[0].content.parts[0].text;
}

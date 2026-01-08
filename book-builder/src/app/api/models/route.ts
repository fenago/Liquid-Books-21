import { NextRequest, NextResponse } from 'next/server';
import { AIProvider, AIModel } from '@/types';

export async function POST(request: NextRequest) {
  try {
    const { provider, apiKey: providedApiKey } = await request.json();

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

    if (!provider || !apiKey) {
      return NextResponse.json(
        { error: 'Provider and API key are required' },
        { status: 400 }
      );
    }

    let models: AIModel[] = [];

    switch (provider as AIProvider) {
      case 'claude':
        models = await getClaudeModels(apiKey);
        break;
      case 'openai':
        models = await getOpenAIModels(apiKey);
        break;
      case 'gemini':
        models = await getGeminiModels(apiKey);
        break;
      default:
        return NextResponse.json(
          { error: 'Invalid provider' },
          { status: 400 }
        );
    }

    return NextResponse.json({ models });
  } catch (error) {
    console.error('Error fetching models:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to fetch models' },
      { status: 500 }
    );
  }
}

async function getClaudeModels(apiKey: string): Promise<AIModel[]> {
  try {
    // Use Anthropic's models API to get actual available models
    const response = await fetch('https://api.anthropic.com/v1/models', {
      headers: {
        'x-api-key': apiKey,
        'anthropic-version': '2023-06-01',
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Invalid API key');
    }

    const data = await response.json();

    // Filter to only claude models and format them
    const claudeModels = data.data
      .filter((model: { id: string; type: string }) =>
        model.type === 'model' && model.id.includes('claude')
      )
      .map((model: { id: string; display_name?: string }) => ({
        id: model.id,
        name: model.display_name || formatClaudeModelName(model.id),
        provider: 'claude' as AIProvider,
      }))
      .sort((a: AIModel, b: AIModel) => {
        // Sort newer models first (claude-4 before claude-3.5 before claude-3)
        const aVersion = extractClaudeVersion(a.id);
        const bVersion = extractClaudeVersion(b.id);
        if (bVersion !== aVersion) return bVersion - aVersion;
        return a.id.localeCompare(b.id);
      });

    return claudeModels;
  } catch (error) {
    throw new Error(`Claude API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function formatClaudeModelName(modelId: string): string {
  // Convert claude-3-5-sonnet-20241022 to "Claude 3.5 Sonnet"
  return modelId
    .replace(/^claude-/, 'Claude ')
    .replace(/-(\d+)-(\d+)-/, ' $1.$2 ')
    .replace(/-(\d+)-/, ' $1 ')
    .replace(/-\d{8}$/, '')
    .replace(/-/g, ' ')
    .replace(/\b\w/g, c => c.toUpperCase());
}

function extractClaudeVersion(modelId: string): number {
  // Extract version number for sorting (4 > 3.5 > 3)
  if (modelId.includes('opus-4') || modelId.includes('sonnet-4')) return 4;
  if (modelId.includes('3-5') || modelId.includes('3.5')) return 3.5;
  if (modelId.includes('claude-3')) return 3;
  return 0;
}

async function getOpenAIModels(apiKey: string): Promise<AIModel[]> {
  try {
    const response = await fetch('https://api.openai.com/v1/models', {
      headers: {
        Authorization: `Bearer ${apiKey}`,
      },
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Invalid API key');
    }

    const data = await response.json();

    // Filter to only GPT models suitable for text generation
    const gptModels = data.data
      .filter((model: { id: string }) =>
        model.id.includes('gpt-4') || model.id.includes('gpt-3.5')
      )
      .map((model: { id: string }) => ({
        id: model.id,
        name: formatModelName(model.id),
        provider: 'openai' as AIProvider,
      }))
      .sort((a: AIModel, b: AIModel) => {
        // Sort by model version (4 before 3.5)
        if (a.id.includes('gpt-4') && !b.id.includes('gpt-4')) return -1;
        if (!a.id.includes('gpt-4') && b.id.includes('gpt-4')) return 1;
        return a.id.localeCompare(b.id);
      });

    return gptModels;
  } catch (error) {
    throw new Error(`OpenAI API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

async function getGeminiModels(apiKey: string): Promise<AIModel[]> {
  try {
    // Use v1beta to get all models including newest versions
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models?key=${apiKey}`
    );

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error?.message || 'Invalid API key');
    }

    const data = await response.json();

    // Return ALL models - no filtering
    const allModels = data.models
      .map((model: { name: string; displayName: string }) => ({
        id: model.name.replace('models/', ''),
        name: model.displayName || model.name.replace('models/', ''),
        provider: 'gemini' as AIProvider,
      }));

    return allModels;
  } catch (error) {
    throw new Error(`Gemini API error: ${error instanceof Error ? error.message : 'Unknown error'}`);
  }
}

function formatModelName(modelId: string): string {
  return modelId
    .replace(/-/g, ' ')
    .replace(/gpt/gi, 'GPT')
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

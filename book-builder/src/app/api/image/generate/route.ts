import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'edge';
export const maxDuration = 60;

interface ImageGenerateRequest {
  apiKey: string;
  model: 'gemini-2.5-flash-image' | 'gemini-3-pro-image-preview';
  prompt: string;
  aspectRatio?: '1:1' | '3:4' | '4:3' | '9:16' | '16:9';
  bookTitle?: string;
  bookAuthor?: string;
  systemPrompt?: string;
}

export async function POST(request: NextRequest) {
  try {
    const body: ImageGenerateRequest = await request.json();
    const { apiKey: providedApiKey, model, prompt, aspectRatio = '3:4', bookTitle, bookAuthor, systemPrompt } = body;

    // Use provided API key or fall back to environment variable
    const apiKey = providedApiKey || process.env.GEMINI_API_KEY || '';

    if (!apiKey || !prompt) {
      return NextResponse.json(
        { error: 'Missing required fields: apiKey and prompt are required' },
        { status: 400 }
      );
    }

    // Build the cover prompt - use custom system prompt if provided, otherwise use default
    let coverPrompt: string;
    if (systemPrompt) {
      // Replace placeholders in custom system prompt
      coverPrompt = systemPrompt
        .replace(/\{title\}/g, bookTitle || 'Technical Book')
        .replace(/\{author\}/g, bookAuthor || 'Unknown Author')
        .replace(/\{prompt\}/g, prompt);
    } else {
      // Default prompt
      const title = bookTitle || 'Technical Book';
      const author = bookAuthor || 'Unknown Author';
      coverPrompt = `Create a professional book cover image.

Book Details:
- Title: "${title}"
- Author: "${author}"

Style requirements:
- Professional, modern book cover design
- Clean, visually striking composition
- Include the book title "${title}" prominently at the top or center
- Include the author name "${author}" on the cover (typically near the bottom)
- High quality, suitable for publishing
- Appropriate for the book's subject matter
- Typography should be elegant and readable

Cover concept: ${prompt}

Create a complete book cover with both the title and author name integrated into the design.`;
    }

    // Gemini image generation API endpoint
    // Using the v1beta endpoint which supports image generation models
    const response = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`,
      {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          contents: [
            {
              parts: [
                { text: coverPrompt },
              ],
            },
          ],
          generationConfig: {
            responseModalities: ['TEXT', 'IMAGE'],
          },
        }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error('Gemini image generation error:', errorData);
      return NextResponse.json(
        { error: errorData.error?.message || `Gemini API request failed with status ${response.status}` },
        { status: response.status }
      );
    }

    const data = await response.json();

    // Check for valid response structure
    if (!data.candidates || data.candidates.length === 0) {
      if (data.promptFeedback?.blockReason) {
        return NextResponse.json(
          { error: `Content blocked by safety filters: ${data.promptFeedback.blockReason}` },
          { status: 400 }
        );
      }
      return NextResponse.json(
        { error: 'No image generated. Try a different prompt.' },
        { status: 400 }
      );
    }

    const candidate = data.candidates[0];

    // Check for safety blocks
    if (candidate.finishReason === 'SAFETY') {
      return NextResponse.json(
        { error: 'Image generation blocked by safety filters. Try a different prompt.' },
        { status: 400 }
      );
    }

    // Extract the image from the response
    // Gemini returns images as base64-encoded data in the parts array
    const parts = candidate.content?.parts || [];
    let imageData: string | null = null;
    let mimeType: string = 'image/png';

    for (const part of parts) {
      if (part.inlineData) {
        imageData = part.inlineData.data;
        mimeType = part.inlineData.mimeType || 'image/png';
        break;
      }
    }

    if (!imageData) {
      // If no image in response, return the text response if available
      const textPart = parts.find((p: { text?: string }) => p.text);
      return NextResponse.json(
        { error: textPart?.text || 'No image generated. The model may not support image generation.' },
        { status: 400 }
      );
    }

    // Return the base64 image data
    return NextResponse.json({
      success: true,
      image: {
        data: imageData,
        mimeType: mimeType,
        dataUrl: `data:${mimeType};base64,${imageData}`,
      },
    });
  } catch (error) {
    console.error('Image generation error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Image generation failed' },
      { status: 500 }
    );
  }
}

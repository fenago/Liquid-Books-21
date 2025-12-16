import { NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function GET() {
  try {
    const token = process.env.GITHUB_PAT;

    if (!token) {
      return NextResponse.json(
        { valid: false, error: 'No default GitHub PAT configured' },
        { status: 400 }
      );
    }

    const octokit = new Octokit({ auth: token });

    // Validate the token by fetching the authenticated user
    const { data: user } = await octokit.users.getAuthenticated();

    return NextResponse.json({
      valid: true,
      username: user.login,
    });
  } catch (error) {
    console.error('GitHub PAT validation error:', error);
    return NextResponse.json(
      { valid: false, error: 'Invalid or expired GitHub PAT' },
      { status: 401 }
    );
  }
}

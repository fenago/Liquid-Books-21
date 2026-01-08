import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';
import { Chapter, BookConfig } from '@/types';
import { generateMystConfig } from '@/lib/myst-config';

interface UpdateChapterRequest {
  token?: string;
  username: string;
  repoName: string;
  chapter: Chapter;
  bookConfig?: BookConfig; // Optional: if provided, also update myst.yml
}

export async function POST(request: NextRequest) {
  try {
    const body: UpdateChapterRequest = await request.json();
    const { token: providedToken, username, repoName, chapter, bookConfig } = body;

    // Use provided token or fall back to environment variable
    const token = providedToken || process.env.GITHUB_PAT;

    if (!token || !username || !repoName || !chapter) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const octokit = new Octokit({ auth: token });

    // Generate the file path
    const filePath = `${chapter.slug}.md`;

    // Generate the file content
    const content = generateChapterContent(chapter);

    // Get the current file to get its SHA (needed for updates)
    let sha: string | undefined;
    try {
      const { data: existingFile } = await octokit.repos.getContent({
        owner: username,
        repo: repoName,
        path: filePath,
      });

      if ('sha' in existingFile) {
        sha = existingFile.sha;
      }
    } catch (error) {
      // File doesn't exist yet, that's okay for new chapters
      console.log(`File ${filePath} does not exist, will create new file`);
    }

    // Create or update the file
    const updateResponse = await octokit.repos.createOrUpdateFileContents({
      owner: username,
      repo: repoName,
      path: filePath,
      message: `Update chapter: ${chapter.title}`,
      content: Buffer.from(content).toString('base64'),
      sha,
    });

    let commitSha = updateResponse.data.commit.sha;
    const fileSha = updateResponse.data.content?.sha;

    // Also update myst.yml if bookConfig is provided
    // This ensures site configuration (logo, base URL, etc.) stays in sync
    if (bookConfig) {
      try {
        const mystContent = generateMystConfig(bookConfig);

        // Get current myst.yml SHA
        let mystSha: string | undefined;
        try {
          const { data: mystFile } = await octokit.repos.getContent({
            owner: username,
            repo: repoName,
            path: 'myst.yml',
          });
          if ('sha' in mystFile) {
            mystSha = mystFile.sha;
          }
        } catch {
          // myst.yml doesn't exist, will create new
        }

        const mystResponse = await octokit.repos.createOrUpdateFileContents({
          owner: username,
          repo: repoName,
          path: 'myst.yml',
          message: `Update myst.yml configuration`,
          content: Buffer.from(mystContent).toString('base64'),
          sha: mystSha,
        });

        // Use the myst.yml commit SHA as the final commit
        commitSha = mystResponse.data.commit.sha;
        console.log('Updated myst.yml with latest configuration');
      } catch (mystError) {
        console.error('Failed to update myst.yml:', mystError);
        // Continue even if myst.yml update fails
      }
    }

    // Verify the file was actually pushed by fetching it back
    let verified = false;
    let verifiedContent = '';
    try {
      const { data: verifyFile } = await octokit.repos.getContent({
        owner: username,
        repo: repoName,
        path: filePath,
        ref: commitSha, // Get the file at the specific commit
      });

      if ('sha' in verifyFile && verifyFile.sha === fileSha) {
        verified = true;
        // Decode content to verify it matches
        if ('content' in verifyFile && verifyFile.content) {
          verifiedContent = Buffer.from(verifyFile.content, 'base64').toString('utf-8');
        }
      }
    } catch (verifyError) {
      console.error('Verification failed:', verifyError);
    }

    const fileUrl = `https://github.com/${username}/${repoName}/blob/main/${filePath}`;
    const commitUrl = `https://github.com/${username}/${repoName}/commit/${commitSha}`;
    const actionsUrl = `https://github.com/${username}/${repoName}/actions`;

    // Check if a workflow run was triggered by this commit
    let workflowTriggered = false;
    let workflowRunUrl: string | undefined;
    try {
      // Wait a moment for GitHub to register the workflow
      await new Promise(resolve => setTimeout(resolve, 2000));

      // Get the latest workflow runs
      const { data: workflowRuns } = await octokit.actions.listWorkflowRunsForRepo({
        owner: username,
        repo: repoName,
        per_page: 5,
      });

      // Check if there's a run triggered by our commit
      const matchingRun = workflowRuns.workflow_runs.find(
        run => run.head_sha === commitSha
      );

      if (matchingRun) {
        workflowTriggered = true;
        workflowRunUrl = matchingRun.html_url;
      }
    } catch (workflowError) {
      console.error('Failed to check workflow status:', workflowError);
    }

    return NextResponse.json({
      success: true,
      verified,
      message: `Chapter "${chapter.title}" saved successfully`,
      commitSha,
      fileSha,
      fileUrl,
      commitUrl,
      actionsUrl,
      workflowTriggered,
      workflowRunUrl,
      contentLength: content.length,
      verifiedContentLength: verifiedContent.length,
    });
  } catch (error) {
    console.error('GitHub update error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to update chapter' },
      { status: 500 }
    );
  }
}

function generateChapterContent(chapter: Chapter): string {
  return `---
title: ${chapter.title}
---

# ${chapter.title}

${chapter.description ? `> ${chapter.description}\n` : ''}

${chapter.content || ''}
`;
}

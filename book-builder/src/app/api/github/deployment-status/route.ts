import { NextRequest, NextResponse } from 'next/server';
import { Octokit } from '@octokit/rest';

export async function POST(request: NextRequest) {
  try {
    const { token, username, repoName } = await request.json();

    if (!token || !username || !repoName) {
      return NextResponse.json(
        { error: 'Missing required fields' },
        { status: 400 }
      );
    }

    const octokit = new Octokit({ auth: token });

    // First, check workflow runs to get better status info
    let workflowStatus = 'unknown';
    let workflowConclusion = null;
    let workflowRunUrl = null;

    try {
      const { data: runs } = await octokit.actions.listWorkflowRuns({
        owner: username,
        repo: repoName,
        workflow_id: 'deploy.yml',
        per_page: 1,
      });

      if (runs.workflow_runs.length > 0) {
        const latestRun = runs.workflow_runs[0];
        workflowStatus = latestRun.status || 'unknown';
        workflowConclusion = latestRun.conclusion;
        workflowRunUrl = latestRun.html_url;
      } else {
        workflowStatus = 'not_started';
      }
    } catch (e) {
      console.log('Could not get workflow runs:', e);
      workflowStatus = 'not_found';
    }

    // Check if Pages is enabled and get status
    try {
      const { data: pages } = await octokit.repos.getPages({
        owner: username,
        repo: repoName,
      });

      // Get the latest deployment
      const { data: deployments } = await octokit.repos.listDeployments({
        owner: username,
        repo: repoName,
        environment: 'github-pages',
        per_page: 1,
      });

      let deploymentStatus = 'unknown';
      let deploymentUrl = pages.html_url;

      if (deployments.length > 0) {
        const { data: statuses } = await octokit.repos.listDeploymentStatuses({
          owner: username,
          repo: repoName,
          deployment_id: deployments[0].id,
          per_page: 1,
        });

        if (statuses.length > 0) {
          deploymentStatus = statuses[0].state;
          if (statuses[0].environment_url) {
            deploymentUrl = statuses[0].environment_url;
          }
        }
      }

      // Also check the Pages build status
      try {
        const { data: latestBuild } = await octokit.repos.getLatestPagesBuild({
          owner: username,
          repo: repoName,
        });

        return NextResponse.json({
          status: pages.status,
          url: deploymentUrl,
          buildStatus: latestBuild.status,
          deploymentStatus,
          workflowStatus,
          workflowConclusion,
          workflowRunUrl,
          isLive: pages.status === 'built' && latestBuild.status === 'built',
        });
      } catch {
        // No builds yet - check if workflow is at least running
        const isBuilding = workflowStatus === 'in_progress' || workflowStatus === 'queued';
        return NextResponse.json({
          status: pages.status,
          url: deploymentUrl,
          buildStatus: isBuilding ? 'building' : 'pending',
          deploymentStatus,
          workflowStatus,
          workflowConclusion,
          workflowRunUrl,
          isLive: false,
        });
      }
    } catch (error: unknown) {
      const pagesError = error as { status?: number };
      if (pagesError.status === 404) {
        // Pages not enabled yet
        return NextResponse.json({
          status: 'not_enabled',
          url: null,
          buildStatus: 'pending',
          deploymentStatus: 'pending',
          workflowStatus,
          workflowConclusion,
          workflowRunUrl,
          isLive: false,
        });
      }
      throw error;
    }
  } catch (error) {
    console.error('Deployment status error:', error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : 'Failed to get deployment status' },
      { status: 500 }
    );
  }
}

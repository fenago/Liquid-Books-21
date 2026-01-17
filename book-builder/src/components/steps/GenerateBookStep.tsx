'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { useBookStore } from '@/store/useBookStore';
import { useBooks } from '@/hooks/useBooks';
import {
  ArrowLeft,
  Rocket,
  Loader2,
  CheckCircle,
  XCircle,
  ExternalLink,
  Github,
  Globe,
  FileText,
  Settings,
  Workflow,
  RefreshCw,
  Puzzle,
} from 'lucide-react';
import { BOOK_LEVEL_FEATURES } from '@/data/bookLevelFeatures';
import { BookLevelFeature } from '@/types';

type GenerationStatus = 'idle' | 'generating' | 'success' | 'error';

type DeploymentStatus = 'checking' | 'building' | 'deploying' | 'live' | 'error' | 'failed' | 'pending';

interface GenerationResult {
  repoUrl?: string;
  deployedUrl?: string;
  error?: string;
  isRateLimit?: boolean;
  retryAfter?: number;
}

interface DeploymentInfo {
  status: string;
  url: string | null;
  buildStatus: string;
  deploymentStatus: string;
  workflowStatus?: string;
  workflowConclusion?: string | null;
  workflowRunUrl?: string | null;
  isLive: boolean;
}

export function GenerateBookStep() {
  const { bookConfig, setCurrentStep } = useBookStore();
  const { saveBookConfig } = useBooks();
  const [status, setStatus] = useState<GenerationStatus>('idle');
  const [saveError, setSaveError] = useState<string | null>(null);
  const [result, setResult] = useState<GenerationResult | null>(null);
  const [currentTask, setCurrentTask] = useState('');
  const [deploymentStatus, setDeploymentStatus] = useState<DeploymentStatus>('pending');
  const [deploymentInfo, setDeploymentInfo] = useState<DeploymentInfo | null>(null);
  const [pollCount, setPollCount] = useState(0);
  const pollCountRef = useRef(0);
  const [rateLimitCountdown, setRateLimitCountdown] = useState<number | null>(null);

  // Countdown timer for rate limit
  useEffect(() => {
    if (!result?.isRateLimit || !result?.retryAfter) return;

    const updateCountdown = () => {
      const remaining = Math.max(0, Math.ceil((result.retryAfter! - Date.now()) / 1000));
      setRateLimitCountdown(remaining);

      if (remaining <= 0) {
        setRateLimitCountdown(null);
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);

    return () => clearInterval(interval);
  }, [result?.isRateLimit, result?.retryAfter]);

  // Poll for deployment status after successful generation
  const checkDeploymentStatus = useCallback(async () => {
    if (!bookConfig.github) return;

    try {
      const response = await fetch('/api/github/deployment-status', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: bookConfig.github.token,
          username: bookConfig.github.username,
          repoName: bookConfig.github.repoName,
        }),
      });

      if (!response.ok) {
        throw new Error('Failed to check deployment status');
      }

      const data: DeploymentInfo = await response.json();
      setDeploymentInfo(data);

      // Check if site is live - either through isLive flag OR workflow+deployment both successful
      if (data.isLive || (data.workflowConclusion === 'success' && data.deploymentStatus === 'success')) {
        setDeploymentStatus('live');
        return true; // Stop polling - success!
      } else if (data.workflowConclusion === 'failure') {
        // Workflow failed - show error and STOP polling
        setDeploymentStatus('failed');
        return true; // Stop polling - failure!
      } else if (data.workflowStatus === 'in_progress' || data.workflowStatus === 'queued') {
        // Workflow is running
        setDeploymentStatus('building');
      } else if (data.workflowStatus === 'not_started' || data.workflowStatus === 'not_found') {
        // Workflow hasn't started yet
        setDeploymentStatus('pending');
      } else if (data.status === 'not_enabled') {
        setDeploymentStatus('pending');
      } else if (data.buildStatus === 'building' || data.deploymentStatus === 'in_progress') {
        setDeploymentStatus('building');
      } else if (data.deploymentStatus === 'queued' || data.deploymentStatus === 'pending') {
        setDeploymentStatus('deploying');
      } else if (data.workflowConclusion === 'success' && !data.isLive) {
        // Workflow completed but not live yet - deploying
        setDeploymentStatus('deploying');
      } else {
        setDeploymentStatus('checking');
      }

      return false; // Continue polling
    } catch (error) {
      console.error('Deployment status check error:', error);
      setDeploymentStatus('error');
      return true; // Stop polling on error
    }
  }, [bookConfig.github]);

  // Start polling when generation succeeds
  useEffect(() => {
    if (status !== 'success' || !bookConfig.github) return;

    setDeploymentStatus('checking');
    pollCountRef.current = 0;
    setPollCount(0);
    let isActive = true;

    const poll = async () => {
      if (!isActive) return;

      const shouldStop = await checkDeploymentStatus();
      pollCountRef.current += 1;
      setPollCount(pollCountRef.current);

      // Stop if: shouldStop is true (success or failure), or max retries reached
      // With 15 second intervals, 40 polls = 10 minutes
      if (shouldStop || pollCountRef.current >= 40) {
        return; // Stop polling
      }

      if (isActive) {
        // Poll every 15 seconds for up to 10 minutes
        setTimeout(poll, 15000);
      }
    };

    // Start polling after 15 seconds to let GitHub process (saves API calls)
    const initialDelay = setTimeout(poll, 15000);

    return () => {
      isActive = false;
      clearTimeout(initialDelay);
    };
  }, [status, bookConfig.github, checkDeploymentStatus]);

  const tasks = [
    { id: 'repo', label: 'Creating GitHub repository', icon: Github },
    { id: 'config', label: 'Generating MyST configuration', icon: Settings },
    { id: 'chapters', label: 'Creating chapter files', icon: FileText },
    { id: 'workflow', label: 'Setting up GitHub Actions', icon: Workflow },
    { id: 'pages', label: 'Enabling GitHub Pages', icon: Globe },
    { id: 'save', label: 'Saving book to library', icon: FileText },
  ];

  const handleGenerate = async () => {
    if (!bookConfig.github) return;

    setStatus('generating');
    setCurrentTask('repo');

    try {
      // Simulate task progression for UX
      const taskDelay = async (taskId: string, delay: number) => {
        setCurrentTask(taskId);
        await new Promise((resolve) => setTimeout(resolve, delay));
      };

      await taskDelay('repo', 500);

      const response = await fetch('/api/github', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          token: bookConfig.github.token,
          repoName: bookConfig.github.repoName,
          bookConfig,
        }),
      });

      await taskDelay('config', 800);
      await taskDelay('chapters', 1000);
      await taskDelay('workflow', 600);
      await taskDelay('pages', 400);

      const data = await response.json();

      if (!response.ok) {
        // Handle rate limit specifically
        if (response.status === 429 || data.isRateLimit) {
          setStatus('error');
          setResult({
            error: data.error || 'GitHub API rate limit exceeded.',
            isRateLimit: true,
            retryAfter: data.retryAfter || Date.now() + 60000,
          });
          return;
        }
        throw new Error(data.error || 'Failed to create repository');
      }

      // Save book to database (library)
      await taskDelay('save', 500);
      try {
        const savedBook = await saveBookConfig(bookConfig);
        if (!savedBook) {
          console.warn('Book was not saved to library - user may not be authenticated');
          setSaveError('Book created on GitHub but not saved to library. Sign in to save books.');
        }
      } catch (saveErr) {
        console.error('Error saving book to library:', saveErr);
        setSaveError('Book created on GitHub but failed to save to library.');
      }

      setStatus('success');
      setResult({
        repoUrl: data.repoUrl,
        deployedUrl: data.deployedUrl,
      });
    } catch (error) {
      setStatus('error');
      setResult({
        error: error instanceof Error ? error.message : 'An unexpected error occurred',
      });
    }
  };

  const handleBack = () => {
    setCurrentStep('github-setup');
  };

  const handleEditChapters = () => {
    setCurrentStep('chapter-editor');
  };

  const enabledFeatures = bookConfig.features.filter((f) => f.enabled);

  // Get book-level features (use defaults if not set)
  const bookFeatures = bookConfig.bookFeatures || BOOK_LEVEL_FEATURES;
  const enabledBookFeatures = bookFeatures.filter((f: BookLevelFeature) => f.enabled);

  // Group book-level features by category
  const groupedBookFeatures = enabledBookFeatures.reduce((acc: Record<string, BookLevelFeature[]>, feature: BookLevelFeature) => {
    const category = feature.category || 'other';
    if (!acc[category]) acc[category] = [];
    acc[category].push(feature);
    return acc;
  }, {} as Record<string, BookLevelFeature[]>);

  return (
    <div className="space-y-8">
      <div>
        <h2 className="text-2xl font-bold text-gray-900 dark:text-white mb-2">
          Generate Your Book
        </h2>
        <p className="text-gray-600 dark:text-gray-400">
          Review your book configuration and generate the MyST Markdown book skeleton.
        </p>
      </div>

      {/* Book Summary */}
      <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6 space-y-4">
        <h3 className="font-semibold text-gray-900 dark:text-white">Book Summary</h3>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-gray-500 dark:text-gray-400">Title:</span>
            <p className="font-medium text-gray-900 dark:text-white">{bookConfig.title}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Author:</span>
            <p className="font-medium text-gray-900 dark:text-white">{bookConfig.author}</p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Chapters:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {bookConfig.tableOfContents.chapters.length} main chapters
            </p>
          </div>
          <div>
            <span className="text-gray-500 dark:text-gray-400">Features:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {enabledFeatures.length} enabled
            </p>
          </div>
          <div className="md:col-span-2">
            <span className="text-gray-500 dark:text-gray-400">Repository:</span>
            <p className="font-medium text-gray-900 dark:text-white">
              {bookConfig.github?.username}/{bookConfig.github?.repoName}
            </p>
          </div>
        </div>

        {/* Enabled Chapter Features (MyST) */}
        {enabledFeatures.length > 0 && (
          <div>
            <span className="text-sm text-gray-500 dark:text-gray-400">Chapter Features (MyST):</span>
            <div className="flex flex-wrap gap-2 mt-2">
              {enabledFeatures.map((feature) => (
                <span
                  key={feature.id}
                  className="px-2 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded"
                >
                  {feature.name}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Enabled Book-Level Features */}
        {enabledBookFeatures.length > 0 && (
          <div>
            <div className="flex items-center gap-2 mb-2">
              <Puzzle className="h-4 w-4 text-purple-500" />
              <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                Book Configuration ({enabledBookFeatures.length} features enabled):
              </span>
            </div>
            <div className="space-y-3">
              {Object.entries(groupedBookFeatures).map(([category, features]) => (
                <div key={category}>
                  <span className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                    {category.replace('-', ' ')}
                  </span>
                  <div className="flex flex-wrap gap-2 mt-1">
                    {(features as BookLevelFeature[]).map((feature) => (
                      <span
                        key={feature.id}
                        className="px-2 py-1 text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded"
                        title={feature.description}
                      >
                        {feature.name}
                        {feature.configKey && (
                          <span className="ml-1 opacity-60">✓</span>
                        )}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Generation Progress */}
      {status !== 'idle' && (
        <div className="space-y-4">
          <h3 className="font-semibold text-gray-900 dark:text-white">Generation Progress</h3>
          <div className="space-y-3">
            {tasks.map((task) => {
              const taskIndex = tasks.findIndex((t) => t.id === task.id);
              const currentIndex = tasks.findIndex((t) => t.id === currentTask);
              const isComplete = status === 'success' || (status === 'generating' && taskIndex < currentIndex);
              const isCurrent = status === 'generating' && task.id === currentTask;
              const isPending = status === 'generating' && taskIndex > currentIndex;

              return (
                <div
                  key={task.id}
                  className={`
                    flex items-center gap-3 p-3 rounded-lg
                    ${isComplete ? 'bg-green-50 dark:bg-green-900/20' : ''}
                    ${isCurrent ? 'bg-blue-50 dark:bg-blue-900/20' : ''}
                    ${isPending ? 'bg-gray-50 dark:bg-gray-700/30' : ''}
                    ${status === 'error' && isCurrent ? 'bg-red-50 dark:bg-red-900/20' : ''}
                  `}
                >
                  <div className="flex-shrink-0">
                    {(() => {
                      const currentStatus: GenerationStatus = status;
                      if (isComplete) return <CheckCircle className="h-5 w-5 text-green-500" />;
                      if (isCurrent && currentStatus === 'generating') return <Loader2 className="h-5 w-5 text-blue-500 animate-spin" />;
                      if (isCurrent && currentStatus === 'error') return <XCircle className="h-5 w-5 text-red-500" />;
                      return <task.icon className="h-5 w-5 text-gray-400" />;
                    })()}
                  </div>
                  <span
                    className={`
                      text-sm font-medium
                      ${isComplete ? 'text-green-700 dark:text-green-400' : ''}
                      ${isCurrent ? 'text-blue-700 dark:text-blue-400' : ''}
                      ${isPending ? 'text-gray-500 dark:text-gray-400' : ''}
                      ${status === 'error' && isCurrent ? 'text-red-700 dark:text-red-400' : ''}
                    `}
                  >
                    {task.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Success Result */}
      {status === 'success' && result && (
        <div className="bg-green-50 dark:bg-green-900/20 rounded-lg p-6 space-y-4">
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-green-500" />
            <h3 className="font-semibold text-green-900 dark:text-green-300">
              Book Created Successfully!
            </h3>
          </div>

          {/* Library save warning */}
          {saveError && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-3 flex items-start gap-2">
              <XCircle className="h-5 w-5 text-yellow-500 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  {saveError}
                </p>
                <p className="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                  Your book is available on GitHub, but you&apos;ll need to sign in to access it from your library.
                </p>
              </div>
            </div>
          )}

          <div className="space-y-3">
            <a
              href={result.repoUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="
                flex items-center justify-between p-3 rounded-lg
                bg-white dark:bg-gray-800 border border-green-200 dark:border-green-800
                hover:bg-green-50 dark:hover:bg-green-900/30 transition-colors
              "
            >
              <div className="flex items-center gap-3">
                <Github className="h-5 w-5 text-gray-600 dark:text-gray-400" />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">GitHub Repository</p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">{result.repoUrl}</p>
                </div>
              </div>
              <ExternalLink className="h-5 w-5 text-gray-400" />
            </a>

            {/* Deployment Status */}
            <div className={`
              flex items-center justify-between p-3 rounded-lg
              bg-white dark:bg-gray-800 border transition-colors
              ${deploymentStatus === 'live'
                ? 'border-green-400 dark:border-green-600'
                : deploymentStatus === 'failed' || deploymentStatus === 'error'
                ? 'border-red-300 dark:border-red-800'
                : 'border-yellow-200 dark:border-yellow-800'}
            `}>
              <div className="flex items-center gap-3">
                <Globe className={`h-5 w-5 ${
                  deploymentStatus === 'live'
                    ? 'text-green-500'
                    : deploymentStatus === 'failed' || deploymentStatus === 'error'
                    ? 'text-red-500'
                    : 'text-yellow-500'
                }`} />
                <div>
                  <p className="font-medium text-gray-900 dark:text-white">
                    Live Book (GitHub Pages)
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400">
                    {result.deployedUrl}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {deploymentStatus === 'live' ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-green-600 dark:text-green-400">
                    <CheckCircle className="h-4 w-4" />
                    Live
                  </span>
                ) : deploymentStatus === 'error' || deploymentStatus === 'failed' ? (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-red-600 dark:text-red-400">
                    <XCircle className="h-4 w-4" />
                    {deploymentStatus === 'failed' ? 'Build Failed' : 'Error'}
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 text-sm font-medium text-yellow-600 dark:text-yellow-400">
                    <Loader2 className="h-4 w-4 animate-spin" />
                    {deploymentStatus === 'building' ? 'Building...' :
                     deploymentStatus === 'deploying' ? 'Deploying...' :
                     'Checking...'}
                  </span>
                )}
                {deploymentStatus === 'live' && (
                  <a
                    href={result.deployedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded"
                  >
                    <ExternalLink className="h-5 w-5 text-gray-400" />
                  </a>
                )}
              </div>
            </div>
          </div>

          {/* Deployment Progress Info - only show when actively deploying, not on failure */}
          {deploymentStatus !== 'live' && deploymentStatus !== 'failed' && deploymentStatus !== 'error' && (
            <div className="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-4 space-y-2">
              <div className="flex items-center gap-2">
                <RefreshCw className="h-4 w-4 text-yellow-600 dark:text-yellow-400 animate-spin" />
                <span className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                  Deployment in Progress
                </span>
              </div>
              <p className="text-sm text-yellow-700 dark:text-yellow-400">
                GitHub Actions is building and deploying your book. This typically takes 1-3 minutes.
                {pollCount > 0 && ` (Auto-checking every 15 seconds - ${pollCount}/40)`}
              </p>
              {deploymentInfo && (
                <div className="text-xs text-yellow-600 dark:text-yellow-500 space-y-1">
                  <p>Workflow: {deploymentInfo.workflowStatus || 'checking'}{deploymentInfo.workflowConclusion ? ` (${deploymentInfo.workflowConclusion})` : ''}</p>
                  <p>Pages Status: {deploymentInfo.status}</p>
                  <p>Build Status: {deploymentInfo.buildStatus}</p>
                  <p>Deployment: {deploymentInfo.deploymentStatus}</p>
                  {deploymentInfo.workflowRunUrl && (
                    <a
                      href={deploymentInfo.workflowRunUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-yellow-700 dark:text-yellow-300 underline hover:no-underline inline-flex items-center gap-1"
                    >
                      View workflow run <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              )}
              <button
                onClick={() => checkDeploymentStatus()}
                className="text-sm text-yellow-700 dark:text-yellow-300 underline hover:no-underline"
              >
                Check now
              </button>
            </div>
          )}

          {/* Success notification when live */}
          {deploymentStatus === 'live' && (
            <div className="bg-green-100 dark:bg-green-900/30 rounded-lg p-4 flex items-center gap-3">
              <CheckCircle className="h-6 w-6 text-green-600 dark:text-green-400 flex-shrink-0" />
              <div>
                <p className="font-medium text-green-800 dark:text-green-300">
                  Your book is live!
                </p>
                <p className="text-sm text-green-700 dark:text-green-400">
                  Visit{' '}
                  <a
                    href={result.deployedUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="underline font-medium"
                  >
                    {result.deployedUrl}
                  </a>
                  {' '}to see your published book.
                </p>
              </div>
            </div>
          )}

          {/* Workflow error notification */}
          {(deploymentStatus === 'failed' || (deploymentStatus === 'error' && deploymentInfo?.workflowConclusion === 'failure')) && (
            <div className="bg-red-100 dark:bg-red-900/30 rounded-lg p-4">
              <div className="flex items-center gap-2 mb-2">
                <XCircle className="h-6 w-6 text-red-600 dark:text-red-400" />
                <p className="font-medium text-red-800 dark:text-red-300">
                  Build Failed
                </p>
              </div>
              <p className="text-sm text-red-700 dark:text-red-400 mb-2">
                The GitHub Actions workflow failed to build your book. This is usually due to a MyST configuration or content error.
              </p>
              {deploymentInfo?.workflowRunUrl && (
                <a
                  href={deploymentInfo.workflowRunUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-red-700 dark:text-red-300 underline hover:no-underline inline-flex items-center gap-1 mb-3 block"
                >
                  View workflow logs for error details <ExternalLink className="w-3 h-3" />
                </a>
              )}
              {deploymentInfo && (
                <div className="text-xs text-red-600 dark:text-red-500 space-y-1 mb-3 p-2 bg-red-50 dark:bg-red-900/20 rounded">
                  <p><strong>Workflow:</strong> {deploymentInfo.workflowStatus || 'unknown'} ({deploymentInfo.workflowConclusion || 'no conclusion'})</p>
                  <p><strong>Pages Status:</strong> {deploymentInfo.status}</p>
                  <p><strong>Build Status:</strong> {deploymentInfo.buildStatus}</p>
                </div>
              )}
              <button
                onClick={() => {
                  setDeploymentStatus('checking');
                  pollCountRef.current = 0;
                  setPollCount(0);
                  checkDeploymentStatus();
                }}
                className="text-sm px-3 py-1.5 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded hover:bg-red-300 dark:hover:bg-red-700 transition-colors"
              >
                Check status again
              </button>
            </div>
          )}
        </div>
      )}

      {/* Error Result */}
      {status === 'error' && result && (
        <div className={`rounded-lg p-6 ${
          result.isRateLimit
            ? 'bg-yellow-50 dark:bg-yellow-900/20'
            : 'bg-red-50 dark:bg-red-900/20'
        }`}>
          <div className="flex items-center gap-2 mb-2">
            <XCircle className={`h-6 w-6 ${
              result.isRateLimit ? 'text-yellow-500' : 'text-red-500'
            }`} />
            <h3 className={`font-semibold ${
              result.isRateLimit
                ? 'text-yellow-900 dark:text-yellow-300'
                : 'text-red-900 dark:text-red-300'
            }`}>
              {result.isRateLimit ? 'Rate Limit Reached' : 'Generation Failed'}
            </h3>
          </div>
          <p className={
            result.isRateLimit
              ? 'text-yellow-700 dark:text-yellow-400'
              : 'text-red-700 dark:text-red-400'
          }>
            {result.error}
          </p>

          {/* Rate limit countdown */}
          {result.isRateLimit && rateLimitCountdown !== null && rateLimitCountdown > 0 && (
            <div className="mt-3 p-3 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg">
              <p className="text-sm font-medium text-yellow-800 dark:text-yellow-300">
                You can retry in: {Math.floor(rateLimitCountdown / 60)}:{String(rateLimitCountdown % 60).padStart(2, '0')}
              </p>
              <div className="mt-2 w-full bg-yellow-200 dark:bg-yellow-800 rounded-full h-2">
                <div
                  className="bg-yellow-500 h-2 rounded-full transition-all duration-1000"
                  style={{ width: `${Math.max(0, 100 - (rateLimitCountdown / 60) * 100)}%` }}
                />
              </div>
            </div>
          )}

          <button
            onClick={handleGenerate}
            disabled={result.isRateLimit && rateLimitCountdown !== null && rateLimitCountdown > 0}
            className={`
              mt-4 px-4 py-2 rounded-lg font-medium transition-colors
              ${result.isRateLimit
                ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300 hover:bg-yellow-200 dark:hover:bg-yellow-900/50'
                : 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 hover:bg-red-200 dark:hover:bg-red-900/50'
              }
              disabled:opacity-50 disabled:cursor-not-allowed
            `}
          >
            {result.isRateLimit && rateLimitCountdown !== null && rateLimitCountdown > 0
              ? 'Please wait...'
              : 'Try Again'
            }
          </button>
        </div>
      )}

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t border-gray-200 dark:border-gray-700">
        <button
          onClick={handleBack}
          disabled={status === 'generating'}
          className="
            flex items-center gap-2 px-6 py-3 rounded-lg font-semibold
            text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700
            transition-colors disabled:opacity-50 disabled:cursor-not-allowed
          "
        >
          <ArrowLeft className="h-5 w-5" />
          Back
        </button>

        {status === 'idle' && (
          <button
            onClick={handleGenerate}
            className="
              flex items-center gap-2 px-6 py-3 rounded-lg font-semibold
              bg-blue-600 hover:bg-blue-700 text-white transition-colors
            "
          >
            <Rocket className="h-5 w-5" />
            Generate Book
          </button>
        )}

        {status === 'success' && (
          <button
            onClick={handleEditChapters}
            className="
              flex items-center gap-2 px-6 py-3 rounded-lg font-semibold
              bg-blue-600 hover:bg-blue-700 text-white transition-colors
            "
          >
            Edit Chapters with AI
            <FileText className="h-5 w-5" />
          </button>
        )}
      </div>
    </div>
  );
}

// Database types for LQ21_ tables

export interface LQ21Profile {
  id: string;
  email: string;
  display_name: string | null;
  avatar_url: string | null;
  subscription_tier: 'free' | 'pro' | 'team' | 'enterprise';
  subscription_status: 'active' | 'inactive' | 'cancelled' | 'past_due';
  stripe_customer_id: string | null;
  created_at: string;
  updated_at: string;
}

export interface LQ21Organization {
  id: string;
  name: string;
  slug: string;
  owner_id: string | null;
  logo_url: string | null;
  settings: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LQ21Book {
  id: string;
  owner_id: string;
  organization_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  author: string | null;
  cover_image_url: string | null;
  status: 'draft' | 'generating' | 'review' | 'published' | 'archived';
  visibility: 'private' | 'unlisted' | 'public';
  github_repo_url: string | null;
  github_username: string | null;
  github_repo_name: string | null;
  deployed_url: string | null;
  config: Record<string, unknown>;
  book_features: unknown[];
  created_at: string;
  updated_at: string;
  published_at: string | null;
}

export interface LQ21Chapter {
  id: string;
  book_id: string;
  parent_id: string | null;
  title: string;
  slug: string;
  description: string | null;
  content: string | null;
  sort_order: number;
  status: 'draft' | 'generating' | 'review' | 'complete';
  word_count: number;
  target_word_count: number;
  chapter_features: unknown[];
  generation_metadata: Record<string, unknown>;
  created_at: string;
  updated_at: string;
}

export interface LQ21FeatureAudit {
  id: string;
  chapter_id: string;
  total_features: number;
  implemented_features: number;
  missing_features: number;
  implementation_percentage: number;
  audit_results: unknown[];
  suggestions: unknown[];
  audited_at: string;
  audited_by: string;
}

export interface LQ21RemediationQueue {
  id: string;
  chapter_id: string;
  feature_id: string;
  feature_name: string;
  status: 'pending' | 'in_progress' | 'completed' | 'failed' | 'skipped';
  priority: number;
  original_content: string | null;
  remediated_content: string | null;
  error_message: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
}

export interface LQ21GitHubDeployment {
  id: string;
  book_id: string;
  github_repo_url: string;
  commit_sha: string | null;
  workflow_run_id: string | null;
  status: 'pending' | 'building' | 'success' | 'failed' | 'cancelled';
  deployed_url: string | null;
  error_message: string | null;
  build_logs: string | null;
  started_at: string;
  completed_at: string | null;
}

export interface LQ21GenerationHistory {
  id: string;
  book_id: string | null;
  chapter_id: string | null;
  user_id: string;
  generation_type: 'toc' | 'chapter' | 'content' | 'remediation';
  provider: string;
  model: string;
  prompt_tokens: number | null;
  completion_tokens: number | null;
  total_tokens: number | null;
  word_count: number | null;
  stop_reason: string | null;
  duration_ms: number | null;
  status: 'pending' | 'streaming' | 'completed' | 'failed' | 'truncated';
  error_message: string | null;
  created_at: string;
  completed_at: string | null;
}

export interface LQ21ApiKey {
  id: string;
  user_id: string;
  provider: 'claude' | 'openai' | 'gemini' | 'github';
  encrypted_key: string;
  key_hint: string | null;
  is_valid: boolean;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
}

// Book with chapters for full data retrieval
export interface LQ21BookWithChapters extends LQ21Book {
  chapters: LQ21Chapter[];
}

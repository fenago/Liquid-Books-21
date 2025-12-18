# Book Builder Database Schema

## Overview

This document outlines the complete database schema for the Liquid Books application using Supabase (PostgreSQL).

**IMPORTANT**: All production tables use the `LQ21_` prefix to distinguish them from other tables in the shared Supabase project.

## Architecture Decisions

- **Supabase Auth**: Using Supabase's built-in auth system (auth.users)
- **Row Level Security (RLS)**: All tables have RLS enabled for security
- **Table Prefix**: All tables prefixed with `LQ21_` for namespace isolation
- **Audit Trail**: Version history for chapters, job tracking for AI generations

---

## Deployed Tables (LQ21_ Prefixed)

The following tables have been created in Supabase with RLS policies:

| Table Name | Description | RLS |
|------------|-------------|-----|
| `lq21_profiles` | User profiles extending auth.users | ✅ |
| `lq21_organizations` | Organizations/teams | ✅ |
| `lq21_organization_members` | Org membership with roles | ✅ |
| `lq21_books` | Book metadata and config | ✅ |
| `lq21_chapters` | Chapter content and metadata | ✅ |
| `lq21_feature_audits` | Feature implementation tracking | ✅ |
| `lq21_remediation_queue` | Feature remediation tasks | ✅ |
| `lq21_github_deployments` | GitHub deployment tracking | ✅ |
| `lq21_generation_history` | AI generation logs | ✅ |
| `lq21_api_keys` | Encrypted API key storage | ✅ |

---

## Feature Enforcement Options

### Option A: Remediate Chapter Button (Recommended)
- User clicks button on chapters with missing features
- Sends current content + list of missing features to AI
- AI enhances the chapter to include them
- Preserves existing content, adds new sections

### Option B: Pre-Generation Feature Requirements
- Before generating, user selects which features MUST be included
- These get injected into the system prompt as hard requirements
- AI is told "You MUST include: code blocks, exercises, admonitions..."

### Option C: Automatic Post-Generation Enhancement
- After generation, if audit shows <80% features, automatically trigger enhancement pass
- AI gets the content + "Add these missing features: [list]"
- Loops until feature threshold is met or max attempts reached

---

## SQL Schema

```sql
-- =============================================
-- SUPABASE AUTH EXTENSION
-- =============================================
-- Supabase provides auth.users table automatically
-- We extend it with a public profiles table

-- Public user profiles (extends Supabase auth.users)
CREATE TABLE public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email VARCHAR(255),
  full_name VARCHAR(255),
  avatar_url TEXT,

  -- Subscription/billing
  subscription_tier VARCHAR(50) DEFAULT 'free', -- free, pro, team, enterprise
  subscription_status VARCHAR(50) DEFAULT 'active', -- active, canceled, past_due
  stripe_customer_id VARCHAR(255),

  -- Usage tracking
  books_created INTEGER DEFAULT 0,
  chapters_generated INTEGER DEFAULT 0,
  tokens_used_this_month BIGINT DEFAULT 0,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  last_sign_in_at TIMESTAMPTZ
);

-- Trigger to create profile on user signup
CREATE OR REPLACE FUNCTION public.handle_new_user()
RETURNS TRIGGER AS $$
BEGIN
  INSERT INTO public.profiles (id, email, full_name, avatar_url)
  VALUES (
    NEW.id,
    NEW.email,
    NEW.raw_user_meta_data->>'full_name',
    NEW.raw_user_meta_data->>'avatar_url'
  );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

CREATE TRIGGER on_auth_user_created
  AFTER INSERT ON auth.users
  FOR EACH ROW EXECUTE FUNCTION public.handle_new_user();

-- =============================================
-- ORGANIZATIONS (for team collaboration)
-- =============================================

CREATE TABLE organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,

  -- Billing
  owner_id UUID REFERENCES public.profiles(id) ON DELETE SET NULL,
  plan VARCHAR(50) DEFAULT 'free', -- free, pro, enterprise
  stripe_subscription_id VARCHAR(255),

  -- Limits
  max_books INTEGER DEFAULT 3,
  max_members INTEGER DEFAULT 1,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

CREATE TABLE organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  role VARCHAR(50) DEFAULT 'member', -- owner, admin, editor, viewer

  invited_by UUID REFERENCES public.profiles(id),
  invited_at TIMESTAMPTZ DEFAULT NOW(),
  joined_at TIMESTAMPTZ,

  UNIQUE(organization_id, user_id)
);

-- Organization invitations
CREATE TABLE organization_invitations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'member',
  token VARCHAR(255) UNIQUE NOT NULL,

  invited_by UUID REFERENCES public.profiles(id),
  expires_at TIMESTAMPTZ NOT NULL,
  accepted_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- BOOKS
-- =============================================

CREATE TABLE books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id) ON DELETE SET NULL,

  -- Basic info
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  description TEXT,
  language VARCHAR(10) DEFAULT 'en',

  -- AI Configuration
  ai_provider VARCHAR(50) DEFAULT 'claude', -- claude, openai, gemini
  ai_model VARCHAR(100) DEFAULT 'claude-sonnet-4-20250514',
  target_word_count_per_chapter INTEGER DEFAULT 4000,

  -- Custom prompts (overrides defaults)
  toc_system_prompt TEXT,
  chapter_system_prompt TEXT,

  -- Required features for chapters
  required_features TEXT[], -- Array of feature names that must be present

  -- Publishing status
  status VARCHAR(50) DEFAULT 'draft', -- draft, in_progress, review, published, archived
  published_at TIMESTAMPTZ,

  -- GitHub integration
  github_repo_url TEXT,
  github_repo_name VARCHAR(255),
  github_default_branch VARCHAR(100) DEFAULT 'main',
  last_github_sync_at TIMESTAMPTZ,

  -- Live site
  live_url TEXT,
  netlify_site_id VARCHAR(255),

  -- Metadata
  cover_image_url TEXT,
  tags TEXT[],

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),
  deleted_at TIMESTAMPTZ, -- Soft delete

  UNIQUE(organization_id, slug)
);

-- Book collaborators (beyond org members, for external contributors)
CREATE TABLE book_collaborators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,

  role VARCHAR(50) DEFAULT 'editor', -- editor, reviewer, viewer

  added_by UUID REFERENCES public.profiles(id),
  added_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(book_id, user_id)
);

-- =============================================
-- TABLE OF CONTENTS
-- =============================================

CREATE TABLE toc_items (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  parent_id UUID REFERENCES toc_items(id) ON DELETE CASCADE,

  -- Content
  title VARCHAR(500) NOT NULL,
  slug VARCHAR(200) NOT NULL,
  description TEXT,

  -- Ordering
  sort_order INTEGER NOT NULL DEFAULT 0,
  depth INTEGER DEFAULT 0, -- 0 = top level, 1 = child, etc.

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, generating, generated, edited, approved

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(book_id, slug)
);

-- =============================================
-- CHAPTERS
-- =============================================

CREATE TABLE chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  toc_item_id UUID REFERENCES toc_items(id) ON DELETE CASCADE,

  -- Content
  title VARCHAR(500) NOT NULL,
  content TEXT, -- MyST Markdown content

  -- Metrics
  word_count INTEGER DEFAULT 0,
  character_count INTEGER DEFAULT 0,
  reading_time_minutes INTEGER DEFAULT 0,

  -- Generation metadata
  generated_at TIMESTAMPTZ,
  generation_model VARCHAR(100),
  generation_tokens_input INTEGER,
  generation_tokens_output INTEGER,
  generation_stop_reason VARCHAR(50),
  generation_duration_ms INTEGER,

  -- Feature audit cache
  feature_audit_score DECIMAL(5,2),
  feature_audit_found INTEGER,
  feature_audit_total INTEGER,
  last_audited_at TIMESTAMPTZ,

  -- Editing
  last_edited_by UUID REFERENCES public.profiles(id),
  last_edited_at TIMESTAMPTZ,

  -- Status
  status VARCHAR(50) DEFAULT 'draft', -- draft, generated, edited, approved, published

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(book_id, toc_item_id)
);

-- Chapter version history (for undo/restore)
CREATE TABLE chapter_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,

  -- Content snapshot
  content TEXT NOT NULL,
  word_count INTEGER,

  -- What triggered this version
  change_type VARCHAR(50) NOT NULL, -- generated, edited, remediated, restored, auto_save
  change_description TEXT,
  changed_by UUID REFERENCES public.profiles(id),

  -- AI metadata (if generated/remediated)
  ai_model VARCHAR(100),
  ai_tokens_used INTEGER,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(chapter_id, version_number)
);

-- =============================================
-- FEATURE AUDITS
-- =============================================

-- Feature definitions (MyST Markdown features)
CREATE TABLE feature_definitions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  name VARCHAR(100) NOT NULL UNIQUE,
  display_name VARCHAR(200) NOT NULL,
  description TEXT,

  category VARCHAR(100), -- admonitions, code, math, media, tables, interactivity, layout, diagrams
  detection_pattern TEXT, -- Regex pattern to detect
  example_syntax TEXT, -- Example of how to use

  importance VARCHAR(50) DEFAULT 'recommended', -- required, recommended, optional
  sort_order INTEGER DEFAULT 0,

  is_active BOOLEAN DEFAULT TRUE
);

-- Pre-populate MyST features
INSERT INTO feature_definitions (name, display_name, category, detection_pattern, importance, example_syntax) VALUES
  -- Admonitions
  ('note', 'Note', 'admonitions', '\`\`\`\\{note\\}', 'recommended', '```{note}\nImportant information here\n```'),
  ('tip', 'Tip', 'admonitions', '\`\`\`\\{tip\\}', 'recommended', '```{tip}\nHelpful tip here\n```'),
  ('hint', 'Hint', 'admonitions', '\`\`\`\\{hint\\}', 'optional', '```{hint}\nHint content\n```'),
  ('important', 'Important', 'admonitions', '\`\`\`\\{important\\}', 'recommended', '```{important}\nCritical information\n```'),
  ('warning', 'Warning', 'admonitions', '\`\`\`\\{warning\\}', 'recommended', '```{warning}\nWarning message\n```'),
  ('caution', 'Caution', 'admonitions', '\`\`\`\\{caution\\}', 'optional', '```{caution}\nProceed with caution\n```'),
  ('danger', 'Danger', 'admonitions', '\`\`\`\\{danger\\}', 'optional', '```{danger}\nDangerous operation\n```'),
  ('error', 'Error', 'admonitions', '\`\`\`\\{error\\}', 'optional', '```{error}\nError description\n```'),
  ('attention', 'Attention', 'admonitions', '\`\`\`\\{attention\\}', 'optional', '```{attention}\nPay attention\n```'),
  ('see_also', 'See Also', 'admonitions', '\`\`\`\\{seealso\\}', 'optional', '```{seealso}\nRelated topics\n```'),
  ('custom_admonition', 'Custom Admonition', 'admonitions', '\`\`\`\\{admonition\\}', 'optional', '```{admonition} Custom Title\nContent here\n```'),
  ('dropdown_admonition', 'Dropdown Admonition', 'admonitions', '\`\`\`\\{dropdown\\}', 'optional', '```{dropdown} Click to expand\nHidden content\n```'),

  -- Code
  ('code_block', 'Code Block', 'code', '\`\`\`(python|javascript|typescript|java|go|rust|sql|bash|html|css)', 'required', '```python\nprint("Hello")\n```'),
  ('code_with_line_numbers', 'Code with Line Numbers', 'code', ':linenos:', 'optional', '```{code-block} python\n:linenos:\ncode here\n```'),
  ('code_with_caption', 'Code with Caption', 'code', ':caption:', 'optional', '```{code-block} python\n:caption: Example\ncode here\n```'),
  ('emphasized_lines', 'Emphasized Lines', 'code', ':emphasize-lines:', 'optional', '```{code-block} python\n:emphasize-lines: 2,3\ncode here\n```'),
  ('include_external_code', 'Include External Code', 'code', '\`\`\`\\{literalinclude\\}', 'optional', '```{literalinclude} /path/to/file.py\n```'),

  -- Math
  ('equation_block', 'Equation Block', 'math', '\`\`\`\\{math\\}', 'optional', '```{math}\nE = mc^2\n```'),
  ('inline_math', 'Inline Math', 'math', '\\$[^$]+\\$', 'optional', 'Inline equation $E = mc^2$ here'),
  ('dollar_math_block', 'Dollar Math Block', 'math', '\\$\\$[^$]+\\$\\$', 'optional', '$$\nE = mc^2\n$$'),
  ('aligned_equations', 'Aligned Equations', 'math', '\\\\begin\\{align', 'optional', '\\begin{align}\nx &= 1 \\\\\ny &= 2\n\\end{align}'),
  ('matrix', 'Matrix', 'math', '\\\\begin\\{(p|b|B|v|V)?matrix\\}', 'optional', '\\begin{pmatrix} a & b \\\\ c & d \\end{pmatrix}'),

  -- Media
  ('figure', 'Figure', 'media', '\`\`\`\\{figure\\}', 'recommended', '```{figure} ./image.png\n:alt: Description\nCaption here\n```'),
  ('image', 'Image', 'media', '\`\`\`\\{image\\}', 'optional', '```{image} ./image.png\n:alt: Description\n```'),

  -- Tables
  ('list_table', 'List Table', 'tables', '\`\`\`\\{list-table\\}', 'optional', '```{list-table}\n* - Header 1\n  - Header 2\n```'),
  ('csv_table', 'CSV Table', 'tables', '\`\`\`\\{csv-table\\}', 'optional', '```{csv-table}\n:header: Col1, Col2\n\nA, B\n```'),

  -- Interactivity
  ('dropdown', 'Dropdown', 'interactivity', '\`\`\`\\{dropdown\\}', 'recommended', '```{dropdown} Click me\nHidden content\n```'),
  ('tabs', 'Tabs', 'interactivity', '\`\`\`\\{tab-set\\}', 'optional', '```{tab-set}\n```{tab-item} Tab 1\nContent\n```\n```'),

  -- Layout
  ('card', 'Card', 'layout', '\`\`\`\\{card\\}', 'optional', '```{card}\nCard content\n```'),
  ('clickable_card', 'Clickable Card', 'layout', '\`\`\`\\{card\\}[^`]*:link:', 'optional', '```{card}\n:link: https://example.com\nClickable card\n```'),
  ('grid_layout', 'Grid Layout', 'layout', '\`\`\`\\{grid\\}', 'optional', '```{grid} 2 2\nGrid content\n```'),

  -- Diagrams
  ('mermaid_flowchart', 'Mermaid Diagram', 'diagrams', '\`\`\`\\{mermaid\\}', 'recommended', '```{mermaid}\nflowchart TD\n    A --> B\n```');

-- Audit results per chapter
CREATE TABLE chapter_audits (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,

  -- Summary stats
  total_features INTEGER DEFAULT 0,
  found_features INTEGER DEFAULT 0,
  missing_features INTEGER DEFAULT 0,
  score DECIMAL(5,2), -- Percentage score

  -- Detailed results (JSONB for flexibility)
  results JSONB, -- {feature_name: {found: boolean, count: number}}

  audited_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- REMEDIATION
-- =============================================

CREATE TABLE remediation_requests (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  chapter_id UUID REFERENCES chapters(id) ON DELETE CASCADE,
  requested_by UUID REFERENCES public.profiles(id),

  -- What to remediate
  missing_features TEXT[], -- Array of feature names to add
  custom_instructions TEXT, -- Additional instructions

  -- Original content (before remediation)
  original_content TEXT,
  original_word_count INTEGER,

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed

  -- Result
  result_content TEXT,
  result_word_count INTEGER,
  result_version_id UUID REFERENCES chapter_versions(id),

  -- AI metadata
  ai_provider VARCHAR(50),
  ai_model VARCHAR(100),
  tokens_input INTEGER,
  tokens_output INTEGER,

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- =============================================
-- AI GENERATION JOBS
-- =============================================

CREATE TABLE generation_jobs (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- References
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  chapter_id UUID REFERENCES chapters(id) ON DELETE SET NULL,
  requested_by UUID REFERENCES public.profiles(id),

  -- Job configuration
  job_type VARCHAR(50) NOT NULL, -- toc, chapter, remediate, enhance, continue

  ai_provider VARCHAR(50) NOT NULL,
  ai_model VARCHAR(100) NOT NULL,
  system_prompt TEXT,
  user_prompt TEXT,
  target_word_count INTEGER,

  -- Status tracking
  status VARCHAR(50) DEFAULT 'queued', -- queued, processing, streaming, completed, failed, canceled
  progress INTEGER DEFAULT 0, -- 0-100

  -- Results
  result_content TEXT,
  stop_reason VARCHAR(50),

  -- Error handling
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,

  -- Metrics
  tokens_input INTEGER,
  tokens_output INTEGER,
  word_count INTEGER,
  duration_ms INTEGER,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ
);

-- =============================================
-- EXPORTS AND PUBLISHING
-- =============================================

CREATE TABLE book_exports (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,
  exported_by UUID REFERENCES public.profiles(id),

  -- Export type
  format VARCHAR(50) NOT NULL, -- github, pdf, epub, html, docx, zip

  -- GitHub exports
  github_repo VARCHAR(255),
  github_commit_sha VARCHAR(40),
  github_branch VARCHAR(100),

  -- Deployment
  deployment_url TEXT,
  deployment_status VARCHAR(50), -- pending, building, ready, error
  deployment_logs TEXT,

  -- File exports
  file_url TEXT,
  file_size_bytes BIGINT,

  -- Status
  status VARCHAR(50) DEFAULT 'pending', -- pending, processing, completed, failed
  error_message TEXT,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  completed_at TIMESTAMPTZ
);

-- GitHub sync history
CREATE TABLE github_sync_history (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID REFERENCES books(id) ON DELETE CASCADE,

  -- Commit info
  commit_sha VARCHAR(40) NOT NULL,
  commit_message TEXT,
  branch VARCHAR(100),

  -- Files changed
  files_added TEXT[],
  files_modified TEXT[],
  files_deleted TEXT[],

  -- Sync metadata
  synced_by UUID REFERENCES public.profiles(id),
  sync_type VARCHAR(50), -- manual, auto, webhook

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USER SETTINGS
-- =============================================

CREATE TABLE user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE UNIQUE,

  -- API Keys (should be encrypted at rest)
  anthropic_api_key_encrypted TEXT,
  openai_api_key_encrypted TEXT,
  gemini_api_key_encrypted TEXT,
  github_token_encrypted TEXT,

  -- Default preferences
  default_ai_provider VARCHAR(50) DEFAULT 'claude',
  default_ai_model VARCHAR(100) DEFAULT 'claude-sonnet-4-20250514',
  default_word_count INTEGER DEFAULT 4000,
  default_required_features TEXT[], -- Features user always wants

  -- UI preferences
  theme VARCHAR(20) DEFAULT 'dark', -- dark, light, system
  editor_font_size INTEGER DEFAULT 14,
  editor_line_numbers BOOLEAN DEFAULT TRUE,
  auto_save_interval_seconds INTEGER DEFAULT 30,

  -- Notification preferences
  email_on_generation_complete BOOLEAN DEFAULT FALSE,
  email_on_export_complete BOOLEAN DEFAULT FALSE,

  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- TEMPLATES
-- =============================================

CREATE TABLE book_templates (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),

  -- Ownership
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,
  created_by UUID REFERENCES public.profiles(id),

  -- Template info
  name VARCHAR(255) NOT NULL,
  description TEXT,
  category VARCHAR(100), -- technical, fiction, non-fiction, academic, documentation

  -- Configuration
  default_toc_prompt TEXT,
  default_chapter_prompt TEXT,
  required_features TEXT[],
  suggested_features TEXT[],

  -- Sample TOC structure (JSON)
  sample_toc JSONB,

  -- Sharing
  is_public BOOLEAN DEFAULT FALSE,
  use_count INTEGER DEFAULT 0,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- =============================================
-- USAGE TRACKING (for billing)
-- =============================================

CREATE TABLE usage_records (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- What was used
  resource_type VARCHAR(50) NOT NULL, -- generation, export, storage
  resource_id UUID, -- Reference to the job/export

  -- Metrics
  tokens_used INTEGER DEFAULT 0,
  storage_bytes BIGINT DEFAULT 0,

  -- Billing period
  billing_period_start DATE NOT NULL,
  billing_period_end DATE NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Monthly usage summary
CREATE TABLE usage_summaries (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE,
  organization_id UUID REFERENCES organizations(id) ON DELETE CASCADE,

  -- Period
  year INTEGER NOT NULL,
  month INTEGER NOT NULL,

  -- Totals
  total_generations INTEGER DEFAULT 0,
  total_tokens_input BIGINT DEFAULT 0,
  total_tokens_output BIGINT DEFAULT 0,
  total_exports INTEGER DEFAULT 0,
  total_storage_bytes BIGINT DEFAULT 0,

  -- Cost (if tracking)
  estimated_cost_usd DECIMAL(10,4),

  UNIQUE(user_id, year, month),
  UNIQUE(organization_id, year, month)
);

-- =============================================
-- INDEXES
-- =============================================

-- Users & Auth
CREATE INDEX idx_profiles_email ON public.profiles(email);
CREATE INDEX idx_profiles_subscription ON public.profiles(subscription_tier, subscription_status);

-- Organizations
CREATE INDEX idx_org_members_user ON organization_members(user_id);
CREATE INDEX idx_org_members_org ON organization_members(organization_id);
CREATE INDEX idx_org_invitations_email ON organization_invitations(email);
CREATE INDEX idx_org_invitations_token ON organization_invitations(token);

-- Books
CREATE INDEX idx_books_organization ON books(organization_id);
CREATE INDEX idx_books_status ON books(status);
CREATE INDEX idx_books_created_by ON books(created_by);
CREATE INDEX idx_books_deleted ON books(deleted_at) WHERE deleted_at IS NULL;

-- TOC Items
CREATE INDEX idx_toc_items_book ON toc_items(book_id);
CREATE INDEX idx_toc_items_parent ON toc_items(parent_id);
CREATE INDEX idx_toc_items_sort ON toc_items(book_id, sort_order);

-- Chapters
CREATE INDEX idx_chapters_book ON chapters(book_id);
CREATE INDEX idx_chapters_toc ON chapters(toc_item_id);
CREATE INDEX idx_chapters_status ON chapters(status);
CREATE INDEX idx_chapters_audit_score ON chapters(feature_audit_score);

-- Chapter Versions
CREATE INDEX idx_chapter_versions_chapter ON chapter_versions(chapter_id);
CREATE INDEX idx_chapter_versions_created ON chapter_versions(created_at DESC);

-- Generation Jobs
CREATE INDEX idx_generation_jobs_book ON generation_jobs(book_id);
CREATE INDEX idx_generation_jobs_status ON generation_jobs(status);
CREATE INDEX idx_generation_jobs_user ON generation_jobs(requested_by);

-- Exports
CREATE INDEX idx_exports_book ON book_exports(book_id);
CREATE INDEX idx_exports_status ON book_exports(status);

-- Usage
CREATE INDEX idx_usage_user_period ON usage_records(user_id, billing_period_start);
CREATE INDEX idx_usage_org_period ON usage_records(organization_id, billing_period_start);

-- =============================================
-- ROW LEVEL SECURITY POLICIES
-- =============================================

-- Enable RLS on all tables
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE organization_invitations ENABLE ROW LEVEL SECURITY;
ALTER TABLE books ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_collaborators ENABLE ROW LEVEL SECURITY;
ALTER TABLE toc_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE chapter_audits ENABLE ROW LEVEL SECURITY;
ALTER TABLE remediation_requests ENABLE ROW LEVEL SECURITY;
ALTER TABLE generation_jobs ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_exports ENABLE ROW LEVEL SECURITY;
ALTER TABLE user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE book_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE usage_records ENABLE ROW LEVEL SECURITY;

-- Profiles: Users can read any profile, update only their own
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);

CREATE POLICY "Users can update own profile" ON public.profiles
  FOR UPDATE USING (auth.uid() = id);

-- Organizations: Members can view their organizations
CREATE POLICY "Organization members can view org" ON organizations
  FOR SELECT USING (
    id IN (SELECT organization_id FROM organization_members WHERE user_id = auth.uid())
  );

CREATE POLICY "Owners can update org" ON organizations
  FOR UPDATE USING (owner_id = auth.uid());

-- Books: Org members and collaborators can view
CREATE POLICY "Users can view accessible books" ON books
  FOR SELECT USING (
    organization_id IN (
      SELECT organization_id FROM organization_members WHERE user_id = auth.uid()
    )
    OR id IN (
      SELECT book_id FROM book_collaborators WHERE user_id = auth.uid()
    )
  );

CREATE POLICY "Users can create books in their orgs" ON books
  FOR INSERT WITH CHECK (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
  );

CREATE POLICY "Users can update books they have access to" ON books
  FOR UPDATE USING (
    organization_id IN (
      SELECT organization_id FROM organization_members
      WHERE user_id = auth.uid() AND role IN ('owner', 'admin', 'editor')
    )
    OR id IN (
      SELECT book_id FROM book_collaborators
      WHERE user_id = auth.uid() AND role IN ('editor')
    )
  );

-- User Settings: Users can only access their own
CREATE POLICY "Users can manage own settings" ON user_settings
  FOR ALL USING (user_id = auth.uid());

-- =============================================
-- FUNCTIONS
-- =============================================

-- Update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply to relevant tables
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_organizations_updated_at BEFORE UPDATE ON organizations
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_books_updated_at BEFORE UPDATE ON books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_toc_items_updated_at BEFORE UPDATE ON toc_items
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_chapters_updated_at BEFORE UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Calculate reading time
CREATE OR REPLACE FUNCTION calculate_reading_time(word_count INTEGER)
RETURNS INTEGER AS $$
BEGIN
  -- Average reading speed: 200 words per minute
  RETURN CEIL(word_count / 200.0);
END;
$$ LANGUAGE plpgsql IMMUTABLE;

-- Auto-create chapter version on update
CREATE OR REPLACE FUNCTION create_chapter_version()
RETURNS TRIGGER AS $$
BEGIN
  IF OLD.content IS DISTINCT FROM NEW.content THEN
    INSERT INTO chapter_versions (
      chapter_id,
      version_number,
      content,
      word_count,
      change_type,
      changed_by
    )
    SELECT
      NEW.id,
      COALESCE((SELECT MAX(version_number) FROM chapter_versions WHERE chapter_id = NEW.id), 0) + 1,
      NEW.content,
      NEW.word_count,
      CASE
        WHEN OLD.content IS NULL THEN 'generated'
        ELSE 'edited'
      END,
      NEW.last_edited_by;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER chapter_version_trigger AFTER INSERT OR UPDATE ON chapters
  FOR EACH ROW EXECUTE FUNCTION create_chapter_version();
```

---

## Entity Relationship Summary

```
profiles (users)
    └── organizations (many-to-many via organization_members)
    └── user_settings (one-to-one)
    └── books (created_by)

organizations
    └── organization_members
    └── organization_invitations
    └── books
    └── book_templates

books
    └── toc_items (hierarchical)
    └── chapters
    └── book_collaborators
    └── book_exports
    └── generation_jobs

chapters
    └── chapter_versions (history)
    └── chapter_audits
    └── remediation_requests

feature_definitions (static reference table)
```

---

## API Key Security Note

API keys should be:
1. Encrypted at rest using Supabase Vault or similar
2. Never exposed to the client
3. Accessed only through secure server-side functions
4. Rotatable without affecting other keys

```sql
-- Example using Supabase Vault
CREATE OR REPLACE FUNCTION get_user_api_key(key_type TEXT)
RETURNS TEXT
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  encrypted_key TEXT;
  decrypted_key TEXT;
BEGIN
  SELECT
    CASE key_type
      WHEN 'anthropic' THEN anthropic_api_key_encrypted
      WHEN 'openai' THEN openai_api_key_encrypted
      WHEN 'gemini' THEN gemini_api_key_encrypted
      WHEN 'github' THEN github_token_encrypted
    END INTO encrypted_key
  FROM user_settings
  WHERE user_id = auth.uid();

  -- Decrypt using vault
  SELECT decrypted_secret INTO decrypted_key
  FROM vault.decrypted_secrets
  WHERE id = encrypted_key::uuid;

  RETURN decrypted_key;
END;
$$;
```

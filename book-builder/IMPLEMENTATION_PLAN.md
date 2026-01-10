# Book Builder - Authentication, Settings & Library Implementation Plan

## Supabase Project Information

| Property | Value |
|----------|-------|
| **Project ID** | `qpfviwnzpdlhvyanbjty` |
| **Project URL** | `https://qpfviwnzpdlhvyanbjty.supabase.co` |
| **Dashboard URL** | `https://supabase.com/dashboard/project/qpfviwnzpdlhvyanbjty` |

---

## Current Issues Identified

### 1. Authentication Bug
- **Problem**: Users can edit chapters even when "Sign In" button shows
- **Root Cause**: `AuthGate` only blocks UI - no server-side enforcement
- **Impact**: All API routes are unprotected, data in localStorage has no user ownership

### 2. Missing User Settings
- API keys must be entered every session
- No default model preference saved
- Settings exist in UI but don't persist to database

### 3. No Book Library
- Books only stored in localStorage (browser-specific)
- No way to return to previous books
- No multi-device access

---

## Database Schema Design

### Core Tables

```sql
-- ============================================
-- USER SETTINGS TABLE
-- ============================================
CREATE TABLE lq21_user_settings (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Default AI Model Settings
  default_provider TEXT DEFAULT 'gemini',  -- 'openai', 'claude', 'gemini'
  default_model TEXT DEFAULT 'gemini-3-flash-preview',

  -- UI Preferences
  theme TEXT DEFAULT 'dark',  -- 'light', 'dark', 'system'
  editor_mode TEXT DEFAULT 'rich',  -- 'rich', 'raw', 'split'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id)
);

-- ============================================
-- API KEYS TABLE (already exists, enhanced)
-- ============================================
CREATE TABLE lq21_api_keys (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  provider TEXT NOT NULL,  -- 'github', 'openai', 'claude', 'gemini'
  encrypted_key TEXT NOT NULL,  -- Server-side encrypted
  key_hint TEXT,  -- Last 4 chars for display
  is_valid BOOLEAN DEFAULT true,
  last_validated_at TIMESTAMPTZ,

  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, provider)
);

-- ============================================
-- BOOKS TABLE (Library)
-- ============================================
CREATE TABLE lq21_books (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Book Identity
  title TEXT NOT NULL,
  subtitle TEXT,
  slug TEXT NOT NULL,  -- URL-friendly identifier

  -- Book Metadata
  description TEXT,
  authors JSONB DEFAULT '[]',  -- [{name, email, affiliations}]
  keywords TEXT[],
  license TEXT DEFAULT 'CC-BY-4.0',

  -- GitHub Integration
  github_username TEXT,
  github_repo_name TEXT,
  github_pages_url TEXT,
  last_deployed_at TIMESTAMPTZ,

  -- Configuration (full myst.yml equivalent)
  config JSONB DEFAULT '{}',

  -- Selected Features
  enabled_features TEXT[] DEFAULT '{}',

  -- Status
  status TEXT DEFAULT 'draft',  -- 'draft', 'published', 'archived'

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(user_id, slug)
);

-- ============================================
-- CHAPTERS TABLE
-- ============================================
CREATE TABLE lq21_chapters (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES lq21_books(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,

  -- Chapter Identity
  title TEXT NOT NULL,
  slug TEXT NOT NULL,  -- Filename without extension

  -- Content
  content TEXT DEFAULT '',

  -- Ordering
  part_index INTEGER DEFAULT 0,  -- Which part this belongs to (0 = no part)
  chapter_order INTEGER NOT NULL,  -- Order within part

  -- Chapter Settings
  numbering BOOLEAN DEFAULT true,
  chapter_features TEXT[] DEFAULT '{}',  -- Per-chapter features

  -- AI Generation Metadata
  ai_generated BOOLEAN DEFAULT false,
  generation_prompt TEXT,
  generation_model TEXT,

  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(book_id, slug)
);

-- ============================================
-- BOOK PARTS TABLE (for multi-part books)
-- ============================================
CREATE TABLE lq21_book_parts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  book_id UUID NOT NULL REFERENCES lq21_books(id) ON DELETE CASCADE,

  title TEXT NOT NULL,
  part_order INTEGER NOT NULL,

  created_at TIMESTAMPTZ DEFAULT NOW(),

  UNIQUE(book_id, part_order)
);

-- ============================================
-- ROW LEVEL SECURITY POLICIES
-- ============================================

-- Enable RLS on all tables
ALTER TABLE lq21_user_settings ENABLE ROW LEVEL SECURITY;
ALTER TABLE lq21_api_keys ENABLE ROW LEVEL SECURITY;
ALTER TABLE lq21_books ENABLE ROW LEVEL SECURITY;
ALTER TABLE lq21_chapters ENABLE ROW LEVEL SECURITY;
ALTER TABLE lq21_book_parts ENABLE ROW LEVEL SECURITY;

-- User Settings: Users can only access their own settings
CREATE POLICY "Users can view own settings" ON lq21_user_settings
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own settings" ON lq21_user_settings
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own settings" ON lq21_user_settings
  FOR UPDATE USING (auth.uid() = user_id);

-- API Keys: Users can only access their own keys
CREATE POLICY "Users can view own keys" ON lq21_api_keys
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own keys" ON lq21_api_keys
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own keys" ON lq21_api_keys
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own keys" ON lq21_api_keys
  FOR DELETE USING (auth.uid() = user_id);

-- Books: Users can only access their own books
CREATE POLICY "Users can view own books" ON lq21_books
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own books" ON lq21_books
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own books" ON lq21_books
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own books" ON lq21_books
  FOR DELETE USING (auth.uid() = user_id);

-- Chapters: Users can only access chapters of their books
CREATE POLICY "Users can view own chapters" ON lq21_chapters
  FOR SELECT USING (auth.uid() = user_id);
CREATE POLICY "Users can insert own chapters" ON lq21_chapters
  FOR INSERT WITH CHECK (auth.uid() = user_id);
CREATE POLICY "Users can update own chapters" ON lq21_chapters
  FOR UPDATE USING (auth.uid() = user_id);
CREATE POLICY "Users can delete own chapters" ON lq21_chapters
  FOR DELETE USING (auth.uid() = user_id);

-- Book Parts: Users can only access parts of their books
CREATE POLICY "Users can manage book parts" ON lq21_book_parts
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM lq21_books
      WHERE lq21_books.id = lq21_book_parts.book_id
      AND lq21_books.user_id = auth.uid()
    )
  );

-- ============================================
-- INDEXES FOR PERFORMANCE
-- ============================================
CREATE INDEX idx_books_user_id ON lq21_books(user_id);
CREATE INDEX idx_books_status ON lq21_books(status);
CREATE INDEX idx_chapters_book_id ON lq21_chapters(book_id);
CREATE INDEX idx_chapters_order ON lq21_chapters(book_id, part_index, chapter_order);
CREATE INDEX idx_api_keys_user_provider ON lq21_api_keys(user_id, provider);

-- ============================================
-- UPDATED_AT TRIGGER
-- ============================================
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_user_settings_updated_at
  BEFORE UPDATE ON lq21_user_settings
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_api_keys_updated_at
  BEFORE UPDATE ON lq21_api_keys
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_books_updated_at
  BEFORE UPDATE ON lq21_books
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER update_chapters_updated_at
  BEFORE UPDATE ON lq21_chapters
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
```

---

## Implementation Plan

### Phase 1: Fix Authentication (Critical Security Fix)

#### Step 1.1: Create Root Middleware
Create `/src/middleware.ts` to enforce authentication on all protected routes.

```typescript
// Protect: /api/* (except public endpoints), / (main app)
// Allow: /auth/*, /api/health
```

#### Step 1.2: Add API Route Protection
Add authentication checks to all API routes:
- `/api/ai/generate` - Require auth, get API keys from DB
- `/api/github/*` - Require auth, get GitHub token from DB
- `/api/models` - Can remain public (no sensitive data)

#### Step 1.3: Update AuthGate
Remove the "allow if not configured" fallback - always require auth in production.

---

### Phase 2: User Settings Implementation

#### Step 2.1: Database Hook
Create `/src/lib/supabase/hooks/useUserSettings.ts`:
- `getUserSettings()` - Fetch user's settings
- `updateSettings(settings)` - Update settings
- `getDefaultModel()` - Get user's preferred model

#### Step 2.2: Enhance Settings Page
Update `/src/components/settings/` to include:
- API Key Management (existing, needs persistence)
- Default Model Selector (new)
- Theme Preference (new)
- Editor Mode Preference (new)

#### Step 2.3: Apply Settings Throughout App
- AISetupStep: Pre-fill with saved API keys
- Model selector: Default to user's preferred model
- Editor: Default to user's preferred mode

---

### Phase 3: Book Library Implementation

#### Step 3.1: Create Library Page
Create `/src/app/library/page.tsx`:
- Grid/list view of user's books
- Search and filter capabilities
- Quick actions (edit, duplicate, archive, delete)

#### Step 3.2: Book CRUD Hooks
Create `/src/lib/supabase/hooks/useBooks.ts`:
- `getBooks()` - List all user's books
- `getBook(id)` - Get single book with chapters
- `createBook(data)` - Create new book
- `updateBook(id, data)` - Update book
- `deleteBook(id)` - Delete book (cascade to chapters)
- `duplicateBook(id)` - Clone a book

#### Step 3.3: Chapter CRUD Hooks
Create `/src/lib/supabase/hooks/useChapters.ts`:
- `getChapters(bookId)` - List chapters
- `saveChapter(data)` - Create/update chapter
- `deleteChapter(id)` - Delete chapter
- `reorderChapters(bookId, newOrder)` - Reorder

#### Step 3.4: Sync Local State to Database
Modify Zustand store to:
- Auto-save to Supabase when authenticated
- Load from Supabase on app start
- Handle offline/online sync

#### Step 3.5: Navigation Updates
- Add "Library" link to header when authenticated
- Add "New Book" button to library page
- Add "Back to Library" from editor view

---

### Phase 4: Enhanced User Experience

#### Step 4.1: Book Card Component
Create book card showing:
- Title, subtitle, description
- Chapter count
- Last edited date
- Deployment status (if published)
- Quick preview thumbnail

#### Step 4.2: Auto-Save Indicators
- Show "Saving..." indicator
- Show "Saved to cloud" confirmation
- Handle save conflicts gracefully

#### Step 4.3: Import/Export
- Export book as JSON (backup)
- Import book from JSON
- Migrate localStorage books to database

---

## File Structure (New/Modified)

```
src/
├── app/
│   ├── library/
│   │   └── page.tsx          # NEW: Book library page
│   ├── book/
│   │   └── [id]/
│   │       └── page.tsx      # NEW: Book editor (routed)
│   └── settings/
│       └── page.tsx          # NEW: Full settings page
├── middleware.ts              # NEW: Root middleware for auth
├── components/
│   ├── library/
│   │   ├── BookCard.tsx      # NEW: Book preview card
│   │   ├── BookGrid.tsx      # NEW: Grid layout
│   │   └── BookFilters.tsx   # NEW: Search/filter
│   └── settings/
│       ├── ApiKeySettings.tsx     # MODIFY: Add persistence
│       ├── ModelSettings.tsx      # NEW: Default model picker
│       └── PreferenceSettings.tsx # NEW: UI preferences
├── lib/
│   └── supabase/
│       └── hooks/
│           ├── useUserSettings.ts # NEW: Settings hook
│           ├── useBooks.ts        # NEW: Book CRUD
│           └── useChapters.ts     # NEW: Chapter CRUD
└── store/
    └── useBookStore.ts       # MODIFY: Add Supabase sync
```

---

## Default Model Configuration

Based on your request, the default model will be:

| Setting | Value |
|---------|-------|
| Provider | `gemini` |
| Model | `gemini-3-flash-preview` (Gemini 3.0 Flash) |

Users can change this in Settings → Default Model.

---

## Implementation Priority

1. **CRITICAL**: Phase 1 - Fix Authentication (security vulnerability)
2. **HIGH**: Phase 3 - Book Library (core feature)
3. **MEDIUM**: Phase 2 - User Settings (quality of life)
4. **LOW**: Phase 4 - Enhanced UX (polish)

---

## Quick Start Commands

```bash
# Access Supabase Dashboard
open https://supabase.com/dashboard/project/qpfviwnzpdlhvyanbjty

# SQL Editor for schema
open https://supabase.com/dashboard/project/qpfviwnzpdlhvyanbjty/sql

# Table Editor
open https://supabase.com/dashboard/project/qpfviwnzpdlhvyanbjty/editor
```

---

## Next Steps

1. Apply the SQL schema in Supabase SQL Editor
2. Implement root middleware for auth enforcement
3. Create book library UI
4. Update settings to persist to database
5. Sync Zustand store with Supabase

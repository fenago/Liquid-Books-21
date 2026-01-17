# Google OAuth Setup for Liquid Books

A step-by-step guide to enable "Sign in with Google" for your Supabase project.

---

## Prerequisites

- A Google account
- Access to your Supabase project dashboard
- Your app's Supabase URL: `https://qpfviwnzpdlhvyanbjty.supabase.co`

---

## Part 1: Google Cloud Console Setup

### Step 1: Create a Google Cloud Project

- [ ] Go to [Google Cloud Console](https://console.cloud.google.com/)
- [ ] Click **Select a project** (top navigation bar)
- [ ] Click **New Project** (top right of the popup)
- [ ] Enter project name: `Liquid Books`
- [ ] Click **Create**
- [ ] Wait for project creation (notification bell will show when done)
- [ ] Make sure your new project is selected in the top dropdown

---

### Step 2: Navigate to Google Auth Platform

> **Important:** Google recently updated their console. The new location is "Google Auth Platform" not "APIs & Services → OAuth consent screen"

- [ ] In the search bar at the top, type `Google Auth Platform`
- [ ] Click on **Google Auth Platform** in the results
- [ ] OR go directly to: [console.cloud.google.com/auth/overview](https://console.cloud.google.com/auth/overview)

---

### Step 3: Configure Audience (Who Can Sign In)

- [ ] In the left sidebar, click **Audience**
- [ ] OR go to: [console.cloud.google.com/auth/audience](https://console.cloud.google.com/auth/audience)
- [ ] Under "User type", select **External**
  - (This allows any Google user to sign in, not just your organization)
- [ ] Click **Create** or **Save**

#### Publish the App (Required for anyone to login)

> **Important:** By default, new apps are in "Testing" status which limits login to only test users you manually add. You need to publish to allow anyone to sign in.

- [ ] On the same **Audience** page, find the **Publishing status** section
- [ ] You should see "Testing" with a **Publish App** button
- [ ] Click **Publish App**
- [ ] In the confirmation dialog, click **Confirm**
- [ ] Status should now show **In production**

> **Note:** Since you're only using basic scopes (email, profile, openid), no verification is required. Users will see a warning screen saying "Google hasn't verified this app" but they can click "Advanced" → "Go to Liquid Books (unsafe)" to proceed. This is normal and expected.

---

### Step 4: Configure Data Access (Scopes)

- [ ] In the left sidebar, click **Data Access**
- [ ] OR go to: [console.cloud.google.com/auth/scopes](https://console.cloud.google.com/auth/scopes)
- [ ] Click **Add or Remove Scopes**
- [ ] Search for and select these scopes:
  - [ ] `openid`
  - [ ] `.../auth/userinfo.email` (usually pre-selected)
  - [ ] `.../auth/userinfo.profile` (usually pre-selected)
- [ ] Click **Update** or **Save**

> **Note:** Only select these basic scopes. Adding sensitive scopes requires Google verification which takes days/weeks.

---

### Step 5: Configure Branding

- [ ] In the left sidebar, click **Branding**
- [ ] OR go to: [console.cloud.google.com/auth/branding](https://console.cloud.google.com/auth/branding)
- [ ] Fill in the required fields:
  - [ ] **App name:** `Liquid Books`
  - [ ] **User support email:** (select your email from dropdown)
  - [ ] **App logo:** (optional - can upload later)
  - [ ] **Application home page:** `https://your-app-domain.com` (or leave blank for now)
  - [ ] **Application privacy policy link:** (optional for testing)
  - [ ] **Application terms of service link:** (optional for testing)
  - [ ] **Developer contact information:** Enter your email address
- [ ] Click **Save**

---

### Step 6: Create OAuth Client Credentials

This is the most important step - you'll get the Client ID and Secret needed for Supabase.

- [ ] In the left sidebar, click **Clients**
- [ ] OR go to: [console.cloud.google.com/auth/clients](https://console.cloud.google.com/auth/clients)
- [ ] Click **+ Create Client** (or **Create OAuth client ID**)
- [ ] Select **Web application** as the application type
- [ ] Enter name: `Liquid Books Web Client`
- [ ] Under **Authorized JavaScript origins**, click **+ Add URI** and enter:
  ```
  https://qpfviwnzpdlhvyanbjty.supabase.co
  ```
- [ ] (Optional) Add localhost for development:
  ```
  http://localhost:3000
  ```
- [ ] Under **Authorized redirect URIs**, click **+ Add URI** and enter:
  ```
  https://qpfviwnzpdlhvyanbjty.supabase.co/auth/v1/callback
  ```
- [ ] Click **Create**
- [ ] **IMPORTANT:** A popup will show your credentials. Copy and save:
  - [ ] **Client ID:** (looks like `xxxx.apps.googleusercontent.com`)
  - [ ] **Client Secret:** (random string)

> **Keep these safe!** You'll need them for Supabase configuration.

---

## Part 2: Supabase Configuration

### Step 7: Add Google Provider to Supabase

- [ ] Go to your [Supabase Dashboard](https://supabase.com/dashboard/project/qpfviwnzpdlhvyanbjty)
- [ ] In left sidebar, click **Authentication**
- [ ] Click **Providers** tab
- [ ] OR go directly to: [supabase.com/dashboard/project/qpfviwnzpdlhvyanbjty/auth/providers](https://supabase.com/dashboard/project/qpfviwnzpdlhvyanbjty/auth/providers)
- [ ] Find **Google** in the list and click to expand
- [ ] Toggle **Enable Google provider** to ON
- [ ] Paste your **Client ID** from Step 6
- [ ] Paste your **Client Secret** from Step 6
- [ ] Click **Save**

---

## Part 3: Verification

### Step 8: Test the Login

- [ ] Go to your Liquid Books application
- [ ] Click "Continue with Google" or "Sign in with Google"
- [ ] You should see Google's consent screen
- [ ] Sign in with your Google account
- [ ] You should be redirected back to your app and logged in

---

## Troubleshooting

### "Access blocked: This app's request is invalid"
- Double-check that your redirect URI in Google matches EXACTLY:
  ```
  https://qpfviwnzpdlhvyanbjty.supabase.co/auth/v1/callback
  ```
- Make sure there are no trailing slashes or typos

### "Error 400: redirect_uri_mismatch"
- The redirect URI in your app code must match what's configured in Google Console
- Check for http vs https mismatches

### "This app isn't verified"
- This is normal during development
- Click **Advanced** → **Go to Liquid Books (unsafe)** to proceed
- For production, you'll need to submit for verification

### Can't find Google Auth Platform?
- Make sure you have the correct project selected (top dropdown)
- Try the direct link: [console.cloud.google.com/auth/overview](https://console.cloud.google.com/auth/overview)
- If it shows "Enable the Google Auth Platform API", click Enable

---

## Quick Reference Links

| Resource | URL |
|----------|-----|
| Google Cloud Console | https://console.cloud.google.com/ |
| Google Auth Platform | https://console.cloud.google.com/auth/overview |
| Create OAuth Client | https://console.cloud.google.com/auth/clients/create |
| Supabase Auth Providers | https://supabase.com/dashboard/project/qpfviwnzpdlhvyanbjty/auth/providers |
| Supabase Google Docs | https://supabase.com/docs/guides/auth/social-login/auth-google |

---

## Your Configuration Values

For your reference:

| Setting | Value |
|---------|-------|
| Supabase Project URL | `https://qpfviwnzpdlhvyanbjty.supabase.co` |
| Callback URL | `https://qpfviwnzpdlhvyanbjty.supabase.co/auth/v1/callback` |
| Client ID | _(paste yours here after Step 6)_ |
| Client Secret | _(keep secure, don't commit to git)_ |

---

## Notes

- **Publishing is required:** After selecting "External" user type, you MUST click "Publish App" on the Audience page. Otherwise only manually-added test users can login.
- **No verification required for basic scopes:** Since you only need email/profile/openid, Google won't require verification.
- **Unverified app warning:** Users will see "Google hasn't verified this app" warning. They click "Advanced" → "Go to Liquid Books (unsafe)" to proceed. This is normal for apps not verified by Google.
- **To remove the warning:** Submit your app for Google verification (Branding page). This requires a privacy policy, terms of service, and takes several days. Only needed if you want a polished experience.

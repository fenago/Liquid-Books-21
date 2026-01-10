import { createServerClient } from '@supabase/ssr';
import { NextResponse, type NextRequest } from 'next/server';

// Routes that don't require authentication
const PUBLIC_ROUTES = [
  '/auth',
  '/auth/callback',
  '/auth/confirm',
  '/api/health',
];

// API routes that require authentication
const PROTECTED_API_ROUTES = [
  '/api/ai',
  '/api/github',
  '/api/edge',
  '/api/books',
  '/api/user',
];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.some(route => pathname.startsWith(route))) {
    return NextResponse.next();
  }

  // Check if Supabase is configured
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

  if (!supabaseUrl || !supabaseAnonKey) {
    // In development without Supabase, allow access but log warning
    console.warn('[Middleware] Supabase not configured - authentication disabled');
    return NextResponse.next();
  }

  let response = NextResponse.next({
    request: {
      headers: request.headers,
    },
  });

  const supabase = createServerClient(supabaseUrl, supabaseAnonKey, {
    cookies: {
      getAll() {
        return request.cookies.getAll();
      },
      setAll(cookiesToSet) {
        cookiesToSet.forEach(({ name, value }) => {
          request.cookies.set(name, value);
        });
        response = NextResponse.next({
          request,
        });
        cookiesToSet.forEach(({ name, value, options }) => {
          response.cookies.set(name, value, options);
        });
      },
    },
  });

  // Refresh session if it exists
  const {
    data: { user },
  } = await supabase.auth.getUser();

  // Check if this is a protected API route
  const isProtectedApiRoute = PROTECTED_API_ROUTES.some(route =>
    pathname.startsWith(route)
  );

  if (isProtectedApiRoute && !user) {
    return NextResponse.json(
      { error: 'Authentication required' },
      { status: 401 }
    );
  }

  // For non-API routes, redirect to home with auth modal if not authenticated
  // The AuthGate component will handle showing the login modal
  if (!user && !pathname.startsWith('/api')) {
    // Allow the request but set a header to indicate unauthenticated
    response.headers.set('x-auth-status', 'unauthenticated');
  } else if (user) {
    // Set user info in headers for API routes
    response.headers.set('x-auth-status', 'authenticated');
    response.headers.set('x-user-id', user.id);
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder files
     */
    '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
  ],
};

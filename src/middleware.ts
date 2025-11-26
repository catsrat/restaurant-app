import { createMiddlewareClient } from '@supabase/auth-helpers-nextjs';
import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';

export async function middleware(req: NextRequest) {
    const res = NextResponse.next();
    const supabase = createMiddlewareClient({ req, res });

    const {
        data: { session },
    } = await supabase.auth.getSession();

    // Define protected routes
    // We want to protect /[restaurantId]/counter and /[restaurantId]/kitchen
    // We want to allow /[restaurantId]/menu and /[restaurantId]/track
    const path = req.nextUrl.pathname;

    // Check if the path matches a protected pattern
    const isProtected =
        path.match(/^\/[^/]+\/counter/) ||
        path.match(/^\/[^/]+\/kitchen/);

    if (isProtected && !session) {
        return NextResponse.redirect(new URL('/login', req.url));
    }

    return res;
}

export const config = {
    matcher: [
        /*
         * Match all request paths except for the ones starting with:
         * - _next/static (static files)
         * - _next/image (image optimization files)
         * - favicon.ico (favicon file)
         * - public folder
         */
        '/((?!_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)',
    ],
};

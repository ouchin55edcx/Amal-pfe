import { clerkMiddleware, createRouteMatcher } from '@clerk/nextjs/server';

// Create a matcher for routes that should bypass authentication
const isPublicRoute = createRouteMatcher([
  '/',
  '/api/doctors(.*)',
  '/api/search(.*)',
  '/api/verif-test(.*)',
  '/api/send-verif-test(.*)',
  '/api/cities(.*)',
  // Add other public routes as needed
]);

export default clerkMiddleware(async (auth, req) => {
  if (!isPublicRoute(req)) {
    await auth.protect();
  }
});

export const config = {
  matcher: [
    // Skip Next.js internals and all static files, unless found in search params
    '/((?!_next|[^?]*\\.(?:html?|css|js(?!on)|jpe?g|webp|png|gif|svg|ttf|woff2?|ico|csv|docx?|xlsx?|zip|webmanifest)).*)',
    // Always run for API routes
    '/(api|trpc)(.*)',
  ],
};

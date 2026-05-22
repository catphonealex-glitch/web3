import { Outlet, Link, createRootRoute, HeadContent, Scripts } from "@tanstack/react-router";
import { AuthProvider } from "@/lib/auth";
import { I18nProvider } from "@/lib/i18n";
import { Header } from "@/components/Header";
import { Toaster } from "sonner";

import appCss from "../styles.css?url";

function NotFoundComponent() {
  return (
    <div className="flex min-h-screen items-center justify-center px-4">
      <div className="max-w-md text-center">
        <h1 className="text-7xl font-bold text-gradient">404</h1>
        <h2 className="mt-4 text-xl font-semibold">Off-script</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          This scene doesn't exist. Let's get you back to the studio.
        </p>
        <Link to="/" className="mt-6 inline-flex px-4 py-2 rounded-lg bg-cta text-primary-foreground font-medium">
          Back to projects
        </Link>
      </div>
    </div>
  );
}

export const Route = createRootRoute({
  head: () => ({
    meta: [
      { charSet: "utf-8" },
      { name: "viewport", content: "width=device-width, initial-scale=1" },
      { title: "DubStage — Amateur Dubbing Community" },
      { name: "description", content: "Launch your voice-acting career. Practice amateur dubbing, post projects, audition with voice demos, and build a portfolio with a community of aspiring dub artists." },
      { property: "og:title", content: "DubStage — Amateur Dubbing Community" },
      { property: "og:description", content: "Practice dubbing, audition for projects, and build a voice-acting career from the ground up." },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary" },
    ],
    links: [
      { rel: "stylesheet", href: appCss },
      { rel: "preconnect", href: "https://fonts.googleapis.com" },
      { rel: "preconnect", href: "https://fonts.gstatic.com", crossOrigin: "anonymous" },
      { rel: "stylesheet", href: "https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=JetBrains+Mono:wght@400;600&display=swap" },
    ],
  }),
  shellComponent: RootShell,
  component: RootComponent,
  notFoundComponent: NotFoundComponent,
});

function RootShell({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <head>
        <HeadContent />
      </head>
      <body>
        {children}
        <Scripts />
      </body>
    </html>
  );
}

function RootComponent() {
  return (
    <I18nProvider>
      <AuthProvider>
        <Header />
        <Outlet />
        <Toaster theme="dark" richColors position="top-right" />
      </AuthProvider>
    </I18nProvider>
  );
}

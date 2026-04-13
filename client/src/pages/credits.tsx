import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/themeContext";
import { ThemeToggle } from "@/components/theme-toggle";
import logoLight from "@assets/Gradevue_Design_Pack_(2)_1765931756566.png";
import logoDark from "@assets/Gradevue_Design_Pack_(2)_1766033013644.png";
import { ArrowLeft, ExternalLink } from "lucide-react";

const openSourceLibraries = [
  {
    name: "React",
    description: "UI rendering library",
    url: "https://react.dev",
    license: "MIT",
  },
  {
    name: "Vite",
    description: "Frontend build tool",
    url: "https://vitejs.dev",
    license: "MIT",
  },
  {
    name: "TanStack Query",
    description: "Async state management and data fetching",
    url: "https://tanstack.com/query",
    license: "MIT",
  },
  {
    name: "Wouter",
    description: "Lightweight routing for React",
    url: "https://github.com/molefrog/wouter",
    license: "ISC",
  },
  {
    name: "Tailwind CSS",
    description: "Utility-first CSS framework",
    url: "https://tailwindcss.com",
    license: "MIT",
  },
  {
    name: "shadcn/ui",
    description: "Accessible component library built on Radix UI",
    url: "https://ui.shadcn.com",
    license: "MIT",
  },
  {
    name: "Radix UI",
    description: "Unstyled, accessible component primitives",
    url: "https://www.radix-ui.com",
    license: "MIT",
  },
  {
    name: "Lucide React",
    description: "Icon library",
    url: "https://lucide.dev",
    license: "ISC",
  },
  {
    name: "Express",
    description: "Node.js web framework for the backend",
    url: "https://expressjs.com",
    license: "MIT",
  },
  {
    name: "Drizzle ORM",
    description: "TypeScript ORM for database operations",
    url: "https://orm.drizzle.team",
    license: "Apache-2.0",
  },
  {
    name: "Zod",
    description: "TypeScript-first schema validation",
    url: "https://zod.dev",
    license: "MIT",
  },
  {
    name: "React Hook Form",
    description: "Performant form state management",
    url: "https://react-hook-form.com",
    license: "MIT",
  },
  {
    name: "Recharts",
    description: "Charting library for React",
    url: "https://recharts.org",
    license: "MIT",
  },
];

export default function CreditsPage() {
  const { theme } = useTheme();
  const [, navigate] = useLocation();
  const logo = theme === "dark" ? logoDark : logoLight;

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/50 bg-background/80 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <img src={logo} alt="GradeVue 2" className="h-8 w-auto object-contain" data-testid="img-credits-logo" />
        </div>
        <div className="flex items-center gap-3">
          <ThemeToggle />
          <Button variant="outline" size="sm" className="gap-2" onClick={() => navigate("/")} data-testid="button-back-home">
            <ArrowLeft className="h-4 w-4" />
            Back
          </Button>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-2xl px-6 py-16">
        <div className="mb-12 text-center">
          <h1 className="text-3xl font-bold tracking-tight" data-testid="heading-credits">Credits</h1>
          <p className="mt-2 text-muted-foreground">
            The people and projects that make GradeVue 2 possible.
          </p>
        </div>

        <section className="mb-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground" data-testid="heading-team">
            Team
          </h2>
          <div className="space-y-4">
            <div className="rounded-xl border border-border/60 bg-card p-5" data-testid="card-victor">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">Victor T.</p>
                  <p className="text-sm text-muted-foreground">Developer &amp; Founder</p>
                </div>
                <span className="rounded-md bg-primary/10 px-2 py-0.5 text-xs font-medium text-primary">
                  Developer
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Designed and built GradeVue 2 from scratch. Created the original design mockup, wrote the
                core codebase, and continues to lead development.
              </p>
            </div>

            <div className="rounded-xl border border-border/60 bg-card p-5" data-testid="card-connor">
              <div className="flex items-start justify-between">
                <div>
                  <p className="font-semibold">Connor Rakov</p>
                  <p className="text-sm text-muted-foreground">Contributor</p>
                </div>
                <span className="rounded-md bg-secondary px-2 py-0.5 text-xs font-medium text-secondary-foreground">
                  Contributor
                </span>
              </div>
              <p className="mt-3 text-sm text-muted-foreground leading-relaxed">
                Contributed to the development of GradeVue 2.
              </p>
            </div>
          </div>
        </section>

        <section className="mb-12">
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground" data-testid="heading-oss">
            Open-Source Libraries
          </h2>
          <div className="rounded-xl border border-border/60 bg-card overflow-hidden divide-y divide-border/40">
            {openSourceLibraries.map((lib) => (
              <div
                key={lib.name}
                className="flex items-center justify-between px-5 py-3"
                data-testid={`row-lib-${lib.name.toLowerCase().replace(/[\s/]/g, "-")}`}
              >
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-sm">{lib.name}</span>
                    <span className="text-xs text-muted-foreground/60 hidden sm:inline">{lib.license}</span>
                  </div>
                  <p className="text-xs text-muted-foreground truncate">{lib.description}</p>
                </div>
                <a
                  href={lib.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="ml-4 shrink-0 text-muted-foreground/50 hover:text-foreground transition-colors"
                  data-testid={`link-lib-${lib.name.toLowerCase().replace(/[\s/]/g, "-")}`}
                >
                  <ExternalLink className="h-3.5 w-3.5" />
                </a>
              </div>
            ))}
          </div>
        </section>

        <section>
          <h2 className="mb-4 text-sm font-semibold uppercase tracking-widest text-muted-foreground" data-testid="heading-license">
            License
          </h2>
          <div className="rounded-xl border border-border/60 bg-card p-5 text-sm text-muted-foreground leading-relaxed">
            <p>
              GradeVue 2 is free and open-source software released under the{" "}
              <a
                href="https://www.gnu.org/licenses/gpl-3.0.html"
                target="_blank"
                rel="noopener noreferrer"
                className="text-foreground underline underline-offset-2 hover:text-primary transition-colors"
                data-testid="link-gpl-credits"
              >
                GNU General Public License v3.0
              </a>
              . GradeVue is an independent project and is not affiliated with StudentVue or Edupoint.
            </p>
            <p className="mt-3">© 2026 GradeVue Contributors.</p>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 px-6 py-5 text-center text-xs text-muted-foreground/60">
        <p>
          Developed by Victor T. and the GradeVue 2 Team · With contributions from Connor Rakov
          <span className="mx-2">·</span>
          <a
            href="/"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
            data-testid="link-home-footer"
          >
            Home
          </a>
        </p>
      </footer>
    </div>
  );
}

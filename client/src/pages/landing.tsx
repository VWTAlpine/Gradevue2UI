import { useEffect, useRef, useState } from "react";
import { useLocation } from "wouter";
import { Button } from "@/components/ui/button";
import { useTheme } from "@/lib/themeContext";
import { ThemeToggle } from "@/components/theme-toggle";
import logoLight from "@assets/Gradevue_Design_Pack_(2)_1765931756566.png";
import logoDark from "@assets/Gradevue_Design_Pack_(2)_1766033013644.png";
import designMockup from "@assets/Gradevue_Design_Pack_1765927338287.png";
import {
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  Calculator,
  CalendarCheck,
  Clock,
  MessageSquare,
  Sparkles,
  ArrowRight,
  GraduationCap,
} from "lucide-react";

function useInView(threshold = 0.15) {
  const ref = useRef<HTMLDivElement>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setInView(true);
          observer.disconnect();
        }
      },
      { threshold }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return { ref, inView };
}

interface FeatureSectionProps {
  icon: React.ReactNode;
  title: string;
  description: string;
  index: number;
}

function FeatureSection({ icon, title, description, index }: FeatureSectionProps) {
  const { ref, inView } = useInView();
  const isEven = index % 2 === 0;

  return (
    <div
      ref={ref}
      className={`flex flex-col md:flex-row items-center gap-8 py-12 transition-all duration-700 ${
        inView ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      } ${isEven ? "md:flex-row" : "md:flex-row-reverse"}`}
      data-testid={`feature-section-${index}`}
    >
      <div className="flex-1 space-y-4">
        <div className="inline-flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-primary/10 text-primary">
            {icon}
          </div>
          <h3 className="text-xl font-semibold tracking-tight">{title}</h3>
        </div>
        <p className="text-muted-foreground leading-relaxed max-w-lg">{description}</p>
      </div>
      <div className="flex-1 flex justify-center">
        <div className="h-36 w-full max-w-xs rounded-2xl bg-gradient-to-br from-primary/10 via-primary/5 to-transparent border border-border/60 flex items-center justify-center">
          <div className="text-primary/30 scale-[3]">{icon}</div>
        </div>
      </div>
    </div>
  );
}

const features = [
  {
    icon: <LayoutDashboard className="h-5 w-5" />,
    title: "Dashboard & GPA at a Glance",
    description:
      "Your GPA, average grade, course overview, and attendance numbers — all on one page. No hunting around, no tab-switching.",
  },
  {
    icon: <BookOpen className="h-5 w-5" />,
    title: "Course Detail View",
    description:
      "Tap any course to see every assignment, category weights, and grade history. Sort, filter, and understand exactly where each point came from.",
  },
  {
    icon: <FlaskConical className="h-5 w-5" />,
    title: "What-If Grade Mode",
    description:
      "Add hypothetical assignments or change existing scores to see how your grade would shift before it actually does. Useful for planning, not just worrying.",
  },
  {
    icon: <Calculator className="h-5 w-5" />,
    title: "GPA Calculator",
    description:
      "Plug in different grade scenarios and watch your GPA update in real time. Weighted and unweighted. No spreadsheets required.",
  },
  {
    icon: <CalendarCheck className="h-5 w-5" />,
    title: "Attendance",
    description:
      "See your absences and tardies per course, per period. Clean, organized, and actually readable — unlike the original.",
  },
  {
    icon: <Clock className="h-5 w-5" />,
    title: "Upcoming Deadlines",
    description:
      "A chronological view of upcoming assignments across all your courses. Know what's due before it sneaks up on you.",
  },
  {
    icon: <MessageSquare className="h-5 w-5" />,
    title: "Messages & Documents",
    description:
      "Access school messages and documents directly in the app. Everything StudentVue has, in a format that doesn't feel like 2008.",
  },
  {
    icon: <Sparkles className="h-5 w-5" />,
    title: "AI-Powered Grade Summary",
    description:
      "Get a plain-language breakdown of your performance — what's going well, what needs attention, and where your grade actually stands. Written to be useful, not impressive-sounding.",
  },
];

export default function LandingPage() {
  const { theme } = useTheme();
  const [, navigate] = useLocation();
  const logo = theme === "dark" ? logoDark : logoLight;
  const [heroVisible, setHeroVisible] = useState(false);
  const founderRef = useRef<HTMLDivElement>(null);
  const [founderVisible, setFounderVisible] = useState(false);

  useEffect(() => {
    const timer = setTimeout(() => setHeroVisible(true), 100);
    return () => clearTimeout(timer);
  }, []);

  useEffect(() => {
    const el = founderRef.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setFounderVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-50 flex items-center justify-between border-b border-border/50 bg-background/80 px-6 py-3 backdrop-blur-md">
        <div className="flex items-center gap-2">
          <img src={logo} alt="GradeVue 2" className="h-8 w-auto object-contain" data-testid="img-landing-logo" />
        </div>
        <nav className="flex items-center gap-3">
          <a
            href="/credits"
            className="text-sm text-muted-foreground hover:text-foreground transition-colors"
            data-testid="link-credits-nav"
          >
            Credits
          </a>
          <ThemeToggle />
          <Button size="sm" onClick={() => navigate("/login")} data-testid="button-nav-login">
            Sign In
          </Button>
        </nav>
      </header>

      <main className="flex-1">
        <section
          className={`flex flex-col items-center justify-center px-6 py-24 text-center transition-all duration-700 ${
            heroVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <img
            src={logo}
            alt="GradeVue 2 Logo"
            className="mb-6 h-32 w-auto object-contain"
            data-testid="img-hero-logo"
          />
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl md:text-6xl">
            Your grades, actually readable.
          </h1>
          <p className="mt-4 max-w-xl text-lg text-muted-foreground">
            A beautiful, full-fledged replacement for StudentVue, Enhanced by AI.
          </p>
          <p className="mt-1 text-sm font-medium text-primary/70 tracking-wide uppercase">
            By students, for students
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2" onClick={() => navigate("/login")} data-testid="button-hero-signin">
              Get Started <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login")} data-testid="button-hero-demo">
              Try the Demo
            </Button>
          </div>
          <p className="mt-4 text-xs text-muted-foreground/60">
            Works with any StudentVue-connected school district.
          </p>
        </section>

        <section className="border-y border-border/40 bg-muted/30 px-6 py-6">
          <div className="mx-auto max-w-4xl flex flex-wrap justify-center gap-2.5">
            {[
              { icon: <LayoutDashboard className="h-3.5 w-3.5" />, label: "See my GPA at a glance" },
              { icon: <FlaskConical className="h-3.5 w-3.5" />, label: "Run what-if scenarios" },
              { icon: <BookOpen className="h-3.5 w-3.5" />, label: "Break down each course" },
              { icon: <Sparkles className="h-3.5 w-3.5" />, label: "Get AI-powered insights" },
              { icon: <CalendarCheck className="h-3.5 w-3.5" />, label: "Track my attendance" },
              { icon: <Clock className="h-3.5 w-3.5" />, label: "Never miss a deadline" },
              { icon: <MessageSquare className="h-3.5 w-3.5" />, label: "Read school messages" },
              { icon: <Calculator className="h-3.5 w-3.5" />, label: "Calculate my GPA" },
            ].map(({ icon, label }) => (
              <span
                key={label}
                className="inline-flex items-center gap-2 rounded-full border border-primary/20 bg-primary/10 px-4 py-1.5 text-sm font-medium text-primary/80 shadow-sm transition-colors hover:border-primary/40 hover:bg-primary/20 hover:text-primary"
              >
                {icon}
                {label}
              </span>
            ))}
          </div>
        </section>

        <section className="mx-auto max-w-4xl px-6 py-16 divide-y divide-border/40">
          {features.map((feature, i) => (
            <FeatureSection key={feature.title} {...feature} index={i} />
          ))}
        </section>

        <section
          ref={founderRef}
          className={`mx-auto max-w-4xl px-6 py-20 transition-all duration-700 ${
            founderVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
          data-testid="section-founder"
        >
          <div className="mb-8 text-center">
            <h2 className="text-2xl font-bold tracking-tight">Why I Built This</h2>
          </div>
          <div className="flex flex-col md:flex-row gap-10 items-start">
            <div className="flex-1">
              <div className="rounded-2xl overflow-hidden border border-border/60 shadow-md">
                <img
                  src={designMockup}
                  alt="Original GradeVue design mockup by Victor T."
                  className="w-full object-cover"
                  data-testid="img-founder-mockup"
                />
              </div>
              <p className="mt-2 text-center text-xs text-muted-foreground">
                Victor's original design mockup
              </p>
            </div>
            <div className="flex-1 flex flex-col justify-center space-y-6">
              <blockquote className="border-l-4 border-primary pl-5 text-base leading-relaxed text-foreground/90">
                "I developed GradeVue 2 to find a solution to the terrible &amp; outdated UI, slow loading
                time, and overall jankiness of StudentVue. When I started developing, GradeVue (Now
                GradeCompass) was broken, so I created a replacement. Now, I've decided to make it much
                more."
              </blockquote>
              <p className="pl-5 text-sm font-semibold text-muted-foreground">— Victor</p>
            </div>
          </div>
        </section>

        <section className="border-t border-border/40 bg-primary/5 px-6 py-20 text-center">
          <GraduationCap className="mx-auto mb-4 h-10 w-10 text-primary/60" />
          <h2 className="text-2xl font-bold tracking-tight">Ready to see it for yourself?</h2>
          <p className="mt-2 text-muted-foreground">
            Sign in with your StudentVue account or try the demo with sample data.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row gap-4 justify-center">
            <Button size="lg" className="gap-2" onClick={() => navigate("/login")} data-testid="button-cta-signin">
              Sign In <ArrowRight className="h-4 w-4" />
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/login")} data-testid="button-cta-demo">
              Try Demo
            </Button>
          </div>
        </section>
      </main>

      <footer className="border-t border-border/40 px-6 py-5 text-center text-xs text-muted-foreground/60">
        <p>
          Developed by Victor T. and the GradeVue 2 Team · With contributions from Connor Rakov
          <span className="mx-2">·</span>
          <a
            href="/credits"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
            data-testid="link-credits-footer"
          >
            Credits
          </a>
          <span className="mx-2">·</span>
          © 2026 GradeVue Contributors. Licensed under{" "}
          <a
            href="https://www.gnu.org/licenses/gpl-3.0.html"
            target="_blank"
            rel="noopener noreferrer"
            className="underline underline-offset-2 hover:text-foreground transition-colors"
            data-testid="link-gpl-landing"
          >
            GNU GPLv3
          </a>
        </p>
      </footer>
    </div>
  );
}

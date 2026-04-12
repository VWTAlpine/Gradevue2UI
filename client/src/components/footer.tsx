export function Footer() {
  return (
    <footer className="shrink-0 border-t px-4 py-3 text-center text-xs text-muted-foreground/70" data-testid="app-footer">
      <p>
        Developed by Victor T, Connor Rakov, and the GradeVue 2 Team.
        <span className="mx-1">|</span>
        © 2026 GradeVue Contributors. Licensed under{" "}
        <a
          href="https://www.gnu.org/licenses/gpl-3.0.html"
          target="_blank"
          rel="noopener noreferrer"
          className="underline underline-offset-2 hover:text-foreground transition-colors"
        >
          GNU GPLv3
        </a>
        .
      </p>
    </footer>
  );
}

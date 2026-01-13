import { Button } from "@/components/ui/button";
import { Download, Check } from "lucide-react";
import { usePWAInstall } from "@/hooks/use-pwa-install";

interface PWAInstallButtonProps {
  variant?: "default" | "outline" | "ghost" | "secondary";
  size?: "default" | "sm" | "lg" | "icon";
  className?: string;
  showLabel?: boolean;
}

export function PWAInstallButton({ 
  variant = "outline", 
  size = "sm",
  className = "",
  showLabel = true,
}: PWAInstallButtonProps) {
  const { isInstallable, isInstalled, promptInstall } = usePWAInstall();

  if (isInstalled) {
    return (
      <Button
        variant={variant}
        size={size}
        disabled
        className={`gap-2 ${className}`}
        data-testid="button-pwa-installed"
      >
        <Check className="h-4 w-4" />
        {showLabel && <span className="hidden sm:inline">Installed</span>}
      </Button>
    );
  }

  if (!isInstallable) {
    return null;
  }

  return (
    <Button
      variant={variant}
      size={size}
      onClick={promptInstall}
      className={`gap-2 ${className}`}
      data-testid="button-pwa-install"
    >
      <Download className="h-4 w-4" />
      {showLabel && <span className="hidden sm:inline">Install App</span>}
    </Button>
  );
}

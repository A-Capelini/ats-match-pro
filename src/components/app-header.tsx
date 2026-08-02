import { Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type Props = {
  onOpenSettings: () => void;
};

export function AppHeader({ onOpenSettings }: Props) {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/95 backdrop-blur">
      <div className="mx-auto grid max-w-5xl grid-cols-[minmax(0,1fr)_auto] items-center gap-4 px-4 py-3 sm:px-6">
        <div className="flex min-w-0 items-center gap-2">
          <span
            aria-hidden="true"
            className="grid size-9 shrink-0 place-items-center rounded-md bg-primary font-semibold text-primary-foreground"
          >
            AM
          </span>
          <span className="truncate text-lg font-semibold tracking-tight text-foreground">
            ATS Match Pro
          </span>
        </div>

        <Tooltip>
          <TooltipTrigger asChild>
            <Button
              variant="ghost"
              size="icon"
              aria-label="Abrir configurações"
              onClick={onOpenSettings}
              className="min-h-11 min-w-11 focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              <Settings aria-hidden="true" />
            </Button>
          </TooltipTrigger>
          <TooltipContent>Configurar sua chave de API (OpenAI ou Gemini)</TooltipContent>
        </Tooltip>
      </div>
    </header>
  );
}

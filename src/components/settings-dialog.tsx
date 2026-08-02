import { useEffect, useState } from "react";
import { KeyRound } from "lucide-react";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { clearApiKey, getApiKey, saveApiKey } from "@/lib/api-key";

type Props = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: (key: string) => void;
};

export function SettingsDialog({ open, onOpenChange, onSaved }: Props) {
  const [value, setValue] = useState("");

  useEffect(() => {
    if (open) setValue(getApiKey());
  }, [open]);

  function handleSave() {
    const trimmed = value.trim();
    if (!trimmed) {
      toast.error("Chave de API obrigatória", {
        description: "Informe uma chave válida da OpenAI ou do Gemini para continuar.",
      });
      return;
    }
    saveApiKey(trimmed);
    onSaved?.(trimmed);
    onOpenChange(false);
    toast.success("Chave salva neste navegador");
  }

  function handleRemove() {
    clearApiKey();
    setValue("");
    onSaved?.("");
    toast.success("Chave removida deste navegador");
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <KeyRound className="size-5" aria-hidden="true" />
            Configurações
          </DialogTitle>
          <DialogDescription>
            O ATS Match Pro usa a sua própria chave de API. Ela fica salva apenas no
            armazenamento local deste navegador e nunca é enviada aos nossos servidores.
          </DialogDescription>
        </DialogHeader>

        <div className="grid gap-2 py-2">
          <Label htmlFor="api-key">Chave de API (OpenAI ou Gemini)</Label>
          <Input
            id="api-key"
            type="password"
            autoComplete="off"
            aria-label="Chave de API da OpenAI ou Gemini"
            aria-describedby="api-key-help"
            placeholder="sk-... ou AIza..."
            value={value}
            onChange={(e) => setValue(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === "Enter") handleSave();
            }}
            className="font-mono"
          />
          <p id="api-key-help" className="text-sm text-muted-foreground">
            Gere a chave no painel da OpenAI ou no Google AI Studio.
          </p>
        </div>

        <DialogFooter className="gap-2 sm:justify-between">
          <Button
            type="button"
            variant="outline"
            onClick={handleRemove}
            className="min-h-11"
            aria-label="Remover chave de API salva"
          >
            Remover chave
          </Button>
          <Button type="button" onClick={handleSave} className="min-h-11">
            Salvar chave
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

import { useEffect, useRef, useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";

type InstallPrompt = Event & { prompt: () => Promise<void>; userChoice: Promise<{ outcome: string }> };
type LibraryWindow = Window & { libraryClient?: typeof supabase; libraryRecovery?: boolean; init?: () => Promise<void> };

export function LibraryFrame({ initialHash = "#/", recovery = false }: { initialHash?: string; recovery?: boolean }) {
  const frame = useRef<HTMLIFrameElement>(null);
  const prompt = useRef<InstallPrompt | null>(null);
  const [installHelp, setInstallHelp] = useState(false);
  const [error, setError] = useState("");
  useEffect(() => {
    const capture = (event: Event) => { event.preventDefault(); prompt.current = event as InstallPrompt; };
    const install = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin || event.source !== frame.current?.contentWindow || event.data?.type !== "library-install") return;
      if (prompt.current) { await prompt.current.prompt(); await prompt.current.userChoice; prompt.current = null; }
      else setInstallHelp(true);
    };
    window.addEventListener("beforeinstallprompt", capture);
    window.addEventListener("message", install);
    return () => { window.removeEventListener("beforeinstallprompt", capture); window.removeEventListener("message", install); };
  }, []);
  async function initialize() {
    const child = frame.current?.contentWindow as LibraryWindow | null;
    if (!child?.init) return;
    child.libraryClient = supabase;
    child.libraryRecovery = recovery;
    try { await child.init(); } catch { setError("Não foi possível abrir a biblioteca. Tente novamente."); }
  }
  return <>
    <iframe ref={frame} src={`/biblioteca.html${initialHash}`} title="Minha Biblioteca" onLoad={initialize} className="fixed inset-0 h-dvh w-full border-0" />
    {error && <div role="alert" className="fixed inset-0 grid place-items-center bg-background p-6 text-foreground"><div>{error}<Button onClick={initialize} className="ml-3">Tentar novamente</Button></div></div>}
    {installHelp && <div className="fixed inset-0 z-50 grid place-items-center bg-background/95 p-6"><section role="dialog" aria-modal="true" aria-labelledby="install-title" className="w-full max-w-sm rounded-lg border border-border bg-card p-6 text-card-foreground"><h2 id="install-title" className="text-xl font-semibold">Baixar app</h2><p className="my-4 text-sm leading-6">Abra o endereço publicado da biblioteca no navegador do celular. No iPhone, toque em Compartilhar e Adicionar à Tela de Início. No Android, abra o menu e escolha Instalar app ou Adicionar à tela inicial.</p><Button onClick={() => setInstallHelp(false)}>Entendi</Button></section></div>}
  </>;
}
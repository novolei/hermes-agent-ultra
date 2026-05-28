import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { agentBridge, listenAgent } from "@/lib/bridge";
import { Button } from "@/shared/ui/button";

const SESSION_ID = "default";

export function App() {
  const { t } = useTranslation();
  const [input, setInput] = useState("");
  const [streaming, setStreaming] = useState<string>("");
  const [history, setHistory] = useState<{ role: "user" | "assistant"; text: string }[]>([]);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const streamRef = useRef("");

  // Subscribe to streaming events for the current session.
  useEffect(() => {
    let unlistenDelta: (() => void) | undefined;
    let unlistenDone: (() => void) | undefined;
    let unlistenError: (() => void) | undefined;

    void (async () => {
      unlistenDelta = await listenAgent("agent:text-delta", (e) => {
        if (e.session_id !== SESSION_ID) return;
        streamRef.current += e.text;
        setStreaming(streamRef.current);
      });
      unlistenDone = await listenAgent("agent:done", (e) => {
        if (e.session_id !== SESSION_ID) return;
        const finalText = streamRef.current;
        streamRef.current = "";
        setStreaming("");
        if (finalText) setHistory((h) => [...h, { role: "assistant", text: finalText }]);
      });
      unlistenError = await listenAgent("agent:error", (e) => {
        if (e.session_id !== SESSION_ID) return;
        setError(e.message);
        streamRef.current = "";
        setStreaming("");
      });
    })();

    return () => {
      unlistenDelta?.();
      unlistenDone?.();
      unlistenError?.();
    };
  }, []);

  async function handleSend() {
    const text = input.trim();
    if (!text || sending) return;
    setInput("");
    setError(null);
    setHistory((h) => [...h, { role: "user", text }]);
    setSending(true);
    streamRef.current = "";
    setStreaming("");
    try {
      await agentBridge.agentSendMessage(SESSION_ID, text);
    } catch (e) {
      setError(String(e));
    } finally {
      setSending(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col gap-4 p-6">
      <h1 className="text-2xl font-semibold">Hermes Agent Ultra</h1>

      <section className="flex flex-1 flex-col gap-3 overflow-y-auto rounded-md border border-border p-4">
        {history.length === 0 && !streaming && (
          <p className="text-muted-foreground">{t("chat.empty")}</p>
        )}
        {history.map((m, i) => (
          <div key={i} className={m.role === "user" ? "self-end" : "self-start"}>
            <p className="rounded-md bg-muted px-3 py-2 text-sm">{m.text}</p>
          </div>
        ))}
        {streaming && (
          <div className="self-start">
            <p className="rounded-md bg-muted px-3 py-2 text-sm">{streaming}▌</p>
          </div>
        )}
      </section>

      {error && (
        <p className="text-red-500 text-sm">
          {t("chat.error_prefix", { message: error })}
        </p>
      )}

      <form
        className="flex gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          void handleSend();
        }}
      >
        <input
          className="flex-1 rounded-md border border-border bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary"
          placeholder={t("chat.placeholder")}
          value={input}
          onChange={(e) => setInput(e.target.value)}
          disabled={sending}
          aria-label={t("chat.placeholder")}
        />
        <Button type="submit" disabled={sending || !input.trim()}>
          {sending ? t("chat.sending") : t("chat.send")}
        </Button>
      </form>
    </main>
  );
}

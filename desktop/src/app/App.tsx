import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { appBridge, type AppInfo } from "@/lib/bridge";
import { Button } from "@/shared/ui/button";

export function App() {
  const { t } = useTranslation();
  const [info, setInfo] = useState<AppInfo | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    appBridge.appInfo().then(setInfo).catch((e) => setError(String(e)));
  }, []);

  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-4">
      <h1 className="text-2xl font-semibold">
        {info ? `${info.name} v${info.version}` : t("app.loading")}
      </h1>
      {info && <p className="text-muted-foreground">{t("app.platform", { platform: info.platform })}</p>}
      {error && <p className="text-red-500">{error}</p>}
      <Button onClick={() => appBridge.appInfo().then(setInfo).catch((e) => setError(String(e)))}>
        {t("app.refresh")}
      </Button>
    </main>
  );
}

"use client";

import { AppShell } from "@/components/AppShell";
import { Header } from "@/components/Header";
import type { HeaderAlert } from "@/components/Header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Monitor } from "lucide-react";
// Simple QR Code component - using canvas approach
function QRCode({ value, size }: { value: string; size: number }) {
  const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=${size}x${size}&data=${encodeURIComponent(value)}`;
  return <img src={qrUrl} alt="QR Code" className="mx-auto" />;
}

export default function DisplayHelpPage() {
  const displayUrl = typeof window !== "undefined" 
    ? `${window.location.origin}/display`
    : "";

  const headerAlerts: HeaderAlert[] = [
    {
      label: "Modo TV",
      icon: <Monitor className="h-3.5 w-3.5" />,
    },
  ];

  return (
    <AppShell
      header={
        <Header
          title="Tela de Exibição"
          subtitle="Compartilhe o link ou escaneie o QR Code para ativar o painel da TV."
          alerts={headerAlerts}
        />
      }
    >
      <div className="container mx-auto px-4 py-6 md:px-6 md:py-8 lg:px-8 lg:py-10">
        <div className="max-w-2xl mx-auto space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="text-2xl">Como conectar na TV Smart</CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h3 className="text-lg font-semibold mb-2">Passo 1: Abra o navegador na TV</h3>
                  <p className="text-muted-foreground">
                    Na sua TV Smart, abra o navegador de internet (Chrome, Firefox, Safari, etc.)
                  </p>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Passo 2: Escaneie o QR Code</h3>
                  <p className="text-muted-foreground mb-4">
                    Use a câmera do seu celular para escanear o QR Code abaixo. Isso abrirá o link da tela de exibição.
                  </p>
                  {displayUrl && (
                    <div className="flex justify-center p-4 bg-white rounded-lg">
                      <QRCode value={displayUrl} size={200} />
                    </div>
                  )}
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Passo 3: Copie o link</h3>
                  <p className="text-muted-foreground mb-2">
                    Se preferir, você pode copiar o link abaixo e colar no navegador da TV:
                  </p>
                  <div className="p-3 bg-muted rounded-lg font-mono text-sm break-all">
                    {displayUrl || "Carregando..."}
                  </div>
                </div>

                <div>
                  <h3 className="text-lg font-semibold mb-2">Passo 4: Configure a TV</h3>
                  <p className="text-muted-foreground">
                    Após abrir o link na TV, a tela de exibição será mostrada automaticamente. 
                    Recomendamos configurar a TV para não entrar em modo de economia de energia.
                  </p>
                </div>
              </div>

              <div className="pt-4 border-t">
                <p className="text-sm text-muted-foreground">
                  <strong>Dica:</strong> Se a TV tiver suporte, você pode adicionar a página aos favoritos 
                  para acesso rápido no futuro.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </AppShell>
  );
}


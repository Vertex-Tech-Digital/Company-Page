import { useState } from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle2, Building2, Copy } from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  DATOS BANCARIOS OFICIALES (BBVA)                                           */
/* -------------------------------------------------------------------------- */
const getEnvVar = (key: string): string => {
  const value = import.meta.env[key];
  if (!value && import.meta.env.DEV) {
    console.warn(
      `[Checkout Warning]: La variable de entorno ${key} no está definida.`,
    );
  }
  return typeof value === "string" ? value.trim() : "";
};

const BANK_DETAILS = {
  beneficiary: getEnvVar("VITE_BANK_BENEFICIARY"),
  bank: getEnvVar("VITE_BANK_NAME"),
  iban: getEnvVar("VITE_BANK_IBAN"),
  bic: getEnvVar("VITE_BANK_BIC"),
};

/* -------------------------------------------------------------------------- */
/*  Flujo de transferencia bancaria                                           */
/* -------------------------------------------------------------------------- */
function TransferFlow() {
  const [copied, setCopied] = useState<string | null>(null);
  const [concept, setConcept] = useState("");

  function copy(value: string, key: string) {
    if (!value) return;
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  const rows: { label: string; value: string; key: string }[] = [
    {
      label: "Beneficiario",
      value: BANK_DETAILS.beneficiary,
      key: "beneficiary",
    },
    { label: "Banco", value: BANK_DETAILS.bank, key: "bank" },
    { label: "IBAN", value: BANK_DETAILS.iban, key: "iban" },
    { label: "BIC / SWIFT", value: BANK_DETAILS.bic, key: "bic" },
  ];

  return (
    <div className="bg-card/50 backdrop-blur-md border border-border p-8 rounded-2xl shadow-xl">
      <div className="flex items-center gap-3 mb-2">
        <Building2 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-white">Transferencia bancaria</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Realiza una transferencia con los siguientes datos. Te enviaremos la
        factura una vez confirmado el ingreso.
      </p>

      <div className="space-y-3">
        {rows.map((row) => (
          <div
            key={row.key}
            className="flex items-center justify-between gap-4 border-b border-border/60 pb-3"
          >
            <div className="min-w-0">
              <p className="text-xs uppercase tracking-wide text-muted-foreground">
                {row.label}
              </p>
              <p className="text-sm text-white font-medium truncate">
                {row.value}
              </p>
            </div>
            <button
              type="button"
              onClick={() => copy(row.value, row.key)}
              className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
              aria-label={`Copiar ${row.label}`}
            >
              {copied === row.key ? (
                <CheckCircle2 className="w-4 h-4 text-primary" />
              ) : (
                <Copy className="w-4 h-4" />
              )}
            </button>
          </div>
        ))}
      </div>

      {/* Concepto: campo libre para que el cliente escriba su propia referencia */}
      <div className="mt-6 space-y-2">
        <Label htmlFor="concept" className="text-white/80">
          Concepto
        </Label>
        <div className="flex items-center gap-2">
          <Input
            id="concept"
            value={concept}
            onChange={(e) => setConcept(e.target.value)}
            placeholder="Escribe tu referencia"
            className="bg-background/50 border-border/80 focus-visible:ring-primary/50"
          />
          <button
            type="button"
            onClick={() => copy(concept, "concept")}
            className="shrink-0 text-muted-foreground hover:text-primary transition-colors"
            aria-label="Copiar concepto"
          >
            {copied === "concept" ? (
              <CheckCircle2 className="w-4 h-4 text-primary" />
            ) : (
              <Copy className="w-4 h-4" />
            )}
          </button>
        </div>
        <p className="text-xs text-muted-foreground">
          Indica la referencia que prefieras para identificar tu pago.
        </p>
      </div>
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Página principal                                                          */
/* -------------------------------------------------------------------------- */
export default function Checkout() {
  return (
    <main className="min-h-screen bg-background text-foreground font-sans py-20 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="mb-10 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white">
            Realizar un pago
          </h1>
        </div>

        <TransferFlow />
      </div>
    </main>
  );
}

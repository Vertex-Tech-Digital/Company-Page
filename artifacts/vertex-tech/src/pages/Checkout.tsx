import { useState } from "react";
import { loadStripe } from "@stripe/stripe-js";
import {
  Elements,
  PaymentElement,
  useStripe,
  useElements,
} from "@stripe/react-stripe-js";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  CheckCircle2,
  Loader2,
  CreditCard,
  Building2,
  Copy,
  ShieldCheck,
} from "lucide-react";

/* -------------------------------------------------------------------------- */
/*  DATOS BANCARIOS OFICIALES (BBVA)                                           */
/* -------------------------------------------------------------------------- */
const BANK_DETAILS = {
  beneficiary: "***REMOVED***",
  bank: "Banco Bilbao Vizcaya Argentaria, S.A. (BBVA)",
  iban: "***REMOVED***",
  bic: "***REMOVED***",
  concept: "Indique su nombre / empresa",
};

const stripePromise = loadStripe(
  import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY as string,
);

/* -------------------------------------------------------------------------- */
/*  Formulario de pago con tarjeta (Payment Element)                          */
/* -------------------------------------------------------------------------- */
function CardPaymentForm({ amount }: { amount: number }) {
  const stripe = useStripe();
  const elements = useElements();
  const [isPaying, setIsPaying] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [paid, setPaid] = useState(false);

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!stripe || !elements) return;

    setIsPaying(true);
    setError(null);

    const { error: submitError } = await stripe.confirmPayment({
      elements,
      confirmParams: {
        // Necesario por si el método de pago requiere redirección.
        // Con tarjeta el cobro se resuelve sin salir de la página.
        return_url: window.location.href,
      },
      redirect: "if_required",
    });

    if (submitError) {
      setError(submitError.message ?? "No se pudo completar el pago.");
      setIsPaying(false);
      return;
    }

    setPaid(true);
    setIsPaying(false);
  }

  if (paid) {
    return (
      <div className="flex flex-col items-center justify-center text-center py-10">
        <CheckCircle2 className="w-14 h-14 text-primary mb-5" />
        <h3 className="text-xl font-bold text-white mb-2">Pago completado</h3>
        <p className="text-muted-foreground text-sm">
          Gracias. Recibirás la factura por correo electrónico en breve.
        </p>
      </div>
    );
  }

  return (
    <form onSubmit={handlePay} className="space-y-6">
      <PaymentElement />
      {error && <p className="text-sm text-destructive">{error}</p>}
      <Button
        type="submit"
        disabled={!stripe || isPaying}
        className="w-full bg-primary text-white hover:bg-primary/90 h-12 text-md shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
      >
        {isPaying ? (
          <>
            <Loader2 className="w-4 h-4 mr-2 animate-spin" />
            Procesando…
          </>
        ) : (
          `Pagar ${amount.toFixed(2)} €`
        )}
      </Button>
    </form>
  );
}

/* -------------------------------------------------------------------------- */
/*  Bloque de transferencia bancaria (Plan B)                                 */
/* -------------------------------------------------------------------------- */
function BankTransferBlock() {
  const [copied, setCopied] = useState<string | null>(null);

  function copy(value: string, key: string) {
    navigator.clipboard?.writeText(value).then(() => {
      setCopied(key);
      setTimeout(() => setCopied(null), 1500);
    });
  }

  const rows: { label: string; value: string; key: string }[] = [
    { label: "Beneficiario", value: BANK_DETAILS.beneficiary, key: "beneficiary" },
    { label: "Banco", value: BANK_DETAILS.bank, key: "bank" },
    { label: "IBAN", value: BANK_DETAILS.iban, key: "iban" },
    { label: "BIC / SWIFT", value: BANK_DETAILS.bic, key: "bic" },
    { label: "Concepto", value: BANK_DETAILS.concept, key: "concept" },
  ];

  return (
    <div className="bg-card/50 backdrop-blur-md border border-border p-8 rounded-2xl shadow-xl h-full">
      <div className="flex items-center gap-3 mb-2">
        <Building2 className="w-5 h-5 text-primary" />
        <h2 className="text-lg font-bold text-white">Transferencia bancaria</h2>
      </div>
      <p className="text-sm text-muted-foreground mb-6">
        Si prefieres el pago tradicional, realiza una transferencia con los
        siguientes datos. Te enviaremos la factura una vez confirmado el ingreso.
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
    </div>
  );
}

/* -------------------------------------------------------------------------- */
/*  Página principal                                                          */
/* -------------------------------------------------------------------------- */
export default function Checkout() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [amount, setAmount] = useState("");
  const [clientSecret, setClientSecret] = useState<string | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const amountNum = Number(amount);

  async function startPayment(e: React.FormEvent) {
    e.preventDefault();
    setError(null);

    if (name.trim().length < 2) {
      setError("Introduce tu nombre completo.");
      return;
    }
    if (!email.includes("@")) {
      setError("Introduce un email válido.");
      return;
    }
    if (!Number.isFinite(amountNum) || amountNum <= 0) {
      setError("Introduce un importe válido.");
      return;
    }

    setIsCreating(true);
    try {
      const res = await fetch(
        `${import.meta.env.BASE_URL}api/create-payment-intent`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, email, amount: amountNum }),
        },
      );
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "No se pudo iniciar el pago.");
      }
      setClientSecret(data.clientSecret);
    } catch (err) {
      setError(err instanceof Error ? err.message : "No se pudo iniciar el pago.");
    } finally {
      setIsCreating(false);
    }
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-sans py-20 px-6">
      <div className="max-w-5xl mx-auto">
        <div className="mb-12 text-center">
          <h1 className="text-3xl md:text-4xl font-bold text-white mb-3">
            Realizar un pago
          </h1>
          <p className="text-muted-foreground flex items-center justify-center gap-2 text-sm">
            <ShieldCheck className="w-4 h-4 text-primary" />
            Pago seguro procesado por Stripe
          </p>
        </div>

        <div className="grid lg:grid-cols-2 gap-8 items-start">
          {/* --- Columna tarjeta --- */}
          <div className="bg-card/50 backdrop-blur-md border border-border p-8 rounded-2xl shadow-xl">
            <div className="flex items-center gap-3 mb-6">
              <CreditCard className="w-5 h-5 text-primary" />
              <h2 className="text-lg font-bold text-white">Pago con tarjeta</h2>
            </div>

            {!clientSecret ? (
              <form onSubmit={startPayment} className="space-y-5">
                <div className="space-y-2">
                  <Label htmlFor="name" className="text-white/80">
                    Nombre completo
                  </Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="Nombre y apellidos"
                    className="bg-background/50 border-border/80 focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="email" className="text-white/80">
                    Correo electrónico
                  </Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="tu@email.com"
                    className="bg-background/50 border-border/80 focus-visible:ring-primary/50"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="amount" className="text-white/80">
                    Importe (€)
                  </Label>
                  <Input
                    id="amount"
                    type="number"
                    min="1"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0,00"
                    className="bg-background/50 border-border/80 focus-visible:ring-primary/50"
                  />
                </div>

                {error && <p className="text-sm text-destructive">{error}</p>}

                <Button
                  type="submit"
                  disabled={isCreating}
                  className="w-full bg-primary text-white hover:bg-primary/90 h-12 text-md shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
                >
                  {isCreating ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Preparando pago…
                    </>
                  ) : (
                    "Continuar al pago"
                  )}
                </Button>
              </form>
            ) : (
              <Elements
                stripe={stripePromise}
                options={{
                  clientSecret,
                  appearance: {
                    theme: "night",
                    variables: { colorPrimary: "#3b82f6" },
                  },
                }}
              >
                <CardPaymentForm amount={amountNum} />
              </Elements>
            )}
          </div>

          {/* --- Columna transferencia --- */}
          <BankTransferBlock />
        </div>
      </div>
    </main>
  );
}

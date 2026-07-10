import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Trash2, FileText, Download } from "lucide-react";

/*
 * TODO(AUTH): esta página NO está protegida todavía. Cuando el login del
 * Entregable B esté listo, envolver la ruta /admin/facturas con el guard de
 * autenticación (solo backoffice interno de Vertex).
 */

// Serverless function servida en el mismo origen (dev: dev-api-plugin; prod: Vercel).
const INVOICES_ENDPOINT = `${import.meta.env.BASE_URL}api/invoices/create`;

type LineItem = { description: string; quantity: number; unitPrice: number };
interface CreateInvoiceResponse {
  invoiceNumber: string;
  status: string;
  issueDate: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  pdfBase64?: string;
}

const emptyItem: LineItem = { description: "", quantity: 1, unitPrice: 0 };

function downloadPdf(base64: string, invoiceNumber: string) {
  const bytes = Uint8Array.from(atob(base64), (c) => c.charCodeAt(0));
  const blob = new Blob([bytes], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Factura-${invoiceNumber}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

export default function InvoiceForm() {
  const { toast } = useToast();

  const [legalName, setLegalName] = useState("");
  const [nif, setNif] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }]);
  const [taxRate, setTaxRate] = useState(21);
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [lastInvoice, setLastInvoice] = useState<CreateInvoiceResponse | null>(null);

  const subtotal = items.reduce((acc, it) => acc + it.quantity * it.unitPrice, 0);
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) => prev.map((it, i) => (i === index ? { ...it, ...patch } : it)));
  }
  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }
  function removeItem(index: number) {
    setItems((prev) => (prev.length === 1 ? prev : prev.filter((_, i) => i !== index)));
  }

  const mutation = useMutation({
    mutationFn: async (): Promise<CreateInvoiceResponse> => {
      const res = await fetch(INVOICES_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { legalName, nif, email, address },
          items,
          taxRate,
          language,
          dueDate: dueDate || undefined,
          notes: notes || undefined,
        }),
      });
      const data = await res.json().catch(() => ({}));
      if (!res.ok) {
        throw new Error(data.error || "No se pudo generar la factura.");
      }
      return data as CreateInvoiceResponse;
    },
    onSuccess: (data) => {
      setLastInvoice(data);
      toast({
        title: `Factura ${data.invoiceNumber} enviada`,
        description: `Enviada a ${email} (con copia interna). Total ${total.toFixed(2)} €.`,
      });
    },
    onError: (err) => {
      toast({
        variant: "destructive",
        title: "Error al generar la factura",
        description: err instanceof Error ? err.message : "Inténtalo de nuevo.",
      });
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (legalName.trim().length < 2) return toastError("Introduce la razón social del cliente.");
    if (nif.trim().length < 1) return toastError("Introduce el NIF/CIF del cliente.");
    if (!email.includes("@")) return toastError("Introduce un email de facturación válido.");
    if (address.trim().length < 1) return toastError("Introduce la dirección del cliente.");
    if (items.some((it) => it.description.trim().length < 1))
      return toastError("Cada línea necesita una descripción.");
    if (items.some((it) => it.quantity <= 0))
      return toastError("Las cantidades deben ser mayores que 0.");
    mutation.mutate();
  }

  function toastError(message: string) {
    toast({ variant: "destructive", title: "Datos incompletos", description: message });
  }

  return (
    <main className="min-h-screen bg-background text-foreground font-sans py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <div className="flex items-center gap-3 mb-2">
          <FileText className="w-6 h-6 text-primary" />
          <h1 className="text-2xl md:text-3xl font-bold text-white">Emitir factura</h1>
        </div>
        <p className="text-sm text-muted-foreground mb-8">
          Panel interno de facturación · Vertex Tech
        </p>

        <form onSubmit={handleSubmit} className="space-y-8">
          {/* Cliente */}
          <section className="bg-card/50 backdrop-blur-md border border-border p-6 rounded-2xl">
            <h2 className="text-lg font-bold text-white mb-4">Datos del cliente</h2>
            <div className="grid sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="legalName" className="text-white/80">Razón social</Label>
                <Input id="legalName" value={legalName} onChange={(e) => setLegalName(e.target.value)} className="bg-background/50 border-border/80" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="nif" className="text-white/80">NIF / CIF</Label>
                <Input id="nif" value={nif} onChange={(e) => setNif(e.target.value)} className="bg-background/50 border-border/80" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="email" className="text-white/80">Email de facturación</Label>
                <Input id="email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} className="bg-background/50 border-border/80" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="address" className="text-white/80">Dirección</Label>
                <Input id="address" value={address} onChange={(e) => setAddress(e.target.value)} className="bg-background/50 border-border/80" />
              </div>
            </div>
          </section>

          {/* Líneas */}
          <section className="bg-card/50 backdrop-blur-md border border-border p-6 rounded-2xl">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-white">Conceptos</h2>
              <Button type="button" variant="outline" size="sm" onClick={addItem} className="gap-1">
                <Plus className="w-4 h-4" /> Añadir línea
              </Button>
            </div>
            <div className="space-y-3">
              {items.map((item, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 items-end">
                  <div className="col-span-6 space-y-1">
                    {i === 0 && <Label className="text-xs text-muted-foreground">Descripción</Label>}
                    <Input value={item.description} onChange={(e) => updateItem(i, { description: e.target.value })} placeholder="Concepto" className="bg-background/50 border-border/80" />
                  </div>
                  <div className="col-span-2 space-y-1">
                    {i === 0 && <Label className="text-xs text-muted-foreground">Cant.</Label>}
                    <Input type="number" min="0" step="1" value={item.quantity} onChange={(e) => updateItem(i, { quantity: Number(e.target.value) })} className="bg-background/50 border-border/80" />
                  </div>
                  <div className="col-span-3 space-y-1">
                    {i === 0 && <Label className="text-xs text-muted-foreground">Precio unit. (€)</Label>}
                    <Input type="number" min="0" step="0.01" value={item.unitPrice} onChange={(e) => updateItem(i, { unitPrice: Number(e.target.value) })} className="bg-background/50 border-border/80" />
                  </div>
                  <div className="col-span-1 flex justify-center pb-1">
                    <button type="button" onClick={() => removeItem(i)} className="text-muted-foreground hover:text-destructive transition-colors" aria-label="Eliminar línea">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* Opciones + totales */}
          <section className="bg-card/50 backdrop-blur-md border border-border p-6 rounded-2xl space-y-5">
            <div className="grid sm:grid-cols-3 gap-4">
              <div className="space-y-2">
                <Label htmlFor="taxRate" className="text-white/80">IVA (%)</Label>
                <Input id="taxRate" type="number" min="0" max="100" step="1" value={taxRate} onChange={(e) => setTaxRate(Number(e.target.value))} className="bg-background/50 border-border/80" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="dueDate" className="text-white/80">Vencimiento</Label>
                <Input id="dueDate" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="bg-background/50 border-border/80" />
              </div>
              <div className="space-y-2">
                <Label className="text-white/80">Idioma factura</Label>
                <div className="flex gap-2">
                  {(["es", "en"] as const).map((lng) => (
                    <Button key={lng} type="button" variant={language === lng ? "default" : "outline"} size="sm" onClick={() => setLanguage(lng)} className="flex-1 uppercase">
                      {lng}
                    </Button>
                  ))}
                </div>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes" className="text-white/80">Notas (opcional)</Label>
              <Textarea id="notes" value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Condiciones de pago, referencia de proyecto…" className="bg-background/50 border-border/80" />
            </div>

            <div className="border-t border-border/60 pt-4 space-y-1 text-sm">
              <div className="flex justify-between text-muted-foreground">
                <span>Base imponible</span><span>{subtotal.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-muted-foreground">
                <span>IVA ({taxRate}%)</span><span>{taxAmount.toFixed(2)} €</span>
              </div>
              <div className="flex justify-between text-white font-bold text-base pt-1">
                <span>Total</span><span className="text-primary">{total.toFixed(2)} €</span>
              </div>
            </div>
          </section>

          <Button type="submit" disabled={mutation.isPending} className="w-full h-12 bg-primary text-white hover:bg-primary/90 text-md shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]">
            {mutation.isPending ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando y enviando…</>
            ) : (
              "Generar y enviar factura"
            )}
          </Button>
        </form>

        {lastInvoice?.pdfBase64 && (
          <div className="mt-6 flex items-center justify-between bg-card/50 border border-border p-4 rounded-xl">
            <span className="text-sm text-white">
              Factura <b>{lastInvoice.invoiceNumber}</b> generada.
            </span>
            <Button type="button" variant="outline" size="sm" className="gap-1" onClick={() => downloadPdf(lastInvoice.pdfBase64!, lastInvoice.invoiceNumber)}>
              <Download className="w-4 h-4" /> Descargar PDF
            </Button>
          </div>
        )}
      </div>
    </main>
  );
}

import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import {
  Loader2,
  Plus,
  Trash2,
  Download,
  Calendar as CalendarIcon,
  RefreshCw,
} from "lucide-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Calendar } from "@/components/ui/calendar";

// Serverless functions servidas en el mismo origen (dev: dev-api-plugin; prod: Vercel).
// Protegidas con JWT: se envía el token del panel en el header Authorization.
const CREATE_ENDPOINT = `${import.meta.env.BASE_URL}api/invoices/create`;
const LIST_ENDPOINT = `${import.meta.env.BASE_URL}api/admin-invoices`;

type LineItem = { description: string; quantity: number; unitPrice: number };
interface CreateInvoiceResponse {
  id: number;
  invoiceNumber: string;
  status: string;
  issueDate: string;
  subtotal: number;
  taxAmount: number;
  total: number;
  emailSent?: boolean;
  pdfError?: boolean;
}
interface InvoiceRow {
  id: number;
  invoice_number: string;
  client_legal_name: string;
  client_nif: string;
  issue_date: string;
  due_date: string | null;
  total: string;
  status: string;
}

const emptyItem: LineItem = { description: "", quantity: 1, unitPrice: 0 };

// Descarga el PDF desde la ruta autenticada, que ahora lo devuelve como
// application/pdf binario (antes venía en base64 dentro de un JSON).
async function downloadInvoicePdf(
  id: number,
  invoiceNumber: string,
  token: string,
) {
  const res = await fetch(`${LIST_ENDPOINT}?id=${id}&pdf=1`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok) {
    // Los errores del endpoint siguen viniendo en JSON.
    const d = await res.json().catch(() => ({}));
    throw new Error(d.error || "No se pudo generar el PDF.");
  }

  const blob = await res.blob();
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `Factura-${invoiceNumber}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

// "aaaa-mm-dd" -> "dd/mm/aaaa" para mostrar en el listado.
function isoToEs(iso: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})/.exec(iso || "");
  return m ? `${m[3]}/${m[2]}/${m[1]}` : iso;
}

export function AdminInvoices({ token }: { token: string }) {
  const [tab, setTab] = useState<"emit" | "list">("emit");

  return (
    <div>
      <div className="mb-6 flex items-center gap-2">
        <Button
          type="button"
          variant={tab === "emit" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("emit")}
        >
          Emitir
        </Button>
        <Button
          type="button"
          variant={tab === "list" ? "default" : "outline"}
          size="sm"
          onClick={() => setTab("list")}
        >
          Emitidas
        </Button>
      </div>

      {tab === "emit" ? (
        <InvoiceForm token={token} />
      ) : (
        <InvoicesList token={token} />
      )}
    </div>
  );
}

function InvoiceForm({ token }: { token: string }) {
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const [legalName, setLegalName] = useState("");
  const [nif, setNif] = useState("");
  const [email, setEmail] = useState("");
  const [address, setAddress] = useState("");
  const [items, setItems] = useState<LineItem[]>([{ ...emptyItem }]);
  // IGIC 7% por defecto (Canarias). Editable por si aplica otro tipo de IGIC.
  const [taxRate, setTaxRate] = useState(7);
  const [language, setLanguage] = useState<"es" | "en">("es");
  const [dueDate, setDueDate] = useState<Date | undefined>(undefined);
  const [notes, setNotes] = useState("");
  const [lastInvoice, setLastInvoice] = useState<CreateInvoiceResponse | null>(
    null,
  );

  const subtotal = items.reduce(
    (acc, it) => acc + it.quantity * it.unitPrice,
    0,
  );
  const taxAmount = subtotal * (taxRate / 100);
  const total = subtotal + taxAmount;

  function updateItem(index: number, patch: Partial<LineItem>) {
    setItems((prev) =>
      prev.map((it, i) => (i === index ? { ...it, ...patch } : it)),
    );
  }
  function addItem() {
    setItems((prev) => [...prev, { ...emptyItem }]);
  }
  function removeItem(index: number) {
    setItems((prev) =>
      prev.length === 1 ? prev : prev.filter((_, i) => i !== index),
    );
  }

  const mutation = useMutation({
    mutationFn: async (
      dueDateIso: string | undefined,
    ): Promise<CreateInvoiceResponse> => {
      const res = await fetch(CREATE_ENDPOINT, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          client: { legalName, nif, email, address },
          items,
          taxRate,
          language,
          dueDate: dueDateIso,
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
      queryClient.invalidateQueries({ queryKey: ["admin-invoices"] });
      if (data.emailSent === false) {
        toast({
          variant: "destructive",
          title: `Factura ${data.invoiceNumber} guardada`,
          description:
            "Se guardó, pero el email no se pudo enviar. Descárgala desde 'Emitidas' y reenvíala.",
        });
      } else {
        toast({
          title: `Factura ${data.invoiceNumber} enviada`,
          description: `Enviada a ${email} (con copia interna). Total ${total.toFixed(2)} €.`,
        });
      }
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
    if (legalName.trim().length < 2)
      return toastError("Introduce la razón social del cliente.");
    if (nif.trim().length < 1)
      return toastError("Introduce el NIF/CIF del cliente.");
    if (!email.includes("@"))
      return toastError("Introduce un email de facturación válido.");
    if (address.trim().length < 1)
      return toastError("Introduce la dirección del cliente.");
    if (items.some((it) => it.description.trim().length < 1))
      return toastError("Cada línea necesita una descripción.");
    if (items.some((it) => it.quantity <= 0))
      return toastError("Las cantidades deben ser mayores que 0.");

    // Fecha de vencimiento (opcional): el calendario garantiza una fecha válida.
    const dueDateIso = dueDate ? format(dueDate, "yyyy-MM-dd") : undefined;
    mutation.mutate(dueDateIso);
  }

  function toastError(message: string) {
    toast({
      variant: "destructive",
      title: "Datos incompletos",
      description: message,
    });
  }

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-xl font-bold text-white">Emitir factura</h2>
        <p className="text-sm text-muted-foreground">
          Rellena los datos del cliente, genera el PDF y se envía por email (con
          copia interna).
        </p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-8">
        {/* Cliente */}
        <section className="bg-card/50 backdrop-blur-md border border-border p-6 rounded-2xl">
          <h3 className="text-base font-bold text-white mb-4">
            Datos del cliente
          </h3>
          <div className="grid sm:grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="legalName" className="text-white/80">
                Razón social
              </Label>
              <Input
                id="legalName"
                value={legalName}
                onChange={(e) => setLegalName(e.target.value)}
                className="bg-background/50 border-border/80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="nif" className="text-white/80">
                NIF / CIF
              </Label>
              <Input
                id="nif"
                value={nif}
                onChange={(e) => setNif(e.target.value)}
                className="bg-background/50 border-border/80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email" className="text-white/80">
                Email de facturación
              </Label>
              <Input
                id="email"
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="bg-background/50 border-border/80"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="address" className="text-white/80">
                Dirección
              </Label>
              <Input
                id="address"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                className="bg-background/50 border-border/80"
              />
            </div>
          </div>
        </section>

        {/* Líneas */}
        <section className="bg-card/50 backdrop-blur-md border border-border p-6 rounded-2xl">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-base font-bold text-white">Conceptos</h3>
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={addItem}
              className="gap-1"
            >
              <Plus className="w-4 h-4" /> Añadir línea
            </Button>
          </div>
          <div className="space-y-3">
            {items.map((item, i) => (
              <div key={i} className="grid grid-cols-12 gap-2 items-end">
                <div className="col-span-6 space-y-1">
                  {i === 0 && (
                    <Label className="text-xs text-muted-foreground">
                      Descripción
                    </Label>
                  )}
                  <Input
                    value={item.description}
                    onChange={(e) =>
                      updateItem(i, { description: e.target.value })
                    }
                    placeholder="Concepto"
                    className="bg-background/50 border-border/80"
                  />
                </div>
                <div className="col-span-2 space-y-1">
                  {i === 0 && (
                    <Label className="text-xs text-muted-foreground">
                      Cant.
                    </Label>
                  )}
                  <Input
                    type="number"
                    min="0"
                    step="1"
                    value={item.quantity}
                    onChange={(e) =>
                      updateItem(i, { quantity: Number(e.target.value) })
                    }
                    className="bg-background/50 border-border/80"
                  />
                </div>
                <div className="col-span-3 space-y-1">
                  {i === 0 && (
                    <Label className="text-xs text-muted-foreground">
                      Precio unit. (€)
                    </Label>
                  )}
                  <Input
                    type="number"
                    min="0"
                    step="0.01"
                    value={item.unitPrice}
                    onChange={(e) =>
                      updateItem(i, { unitPrice: Number(e.target.value) })
                    }
                    className="bg-background/50 border-border/80"
                  />
                </div>
                <div className="col-span-1 flex justify-center pb-1">
                  <button
                    type="button"
                    onClick={() => removeItem(i)}
                    className="text-muted-foreground hover:text-destructive transition-colors"
                    aria-label="Eliminar línea"
                  >
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
              <Label htmlFor="taxRate" className="text-white/80">
                IGIC (%)
              </Label>
              <Input
                id="taxRate"
                type="number"
                min="0"
                max="100"
                step="0.5"
                value={taxRate}
                onChange={(e) => setTaxRate(Number(e.target.value))}
                className="bg-background/50 border-border/80"
              />
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Vencimiento</Label>
              <Popover>
                <PopoverTrigger asChild>
                  <Button
                    type="button"
                    variant="outline"
                    className="w-full justify-start gap-2 bg-background/50 border-border/80 font-normal"
                  >
                    <CalendarIcon className="w-4 h-4 shrink-0" />
                    {dueDate ? (
                      format(dueDate, "dd/MM/yyyy", { locale: es })
                    ) : (
                      <span className="text-muted-foreground">dd/mm/aaaa</span>
                    )}
                  </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="start">
                  <Calendar
                    mode="single"
                    selected={dueDate}
                    onSelect={setDueDate}
                    locale={es}
                    autoFocus
                  />
                </PopoverContent>
              </Popover>
            </div>
            <div className="space-y-2">
              <Label className="text-white/80">Idioma factura</Label>
              <div className="flex gap-2">
                {(["es", "en"] as const).map((lng) => (
                  <Button
                    key={lng}
                    type="button"
                    variant={language === lng ? "default" : "outline"}
                    size="sm"
                    onClick={() => setLanguage(lng)}
                    className="flex-1 uppercase"
                  >
                    {lng}
                  </Button>
                ))}
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="notes" className="text-white/80">
              Notas (opcional)
            </Label>
            <Textarea
              id="notes"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Condiciones de pago, referencia de proyecto…"
              className="bg-background/50 border-border/80"
            />
          </div>

          <div className="border-t border-border/60 pt-4 space-y-1 text-sm">
            <div className="flex justify-between text-muted-foreground">
              <span>Base imponible</span>
              <span>{subtotal.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-muted-foreground">
              <span>IGIC ({taxRate}%)</span>
              <span>{taxAmount.toFixed(2)} €</span>
            </div>
            <div className="flex justify-between text-white font-bold text-base pt-1">
              <span>Total</span>
              <span className="text-primary">{total.toFixed(2)} €</span>
            </div>
          </div>
        </section>

        <Button
          type="submit"
          disabled={mutation.isPending}
          className="w-full h-12 bg-primary text-white hover:bg-primary/90 text-md shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.5)]"
        >
          {mutation.isPending ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" /> Generando y
              enviando…
            </>
          ) : (
            "Generar y enviar factura"
          )}
        </Button>
      </form>

      {lastInvoice && !lastInvoice.pdfError && (
        <div className="mt-6 flex items-center justify-between bg-card/50 border border-border p-4 rounded-xl">
          <span className="text-sm text-white">
            Factura <b>{lastInvoice.invoiceNumber}</b> generada.
          </span>
          <Button
            type="button"
            variant="outline"
            size="sm"
            className="gap-1"
            onClick={async () => {
              try {
                await downloadInvoicePdf(
                  lastInvoice.id,
                  lastInvoice.invoiceNumber,
                  token,
                );
              } catch (e) {
                toast({
                  variant: "destructive",
                  title: "Error",
                  description:
                    e instanceof Error
                      ? e.message
                      : "No se pudo descargar el PDF.",
                });
              }
            }}
          >
            <Download className="w-4 h-4" /> Descargar PDF
          </Button>
        </div>
      )}
    </div>
  );
}

function InvoicesList({ token }: { token: string }) {
  const { toast } = useToast();
  const [downloadingId, setDownloadingId] = useState<number | null>(null);

  const { data, isLoading, isError, refetch, isFetching } = useQuery({
    queryKey: ["admin-invoices"],
    queryFn: async (): Promise<InvoiceRow[]> => {
      const res = await fetch(LIST_ENDPOINT, {
        headers: { Authorization: `Bearer ${token}` },
      });
      const d = await res.json().catch(() => ({}));
      if (!res.ok)
        throw new Error(d.error || "No se pudieron cargar las facturas.");
      return (d.invoices ?? []) as InvoiceRow[];
    },
  });

  async function download(id: number, invoiceNumber: string) {
    setDownloadingId(id);
    try {
      await downloadInvoicePdf(id, invoiceNumber, token);
    } catch (e) {
      toast({
        variant: "destructive",
        title: "Error",
        description:
          e instanceof Error ? e.message : "No se pudo descargar el PDF.",
      });
    } finally {
      setDownloadingId(null);
    }
  }

  const invoices = data ?? [];

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold text-white">Facturas emitidas</h2>
          <p className="text-sm text-muted-foreground">
            Histórico de facturas. El PDF se regenera al descargar.
          </p>
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          className="gap-1"
          onClick={() => refetch()}
          disabled={isFetching}
        >
          <RefreshCw
            className={`w-3.5 h-3.5 ${isFetching ? "animate-spin" : ""}`}
          />{" "}
          Recargar
        </Button>
      </div>

      {isLoading ? (
        <p className="text-sm text-muted-foreground">Cargando facturas…</p>
      ) : isError ? (
        <p className="text-sm text-destructive">
          Error al cargar las facturas.
        </p>
      ) : invoices.length === 0 ? (
        <p className="text-sm text-muted-foreground">
          No hay facturas emitidas todavía.
        </p>
      ) : (
        <div className="bg-card/50 border border-border rounded-2xl overflow-hidden">
          <table className="w-full text-sm">
            <thead className="text-xs text-muted-foreground border-b border-border">
              <tr>
                <th className="text-left font-medium px-4 py-3">Número</th>
                <th className="text-left font-medium px-4 py-3">Cliente</th>
                <th className="text-left font-medium px-4 py-3">Fecha</th>
                <th className="text-right font-medium px-4 py-3">Total</th>
                <th className="px-4 py-3"></th>
              </tr>
            </thead>
            <tbody>
              {invoices.map((inv) => (
                <tr
                  key={inv.id}
                  className="border-b border-border/50 last:border-0"
                >
                  <td className="px-4 py-3 font-medium text-white">
                    {inv.invoice_number}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {inv.client_legal_name}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {isoToEs(inv.issue_date)}
                  </td>
                  <td className="px-4 py-3 text-right text-white">
                    {Number(inv.total).toFixed(2)} €
                  </td>
                  <td className="px-4 py-3 text-right">
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      className="gap-1"
                      disabled={downloadingId === inv.id}
                      onClick={() => download(inv.id, inv.invoice_number)}
                    >
                      {downloadingId === inv.id ? (
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      ) : (
                        <Download className="w-3.5 h-3.5" />
                      )}{" "}
                      PDF
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

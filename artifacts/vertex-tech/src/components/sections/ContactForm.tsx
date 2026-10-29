import { useState } from "react";
import { m } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { CheckCircle2, Loader2 } from "lucide-react";
import { useLanguage } from "@/context/LanguageContext";

// Export por defecto porque Contact lo carga con lazy() en su propio chunk
// (VTD-37).
export default function ContactForm() {
  const { t } = useLanguage();
  const [isSuccess, setIsSuccess] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [serverError, setServerError] = useState<string | null>(null);

  const formSchema = z.object({
    name: z.string().min(2, t("contact.error.name")),
    email: z.string().email(t("contact.error.email")),
    company: z.string().optional(),
    message: z.string().min(10, t("contact.error.message")),
  });

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: { name: "", email: "", company: "", message: "" },
  });

  async function onSubmit(values: z.infer<typeof formSchema>) {
    setIsSubmitting(true);
    setServerError(null);
    try {
      const res = await fetch(`${import.meta.env.BASE_URL}api/contact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(values),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data.error || t("contact.error.server"));
      }
      setIsSuccess(true);
    } catch (err) {
      setServerError(
        err instanceof Error ? err.message : t("contact.error.server"),
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  if (isSuccess) {
    return (
      <m.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        className="h-full flex flex-col items-center justify-center text-center py-12"
        role="status"
        aria-live="polite"
        data-testid="contact-success"
      >
        <CheckCircle2
          className="w-16 h-16 text-primary mb-6"
          aria-hidden="true"
        />
        <h3 className="text-2xl font-bold text-white mb-2 tracking-tight">
          {t("contact.success.title")}
        </h3>
        <p className="text-slate-300">{t("contact.success.desc")}</p>
        <Button
          variant="outline"
          className="mt-8 border-white/15 bg-white/5 hover:bg-white/10 text-white rounded-xl"
          onClick={() => {
            setIsSuccess(false);
            form.reset();
          }}
        >
          {t("contact.success.another")}
        </Button>
      </m.div>
    );
  }

  return (
    <Form {...form}>
      <form
        onSubmit={form.handleSubmit(onSubmit)}
        className="space-y-6"
        data-testid="contact-form"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="name"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200 text-sm font-medium">
                  {t("contact.label.name")}
                  <span className="text-primary ml-1" aria-hidden="true">
                    *
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    placeholder={t("contact.placeholder.name")}
                    autoComplete="name"
                    aria-required="true"
                    className="bg-slate-950/60 border-white/15 text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary transition-colors"
                    data-testid="input-name"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-destructive text-xs" />
              </FormItem>
            )}
          />
          <FormField
            control={form.control}
            name="email"
            render={({ field }) => (
              <FormItem>
                <FormLabel className="text-slate-200 text-sm font-medium">
                  {t("contact.label.email")}
                  <span className="text-primary ml-1" aria-hidden="true">
                    *
                  </span>
                </FormLabel>
                <FormControl>
                  <Input
                    type="email"
                    placeholder="tu@email.com"
                    autoComplete="email"
                    aria-required="true"
                    className="bg-slate-950/60 border-white/15 text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary transition-colors"
                    data-testid="input-email"
                    {...field}
                  />
                </FormControl>
                <FormMessage className="text-destructive text-xs" />
              </FormItem>
            )}
          />
        </div>
        <FormField
          control={form.control}
          name="company"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200 text-sm font-medium">
                {t("contact.label.company")}
              </FormLabel>
              <FormControl>
                <Input
                  placeholder={t("contact.placeholder.company")}
                  autoComplete="organization"
                  className="bg-slate-950/60 border-white/15 text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary transition-colors"
                  data-testid="input-company"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-destructive text-xs" />
            </FormItem>
          )}
        />
        <FormField
          control={form.control}
          name="message"
          render={({ field }) => (
            <FormItem>
              <FormLabel className="text-slate-200 text-sm font-medium">
                {t("contact.label.message")}
                <span className="text-primary ml-1" aria-hidden="true">
                  *
                </span>
              </FormLabel>
              <FormControl>
                <Textarea
                  placeholder={t("contact.placeholder.message")}
                  aria-required="true"
                  className="bg-slate-950/60 border-white/15 text-white placeholder:text-slate-500 rounded-xl focus-visible:ring-primary/40 focus-visible:border-primary min-h-[120px] resize-none transition-colors"
                  data-testid="input-message"
                  {...field}
                />
              </FormControl>
              <FormMessage className="text-destructive text-xs" />
            </FormItem>
          )}
        />
        {serverError && (
          <div
            role="alert"
            aria-live="assertive"
            className="text-sm text-destructive font-medium"
          >
            {serverError}
          </div>
        )}
        <Button
          type="submit"
          disabled={isSubmitting}
          className="w-full bg-primary-solid text-white hover:bg-primary-solid-hover shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] h-12 text-md rounded-xl font-medium"
          data-testid="contact-submit"
        >
          {isSubmitting ? (
            <>
              <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              {t("contact.submitting")}
            </>
          ) : (
            t("contact.submit")
          )}
        </Button>
      </form>
    </Form>
  );
}

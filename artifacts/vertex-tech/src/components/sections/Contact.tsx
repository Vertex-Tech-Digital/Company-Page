import { useState } from "react";
import { motion } from "framer-motion";
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

export function Contact() {
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

  return (
    <section id="contacto" className="py-24 relative z-10 overflow-hidden">
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none" />

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2
              className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight"
              data-testid="contact-title"
            >
              {t("contact.title")}{" "}
              <span className="text-primary">
                {t("contact.titleHighlight")}
              </span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              {t("contact.subtitle")}
            </p>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, x: 30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
            className="bg-card/50 backdrop-blur-md border border-border p-8 rounded-2xl shadow-xl"
          >
            {isSuccess ? (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="h-full flex flex-col items-center justify-center text-center py-12"
                data-testid="contact-success"
              >
                <CheckCircle2 className="w-16 h-16 text-primary mb-6" />
                <h3 className="text-2xl font-bold text-white mb-2">
                  {t("contact.success.title")}
                </h3>
                <p className="text-muted-foreground">
                  {t("contact.success.desc")}
                </p>
                <Button
                  variant="outline"
                  className="mt-8 border-border"
                  onClick={() => {
                    setIsSuccess(false);
                    form.reset();
                  }}
                >
                  {t("contact.success.another")}
                </Button>
              </motion.div>
            ) : (
              <Form {...form}>
                <form
                  onSubmit={form.handleSubmit(onSubmit)}
                  className="space-y-6"
                  data-testid="contact-form"
                >
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">
                            {t("contact.label.name")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder={t("contact.placeholder.name")}
                              className="bg-background/50 border-border/80 focus-visible:ring-primary/50"
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
                          <FormLabel className="text-white/80">
                            {t("contact.label.email")}
                          </FormLabel>
                          <FormControl>
                            <Input
                              placeholder="tu@email.com"
                              className="bg-background/50 border-border/80 focus-visible:ring-primary/50"
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
                        <FormLabel className="text-white/80">
                          {t("contact.label.company")}
                        </FormLabel>
                        <FormControl>
                          <Input
                            placeholder={t("contact.placeholder.company")}
                            className="bg-background/50 border-border/80 focus-visible:ring-primary/50"
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
                        <FormLabel className="text-white/80">
                          {t("contact.label.message")}
                        </FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder={t("contact.placeholder.message")}
                            className="bg-background/50 border-border/80 focus-visible:ring-primary/50 min-h-[120px] resize-none"
                            data-testid="input-message"
                            {...field}
                          />
                        </FormControl>
                        <FormMessage className="text-destructive text-xs" />
                      </FormItem>
                    )}
                  />
                  {serverError && (
                    <p className="text-sm text-destructive">{serverError}</p>
                  )}
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="w-full bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] h-12 text-md"
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
            )}
          </motion.div>
        </div>
      </div>
    </section>
  );
}

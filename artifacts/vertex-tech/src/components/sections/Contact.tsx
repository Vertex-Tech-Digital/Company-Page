import { useState } from "react";
import { motion } from "framer-motion";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import * as z from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from "@/components/ui/form";
import { CheckCircle2 } from "lucide-react";

const formSchema = z.object({
  name: z.string().min(2, "El nombre es requerido"),
  email: z.string().email("Email inválido"),
  company: z.string().optional(),
  message: z.string().min(10, "El mensaje debe tener al menos 10 caracteres"),
});

export function Contact() {
  const [isSuccess, setIsSuccess] = useState(false);

  const form = useForm<z.infer<typeof formSchema>>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: "",
      email: "",
      company: "",
      message: "",
    },
  });

  function onSubmit(values: z.infer<typeof formSchema>) {
    console.log("Form submitted:", values);
    // Simulate API call
    setTimeout(() => {
      setIsSuccess(true);
    }, 500);
  }

  return (
    <section id="contacto" className="py-24 relative overflow-hidden">
      {/* Background glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] bg-primary/5 rounded-full blur-[100px] pointer-events-none"></div>

      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-5xl mx-auto grid lg:grid-cols-2 gap-16">
          <motion.div
            initial={{ opacity: 0, x: -30 }}
            whileInView={{ opacity: 1, x: 0 }}
            viewport={{ once: true }}
          >
            <h2 className="text-4xl md:text-5xl font-bold text-white mb-6 leading-tight" data-testid="contact-title">
              ¿Listo para construir tu próxima <span className="text-primary">plataforma?</span>
            </h2>
            <p className="text-lg text-muted-foreground leading-relaxed">
              Cuéntanos qué necesitas y te ayudamos a convertirlo en una solución web sólida, moderna y escalable.
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
                <h3 className="text-2xl font-bold text-white mb-2">¡Solicitud enviada!</h3>
                <p className="text-muted-foreground">Nos pondremos en contacto contigo a la brevedad.</p>
                <Button 
                  variant="outline" 
                  className="mt-8 border-border"
                  onClick={() => { setIsSuccess(false); form.reset(); }}
                >
                  Enviar otro mensaje
                </Button>
              </motion.div>
            ) : (
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6" data-testid="contact-form">
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="name"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel className="text-white/80">Nombre</FormLabel>
                          <FormControl>
                            <Input placeholder="Tu nombre" className="bg-background/50 border-border/80 focus-visible:ring-primary/50" {...field} />
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
                          <FormLabel className="text-white/80">Email</FormLabel>
                          <FormControl>
                            <Input placeholder="tu@email.com" className="bg-background/50 border-border/80 focus-visible:ring-primary/50" {...field} />
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
                        <FormLabel className="text-white/80">Empresa (Opcional)</FormLabel>
                        <FormControl>
                          <Input placeholder="Nombre de tu empresa" className="bg-background/50 border-border/80 focus-visible:ring-primary/50" {...field} />
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
                        <FormLabel className="text-white/80">Mensaje</FormLabel>
                        <FormControl>
                          <Textarea 
                            placeholder="Cuéntanos sobre tu proyecto..." 
                            className="bg-background/50 border-border/80 focus-visible:ring-primary/50 min-h-[120px] resize-none" 
                            {...field} 
                          />
                        </FormControl>
                        <FormMessage className="text-destructive text-xs" />
                      </FormItem>
                    )}
                  />
                  <Button type="submit" className="w-full bg-primary text-white hover:bg-primary/90 shadow-[0_0_15px_rgba(59,130,246,0.3)] transition-all hover:shadow-[0_0_20px_rgba(59,130,246,0.5)] h-12 text-md" data-testid="contact-submit">
                    Enviar solicitud
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

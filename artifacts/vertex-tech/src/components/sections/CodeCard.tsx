import { motion } from "framer-motion";

export function CodeCard() {
  return (
    <motion.div
      animate={{ y: [0, -10, 0] }}
      transition={{ repeat: Infinity, duration: 6, ease: "easeInOut" }}
      className="relative w-full max-w-md mx-auto"
    >
      <div className="absolute -inset-1 bg-primary/20 blur-xl rounded-xl"></div>
      <div className="relative bg-card/80 backdrop-blur-sm border border-border/50 rounded-xl overflow-hidden shadow-2xl">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-border/50 bg-background/50">
          <div className="flex gap-1.5">
            <div className="w-3 h-3 rounded-full bg-red-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-yellow-500/80"></div>
            <div className="w-3 h-3 rounded-full bg-green-500/80"></div>
          </div>
          <div className="ml-4 text-xs text-muted-foreground font-mono">
            api/handler.ts
          </div>
        </div>
        <div className="p-6 overflow-x-auto text-sm font-mono leading-relaxed">
          <pre>
            <code>
              <span className="text-blue-400">export const</span>{" "}
              <span className="text-yellow-200">processPayment</span>{" "}
              <span className="text-blue-400">=</span>{" "}
              <span className="text-blue-400">async</span> (
              <br />
              {"  "}
              <span className="text-white">req</span>:{" "}
              <span className="text-green-300">NextApiRequest</span>,
              <br />
              {"  "}
              <span className="text-white">res</span>:{" "}
              <span className="text-green-300">NextApiResponse</span>
              <br />) <span className="text-blue-400">{`=>`}</span> {"{"}
              <br />
              {"  "}
              <span className="text-gray-500">
                // Initialize secure transaction
              </span>
              <br />
              {"  "}
              <span className="text-blue-400">const</span>{" "}
              <span className="text-white">session</span>{" "}
              <span className="text-blue-400">=</span>{" "}
              <span className="text-blue-400">await</span>{" "}
              <span className="text-white">stripe</span>.
              <span className="text-yellow-200">createSession</span>({"{"}
              <br />
              {"    "}
              <span className="text-white">mode</span>:{" "}
              <span className="text-green-400">'payment'</span>,
              <br />
              {"    "}
              <span className="text-white">customer</span>:{" "}
              <span className="text-white">req</span>.
              <span className="text-white">body</span>.
              <span className="text-white">customerId</span>,
              <br />
              {"  "}
              {"}"});
              <br />
              <br />
              {"  "}
              <span className="text-blue-400">return</span>{" "}
              <span className="text-white">res</span>.
              <span className="text-yellow-200">status</span>(
              <span className="text-purple-400">200</span>).
              <span className="text-yellow-200">json</span>({"{"}
              <br />
              {"    "}
              <span className="text-white">success</span>:{" "}
              <span className="text-blue-400">true</span>,
              <br />
              {"    "}
              <span className="text-white">sessionId</span>:{" "}
              <span className="text-white">session</span>.
              <span className="text-white">id</span>
              <br />
              {"  "}
              {"}"});
              <br />
              {"}"};
            </code>
          </pre>
        </div>
      </div>
    </motion.div>
  );
}

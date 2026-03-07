import { motion } from "framer-motion";
import { Loader2 } from "lucide-react";

const LoadingSkeleton = ({ message = "Gerando aula com IA..." }: { message?: string }) => {
  return (
    <div className="flex flex-col items-center justify-center py-20 gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 1, repeat: Infinity, ease: "linear" }}
      >
        <Loader2 className="h-8 w-8 text-primary" />
      </motion.div>
      <div className="text-center">
        <p className="font-semibold text-foreground">{message}</p>
        <p className="text-sm text-muted-foreground mt-1">
          Preparando uma aula super didática com analogias e exemplos...
        </p>
      </div>
      <div className="w-full max-w-md space-y-3 mt-6">
        {[1, 2, 3, 4, 5].map((i) => (
          <div
            key={i}
            className="h-4 rounded-md bg-muted animate-pulse"
            style={{ width: `${100 - i * 10}%` }}
          />
        ))}
      </div>
    </div>
  );
};

export default LoadingSkeleton;

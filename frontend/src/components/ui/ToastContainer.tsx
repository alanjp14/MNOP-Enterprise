import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertCircle, Info, AlertTriangle, X } from "lucide-react";
import { useToast, type ToastMessage } from "@/contexts/ToastContext";
import { cn } from "@/lib/utils";

const toastVariants = {
  initial: { opacity: 0, y: 50, scale: 0.9 },
  animate: { opacity: 1, y: 0, scale: 1 },
  exit: { opacity: 0, scale: 0.9, transition: { duration: 0.2 } },
};

const getIcon = (type: ToastMessage["type"]) => {
  switch (type) {
    case "success": return <CheckCircle2 className="h-5 w-5 text-emerald-500" />;
    case "error": return <AlertCircle className="h-5 w-5 text-rose-500" />;
    case "warning": return <AlertTriangle className="h-5 w-5 text-amber-500" />;
    case "info":
    default: return <Info className="h-5 w-5 text-sky-500" />;
  }
};

const getBgColor = (type: ToastMessage["type"]) => {
  switch (type) {
    case "success": return "bg-emerald-500/10 border-emerald-500/20";
    case "error": return "bg-rose-500/10 border-rose-500/20";
    case "warning": return "bg-amber-500/10 border-amber-500/20";
    case "info":
    default: return "bg-sky-500/10 border-sky-500/20";
  }
};

export default function ToastContainer() {
  const { toasts, hideToast } = useToast();

  return (
    <div className="fixed bottom-6 right-6 z-[200] flex flex-col gap-3 pointer-events-none max-w-sm w-full">
      <AnimatePresence>
        {toasts.map((toast) => (
          <motion.div
            key={toast.id}
            layout
            variants={toastVariants}
            initial="initial"
            animate="animate"
            exit="exit"
            // The whole toast is clickable to dismiss
            onClick={() => hideToast(toast.id)}
            className={cn(
              "pointer-events-auto cursor-pointer flex items-start gap-3 p-4 rounded-2xl border shadow-xl backdrop-blur-md transition-colors",
              "bg-white/90 dark:bg-slate-900/90",
              getBgColor(toast.type)
            )}
          >
            <div className="shrink-0 mt-0.5">{getIcon(toast.type)}</div>
            <div className="flex-1 min-w-0 text-sm font-medium text-slate-800 dark:text-slate-200">
              {toast.message}
            </div>
            <button
              type="button"
              onClick={(e) => {
                e.stopPropagation(); // prevent double trigger
                hideToast(toast.id);
              }}
              className="shrink-0 p-1 rounded-lg text-slate-400 hover:text-slate-600 dark:hover:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-800 transition-colors"
            >
              <X className="h-4 w-4" />
            </button>
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}

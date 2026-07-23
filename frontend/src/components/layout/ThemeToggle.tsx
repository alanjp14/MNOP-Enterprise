import { Moon, Sun } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { useThemeStore } from '@/stores/theme-store';
import { cn } from '@/lib/utils';

export function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();
  const isDark = theme === 'dark';

  return (
    <button
      onClick={toggleTheme}
      className={cn(
        "relative inline-flex h-10 w-10 items-center justify-center rounded-full",
        "bg-slate-100 dark:bg-slate-800 text-slate-700 dark:text-slate-300",
        "hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-amber-500",
        "border border-slate-200 dark:border-slate-700"
      )}
      title={`Beralih ke mode ${isDark ? 'terang' : 'gelap'}`}
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ opacity: 0, rotate: -90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Moon className="h-5 w-5 text-amber-400" />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ opacity: 0, rotate: 90, scale: 0.5 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: -90, scale: 0.5 }}
            transition={{ duration: 0.2 }}
          >
            <Sun className="h-5 w-5 text-amber-600" />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
}

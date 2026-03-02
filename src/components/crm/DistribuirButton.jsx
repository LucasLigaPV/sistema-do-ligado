import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { PlayCircle, CheckCircle2, Loader2 } from "lucide-react";
import { Badge } from "@/components/ui/badge";

export default function DistribuirButton({
  label,
  sublabel,
  horario,
  horaAtual,
  disabled,
  distribuindo,
  confirmando,
  jaDistribuido,
  onClick,
  fullWidth = false,
}) {
  const isActive = !disabled && !distribuindo && !jaDistribuido;
  const showHorario = horaAtual < horario && !confirmando && !jaDistribuido;

  return (
    <motion.button
      onClick={!disabled && !distribuindo && !jaDistribuido ? onClick : undefined}
      disabled={disabled || distribuindo || jaDistribuido}
      whileTap={isActive ? { scale: 0.97 } : {}}
      className={`relative overflow-hidden flex items-center justify-between px-4 py-3 rounded-xl border-2 transition-colors duration-300 outline-none
        ${fullWidth ? "w-full" : ""}
        ${jaDistribuido
          ? "bg-slate-50 border-slate-200 cursor-not-allowed opacity-60"
          : confirmando
          ? "bg-slate-900 border-slate-900"
          : distribuindo
          ? "bg-white border-slate-300 cursor-wait"
          : disabled
          ? "bg-white border-slate-200 opacity-50 cursor-not-allowed"
          : "bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50 cursor-pointer"
        }
      `}
      style={{ minHeight: 64 }}
    >
      {/* Shimmer enquanto distribui */}
      <AnimatePresence>
        {distribuindo && (
          <motion.div
            initial={{ x: "-100%" }}
            animate={{ x: "200%" }}
            transition={{ duration: 1.0, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 w-full"
            style={{
              background: "linear-gradient(90deg, transparent 0%, rgba(239,194,0,0.12) 40%, rgba(239,194,0,0.22) 50%, rgba(239,194,0,0.12) 60%, transparent 100%)",
              zIndex: 0,
            }}
          />
        )}
      </AnimatePresence>

      {/* Conteúdo principal */}
      <div className="relative z-10 flex items-center gap-3">
        <div className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors duration-300
          ${confirmando ? "bg-[#EFC200]" : distribuindo ? "bg-slate-100" : "bg-slate-100"}
        `}>
          <AnimatePresence mode="wait">
            {confirmando ? (
              <motion.div
                key="check"
                initial={{ scale: 0, opacity: 0 }}
                animate={{ scale: 1, opacity: 1 }}
                exit={{ scale: 0, opacity: 0 }}
                transition={{ type: "spring", stiffness: 500, damping: 25 }}
              >
                <CheckCircle2 className="w-5 h-5 text-black" />
              </motion.div>
            ) : distribuindo ? (
              <motion.div
                key="loader"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <Loader2 className="w-5 h-5 text-slate-500 animate-spin" />
              </motion.div>
            ) : (
              <motion.div
                key="play"
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
              >
                <PlayCircle className="w-5 h-5 text-slate-600" />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className="text-left">
          <AnimatePresence mode="wait">
            {confirmando ? (
              <motion.div
                key="done"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="font-semibold text-white text-sm">Distribuído!</div>
                <div className="text-xs text-slate-400 mt-0.5">{label} concluído com sucesso</div>
              </motion.div>
            ) : distribuindo ? (
              <motion.div
                key="loading"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="font-medium text-slate-700 text-sm">Distribuindo {label}...</div>
                <div className="text-xs text-slate-400 mt-0.5">Calculando e enviando leads</div>
              </motion.div>
            ) : (
              <motion.div
                key="idle"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
              >
                <div className="font-medium text-slate-900 text-sm">{label}</div>
                <div className="text-xs text-slate-500 mt-0.5">{sublabel}</div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>

      {/* Badge de horário ou status */}
      <div className="relative z-10">
        {showHorario && (
          <Badge variant="outline" className="text-xs border-slate-300 text-slate-500">
            {horario}
          </Badge>
        )}
        {jaDistribuido && !confirmando && (
          <Badge variant="outline" className="text-xs border-slate-200 text-slate-400">
            Concluído
          </Badge>
        )}
      </div>

      {/* Progress bar inferior */}
      <AnimatePresence>
        {distribuindo && (
          <motion.div
            initial={{ scaleX: 0, originX: 0 }}
            animate={{ scaleX: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 2.0, ease: "easeInOut" }}
            className="absolute bottom-0 left-0 h-0.5 w-full bg-[#EFC200] origin-left"
            style={{ zIndex: 1 }}
          />
        )}
      </AnimatePresence>
    </motion.button>
  );
}
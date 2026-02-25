import React from "react";
import { motion } from "framer-motion";
import { CheckCircle } from "lucide-react";

export default function TimelineEtapas({ 
  etapas, 
  etapaAtual, 
  onEtapaClick, 
  isReadOnly 
}) {
  const etapasVisiveis = etapas.filter(e => e.id !== "reprovado" && e.id !== "venda_ativa");
  const currentIndex = etapasVisiveis.findIndex(e => e.id === etapaAtual);

  return (
    <div className="bg-gradient-to-br from-slate-50 to-slate-100/50 rounded-xl p-6 border border-slate-200 shadow-sm">
      <h3 className="text-sm font-bold text-slate-800 mb-5 uppercase tracking-wider flex items-center gap-2">
        <div className="w-1 h-5 bg-[#EFC200] rounded-full"></div>
        Etapas do Processo
      </h3>
      <div className="relative">
        {etapasVisiveis.map((etapa, index) => {
          const IconComponent = etapa.icon;
          const isCurrentEtapa = etapaAtual === etapa.id;
          const isPassed = index < currentIndex;
          const isFuture = index > currentIndex;
          const canClick = !isReadOnly;
          
          return (
            <div key={etapa.id} className="relative">
              {/* Linha conectora */}
              {index < etapasVisiveis.length - 1 && (
                <motion.div 
                  initial={{ opacity: 0, scaleY: 0 }}
                  animate={{ opacity: 1, scaleY: 1 }}
                  transition={{ 
                    delay: 0.5 + index * 0.05,
                    duration: 0.3,
                    ease: "easeOut"
                  }}
                  className={`absolute w-0.5 origin-top ${
                    isPassed || isCurrentEtapa ? 'bg-gradient-to-b from-green-400 to-green-200' : 'bg-gradient-to-b from-slate-300 to-transparent'
                  }`} 
                  style={{ 
                    left: 'calc(0.75rem + 16px)', 
                    top: '2.5rem', 
                    height: '40px' 
                  }} 
                />
              )}
              
              {/* Item da etapa */}
              <motion.div
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.4 + index * 0.05 }}
                className={`relative flex items-start gap-3 py-2 px-3 rounded-lg mb-1 transition-all ${
                  canClick ? 'cursor-pointer hover:bg-white' : ''
                } ${isCurrentEtapa ? 'bg-white shadow-sm' : ''}`}
                onClick={() => canClick && onEtapaClick(etapa.id)}
              >
                {/* Bolinha indicadora */}
                <div className="flex-shrink-0">
                  {isCurrentEtapa ? (
                    <motion.div
                      animate={{
                        scale: [1, 1.2, 1],
                        boxShadow: [
                          "0 0 0 0 rgba(34, 197, 94, 0.7)",
                          "0 0 0 8px rgba(34, 197, 94, 0)",
                          "0 0 0 0 rgba(34, 197, 94, 0)"
                        ]
                      }}
                      transition={{
                        duration: 2,
                        repeat: Infinity,
                        ease: "easeInOut"
                      }}
                      className="w-8 h-8 rounded-full bg-gradient-to-br from-green-400 to-green-600 flex items-center justify-center shadow-lg"
                    >
                      <IconComponent className="w-4 h-4 text-white" />
                    </motion.div>
                  ) : isPassed ? (
                    <div className="w-8 h-8 rounded-full bg-gradient-to-br from-green-100 to-green-200 flex items-center justify-center border-2 border-green-300">
                      <CheckCircle className="w-4 h-4 text-green-600" />
                    </div>
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-slate-100 flex items-center justify-center border-2 border-slate-200">
                      <IconComponent className="w-4 h-4 text-slate-400" />
                    </div>
                  )}
                </div>
                
                {/* Texto da etapa */}
                <div className="flex-1 min-w-0 pt-1">
                  <p className={`text-xs font-semibold leading-tight ${
                    isCurrentEtapa ? 'text-green-700' : 
                    isPassed ? 'text-green-600' : 
                    'text-slate-500'
                  }`}>
                    {etapa.label}
                  </p>
                  {isCurrentEtapa && (
                    <p className="text-[10px] text-green-600 mt-0.5 font-medium">
                      Etapa atual
                    </p>
                  )}
                </div>
              </motion.div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
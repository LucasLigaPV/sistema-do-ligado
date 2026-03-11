import React, { useState, useRef, useEffect } from "react";
import { Label } from "@/components/ui/label";
import { ChevronDown, Search, X, Package } from "lucide-react";

const planosDisponiveis = [
  { value: "essencial", label: "Essencial" },
  { value: "principal", label: "Principal" },
  { value: "plano_van", label: "Plano Van" },
  { value: "plano_moto", label: "Plano Moto" },
  { value: "plano_caminhao", label: "Plano Caminhão" },
];

export default function FiltroPlano({ 
  planosSelecionados, 
  onSelectionChange,
  label = "Plano"
}) {
  const [open, setOpen] = useState(false);
  const [busca, setBusca] = useState("");
  const ref = useRef(null);

  const allSelected = planosSelecionados.length === 0;

  const planosFiltrados = planosDisponiveis.filter(plano =>
    plano.label.toLowerCase().includes(busca.toLowerCase())
  );

  // Fecha ao clicar fora
  useEffect(() => {
    function handleClickOutside(e) {
      if (ref.current && !ref.current.contains(e.target)) {
        setOpen(false);
        setBusca("");
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const getLabelTexto = () => {
    if (allSelected) return "Todos";
    if (planosSelecionados.length === 1) {
      const plano = planosDisponiveis.find(p => p.value === planosSelecionados[0]);
      return plano?.label || "N/A";
    }
    return `${planosSelecionados.length} selecionados`;
  };

  return (
    <div ref={ref} className="relative">
      <Label className="text-sm text-slate-600 mb-2 block">{label}</Label>

      {/* Trigger */}
      <button
        type="button"
        onClick={() => { setOpen(!open); setBusca(""); }}
        className={`w-full h-9 flex items-center justify-between gap-2 px-3 rounded-md border bg-white text-sm transition-all
          ${open 
            ? "border-slate-400 ring-2 ring-slate-100 shadow-sm" 
            : "border-slate-200 hover:border-slate-300 shadow-sm"
          }`}
      >
        <div className="flex items-center gap-2 min-w-0">
          <Package className="w-3.5 h-3.5 text-slate-400 flex-shrink-0" />
          <span className={`truncate ${allSelected ? "text-slate-500" : "text-slate-800 font-medium"}`}>
            {getLabelTexto()}
          </span>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          {!allSelected && (
            <button
              onClick={(e) => { e.stopPropagation(); onSelectionChange([]); }}
              className="p-0.5 rounded hover:bg-slate-100 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X className="w-3 h-3" />
            </button>
          )}
          <ChevronDown className={`w-3.5 h-3.5 text-slate-400 transition-transform ${open ? "rotate-180" : ""}`} />
        </div>
      </button>

      {/* Dropdown */}
      {open && (
        <div className="absolute z-50 top-full mt-1 w-full min-w-[220px] bg-white border border-slate-200 rounded-lg shadow-lg overflow-hidden">
          {/* Busca */}
          <div className="p-2 border-b border-slate-100">
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400" />
              <input
                type="text"
                placeholder="Buscar plano..."
                value={busca}
                onChange={(e) => setBusca(e.target.value)}
                autoFocus
                className="w-full pl-8 pr-3 py-1.5 text-sm bg-slate-50 border border-slate-200 rounded-md focus:outline-none focus:border-slate-400 focus:bg-white transition-colors"
              />
            </div>
          </div>

          {/* Opção "Todos" */}
          <div className="p-1.5 border-b border-slate-100">
            <button
              type="button"
              onClick={() => onSelectionChange([])}
              className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm font-medium transition-colors
                ${allSelected ? "bg-[#EFC200]/10 text-slate-800" : "text-slate-600 hover:bg-slate-50"}`}
            >
              <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors flex-shrink-0
                ${allSelected ? "bg-[#EFC200] border-[#D4A900]" : "border-slate-300"}`}>
                {allSelected && <span className="text-[10px] font-bold text-white">✓</span>}
              </div>
              Todos
            </button>
          </div>

          {/* Lista de planos */}
          <div className="max-h-48 overflow-y-auto p-1.5 space-y-0.5">
            {planosFiltrados.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-3">Nenhum resultado</p>
            ) : (
              planosFiltrados.map((plano) => {
                const isChecked = planosSelecionados.includes(plano.value);

                return (
                  <button
                    key={plano.value}
                    type="button"
                    onClick={() => {
                      if (isChecked) {
                        onSelectionChange(planosSelecionados.filter(p => p !== plano.value));
                      } else {
                        onSelectionChange([...planosSelecionados, plano.value]);
                      }
                    }}
                    className={`w-full flex items-center gap-2.5 px-2.5 py-1.5 rounded-md text-sm transition-colors text-left
                      ${isChecked ? "bg-[#EFC200]/10" : "hover:bg-slate-50"}`}
                  >
                    <div className={`w-4 h-4 rounded flex items-center justify-center border transition-colors flex-shrink-0
                      ${isChecked ? "bg-[#EFC200] border-[#D4A900]" : "border-slate-300"}`}>
                      {isChecked && <span className="text-[10px] font-bold text-white">✓</span>}
                    </div>
                    <span className={`truncate ${isChecked ? "font-medium text-slate-800" : "text-slate-600"}`}>
                      {plano.label}
                    </span>
                  </button>
                );
              })
            )}
          </div>
        </div>
      )}
    </div>
  );
}
import React, { useState, useEffect, useRef } from "react";
import { Check, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

const categorias = [
  { label: "Financeiro", value: "financeiro" },
  { label: "Timing", value: "timing" },
  { label: "Confiança", value: "confianca" },
  { label: "Concorrência", value: "concorrencia" },
  { label: "Necessidade", value: "necessidade" },
  { label: "Situações Esporádicas", value: "situacoes_esporadicas" },
  { label: "Lead Inválido", value: "lead_invalido" },
];

export default function FiltroCategoriaPerdas({ categoriasSelecionadas = [], onSelectionChange }) {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const toggleCategoria = (categoria) => {
    if (categoriasSelecionadas.includes(categoria)) {
      onSelectionChange(categoriasSelecionadas.filter((c) => c !== categoria));
    } else {
      onSelectionChange([...categoriasSelecionadas, categoria]);
    }
  };

  const toggleAll = () => {
    if (categoriasSelecionadas.length === categorias.length) {
      onSelectionChange([]);
    } else {
      onSelectionChange(categorias.map((c) => c.value));
    }
  };

  const filteredCategorias = categorias.filter((cat) =>
    cat.label.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getLabel = () => {
    if (categoriasSelecionadas.length === 0) return "Todas as categorias";
    if (categoriasSelecionadas.length === categorias.length) return "Todas as categorias";
    if (categoriasSelecionadas.length === 1) {
      const cat = categorias.find((c) => c.value === categoriasSelecionadas[0]);
      return cat?.label || "1 categoria";
    }
    return `${categoriasSelecionadas.length} categorias`;
  };

  return (
    <div ref={dropdownRef} className="relative">
      <Label className="text-sm text-slate-600 mb-2 block">Categoria da Perda</Label>
      <Button
        type="button"
        variant="outline"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full justify-between text-left font-normal"
      >
        <span className="truncate">{getLabel()}</span>
        <ChevronDown className="ml-2 h-4 w-4 shrink-0 opacity-50" />
      </Button>
      
      {isOpen && (
        <div className="absolute z-50 mt-2 w-full rounded-md border bg-white shadow-lg">
          <div className="p-2 border-b">
            <Input
              placeholder="Buscar categoria..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="h-9"
            />
          </div>
          <div className="max-h-64 overflow-y-auto p-2">
            <div
              className="flex items-center space-x-2 rounded-sm px-2 py-1.5 cursor-pointer hover:bg-slate-100"
              onClick={toggleAll}
            >
              <div className={`h-4 w-4 border rounded flex items-center justify-center ${
                categoriasSelecionadas.length === categorias.length ? "bg-[#EFC200] border-[#EFC200]" : "border-slate-300"
              }`}>
                {categoriasSelecionadas.length === categorias.length && <Check className="h-3 w-3 text-black" />}
              </div>
              <span className="text-sm font-medium">Selecionar todas</span>
            </div>
            {filteredCategorias.map((cat) => (
              <div
                key={cat.value}
                className="flex items-center space-x-2 rounded-sm px-2 py-1.5 cursor-pointer hover:bg-slate-100"
                onClick={() => toggleCategoria(cat.value)}
              >
                <div className={`h-4 w-4 border rounded flex items-center justify-center ${
                  categoriasSelecionadas.includes(cat.value) ? "bg-[#EFC200] border-[#EFC200]" : "border-slate-300"
                }`}>
                  {categoriasSelecionadas.includes(cat.value) && <Check className="h-3 w-3 text-black" />}
                </div>
                <span className="text-sm">{cat.label}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
import React from "react";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";

export default function CampoPlaca({ 
  value, 
  onChange, 
  veiculo0km = false, 
  onVeiculo0kmChange, 
  disabled = false, 
  error = null,
  required = true,
  showCheckbox = true,
  checkboxId = "veiculo-0km-field"
}) {
  return (
    <div>
      <div className="flex items-center justify-between mb-2">
        <Label className={error ? "text-red-600 text-sm font-medium" : "text-sm font-medium text-slate-700"}>
          Placa {required && !veiculo0km && "*"}
        </Label>
        {showCheckbox && (
          <div className="flex items-center gap-2">
            <Checkbox
              id={checkboxId}
              checked={veiculo0km || false}
              onCheckedChange={(checked) => {
                if (onVeiculo0kmChange) {
                  onVeiculo0kmChange(checked);
                }
                if (checked && onChange) {
                  onChange("");
                }
              }}
              disabled={disabled}
              className="data-[state=checked]:bg-[#EFC200] data-[state=checked]:border-[#EFC200] data-[state=checked]:text-black"
            />
            <label htmlFor={checkboxId} className="text-xs font-medium text-slate-600 cursor-pointer">
              Veículo 0km
            </label>
          </div>
        )}
      </div>
      <Input
        value={value || ""}
        onChange={(e) => {
          const valor = e.target.value.toUpperCase().replace(/[^A-Z0-9]/g, '');
          let formatado = valor;
          if (valor.length > 3) {
            formatado = `${valor.slice(0, 3)}-${valor.slice(3, 7)}`;
          }
          onChange?.(formatado);
        }}
        placeholder={veiculo0km ? "Não necessário para 0km" : "ABC-1D23"}
        maxLength={8}
        disabled={disabled || veiculo0km}
        className={`h-11 border-slate-300 focus:border-slate-400 transition-all ${error ? "border-red-400 focus:border-red-500" : ""}`}
      />
      {error && (
        <div className="flex items-center gap-1 mt-1">
          <span className="text-xs text-red-500 font-medium">{error}</span>
        </div>
      )}
    </div>
  );
}
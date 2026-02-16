import React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { ChevronDown } from "lucide-react";

export default function FiltroVendedor({ 
  vendedoresSelecionados, 
  todosVendedores, 
  onSelectionChange,
  users = [],
  userEmail = ""
}) {
  const getNomeVendedor = (email) => {
    if (!email) return "N/A";
    const user = users.find(u => u.email && u.email.toLowerCase() === email.toLowerCase());
    if (user) {
      return user.nome_exibicao || user.full_name || email;
    }
    return email;
  };

  const allSelected = vendedoresSelecionados.length === todosVendedores.length;

  return (
    <div>
      <Label className="text-sm text-slate-600 mb-2 block">Vendedor</Label>
      <Popover>
        <PopoverTrigger asChild>
          <Button 
            variant="outline" 
            className="w-full justify-between h-9 px-3"
          >
            <span className="text-sm text-slate-700 truncate">
              {vendedoresSelecionados.length === 0 
                ? "Selecione vendedor" 
                : allSelected 
                ? "Todos da Equipe" 
                : vendedoresSelecionados.map(email => getNomeVendedor(email)).join(", ")}
            </span>
            <ChevronDown className="w-4 h-4 opacity-50 flex-shrink-0" />
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-full p-3" align="start">
          <div className="space-y-3">
            <div className="flex items-center gap-2 p-2 rounded-md hover:bg-amber-50">
              <Checkbox 
                id="all-team"
                checked={allSelected}
                onCheckedChange={(checked) => {
                  if (checked) {
                    onSelectionChange(todosVendedores);
                  } else {
                    onSelectionChange([]);
                  }
                }}
                className="data-[state=checked]:bg-[#EFC200] data-[state=checked]:border-[#D4A900]"
              />
              <Label htmlFor="all-team" className="text-sm font-medium cursor-pointer">
                Todos da Equipe
              </Label>
            </div>
            <div className="border-t pt-2 space-y-2 max-h-48 overflow-y-auto">
              {todosVendedores.map((email) => {
                const isChecked = vendedoresSelecionados.includes(email);
                const isCurrentUser = email === userEmail;
                const nomeVendedor = getNomeVendedor(email);
                return (
                  <div 
                    key={email} 
                    className={`flex items-center gap-2 truncate p-2 rounded-md transition-colors ${
                      isChecked ? 'bg-amber-100' : 'hover:bg-slate-100'
                    }`}
                  >
                    <Checkbox 
                      id={`seller-${email}`}
                      checked={isChecked}
                      onCheckedChange={(checked) => {
                        if (checked) {
                          onSelectionChange([...vendedoresSelecionados, email]);
                        } else {
                          onSelectionChange(vendedoresSelecionados.filter(e => e !== email));
                        }
                      }}
                      className={isChecked ? "data-[state=checked]:bg-[#EFC200] data-[state=checked]:border-[#D4A900]" : ""}
                    />
                    <Label htmlFor={`seller-${email}`} className="text-sm cursor-pointer truncate font-medium">
                      {nomeVendedor} {isCurrentUser && "(Você)"}
                    </Label>
                  </div>
                );
              })}
            </div>
          </div>
        </PopoverContent>
      </Popover>
    </div>
  );
}
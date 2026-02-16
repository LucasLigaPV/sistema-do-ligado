import React, { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import KanbanAprovacoes from "./KanbanAprovacoes";
import DashboardAprovacoes from "./DashboardAprovacoes";
import { Columns3, BarChart3 } from "lucide-react";

export default function ApprovacoesMenu({ userEmail, userFuncao }) {
  const [activeTab, setActiveTab] = useState("avaliar");

  return (
    <div className="space-y-6">
      <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
        <TabsList className="grid w-full grid-cols-2 bg-slate-100">
          <TabsTrigger value="avaliar" className="flex items-center gap-2">
            <Columns3 className="w-4 h-4" />
            Avaliar
          </TabsTrigger>
          <TabsTrigger value="dashboard" className="flex items-center gap-2">
            <BarChart3 className="w-4 h-4" />
            Dashboard
          </TabsTrigger>
        </TabsList>

        <TabsContent value="avaliar" className="mt-6">
          <KanbanAprovacoes userEmail={userEmail} userFuncao={userFuncao} />
        </TabsContent>

        <TabsContent value="dashboard" className="mt-6">
          <DashboardAprovacoes />
        </TabsContent>
      </Tabs>
    </div>
  );
}
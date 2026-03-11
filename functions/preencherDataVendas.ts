import { createClientFromRequest } from 'npm:@base44/sdk@0.8.20';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);
    const user = await base44.auth.me();

    if (user?.role !== 'admin') {
      return Response.json({ error: 'Forbidden: Admin access required' }, { status: 403 });
    }

    // Busca todas as vendas
    const vendas = await base44.entities.Venda.list();
    let atualizado = 0;

    for (const venda of vendas) {
      // Se data_venda não existe, atualizar com created_date -3 horas
      if (!venda.data_venda && venda.created_date) {
        const dataUTC = new Date(venda.created_date);
        const dataSaoPaulo = new Date(dataUTC.getTime() - 3 * 60 * 60 * 1000);
        
        await base44.entities.Venda.update(venda.id, {
          data_venda: dataSaoPaulo.toISOString()
        });
        atualizado++;
      }
    }

    return Response.json({ 
      success: true, 
      message: `Preenchimento concluído: ${atualizado} vendas atualizadas` 
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
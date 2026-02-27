import { createClientFromRequest } from 'npm:@base44/sdk@0.8.6';

Deno.serve(async (req) => {
  try {
    const base44 = createClientFromRequest(req);

    // Busca todas as negociações que são venda_ativa e têm anexos não expirados
    const negociacoes = await base44.asServiceRole.entities.Negociacao.filter({
      etapa: "venda_ativa"
    });

    const agora = new Date();
    const VINTE_QUATRO_HORAS = 24 * 60 * 60 * 1000;

    let totalExpirados = 0;

    for (const neg of negociacoes) {
      if (!neg.data_venda_ativa) continue;

      const dataVendaAtiva = new Date(neg.data_venda_ativa);
      const diff = agora - dataVendaAtiva;

      if (diff < VINTE_QUATRO_HORAS) continue;

      const anexos = neg.anexos_reprova || [];
      const temAnexoNaoExpirado = anexos.some(a => !a.expirado);

      if (!temAnexoNaoExpirado) continue;

      // Marca todos como expirados
      const anexosAtualizados = anexos.map(a => ({ ...a, expirado: true, url: null }));

      await base44.asServiceRole.entities.Negociacao.update(neg.id, {
        anexos_reprova: anexosAtualizados
      });

      totalExpirados++;
    }

    return Response.json({
      success: true,
      message: `${totalExpirados} negociações tiveram anexos expirados.`
    });
  } catch (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }
});
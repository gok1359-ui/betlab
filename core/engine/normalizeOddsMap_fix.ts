// 🔥 핵심 수정: oddsData가 배열 그대로 들어오는 케이스 처리

function normalizeOddsMap(input: any): Record<string, any> {
  if (!input) return {};

  // ✅ 기존: { oddsByGame }
  if (input.oddsByGame && typeof input.oddsByGame === 'object') {
    return input.oddsByGame;
  }

  // ✅ 핵심 FIX: 배열 직접 들어오는 경우
  const dataArray = Array.isArray(input)
    ? input
    : Array.isArray(input.data)
    ? input.data
    : null;

  if (dataArray) {
    const out: Record<string, any> = {};

    for (const event of dataArray) {
      const home = (event?.home_team || '').toLowerCase();
      const away = (event?.away_team || '').toLowerCase();
      if (!home || !away) continue;

      const bookmaker = event?.bookmakers?.[0];
      const markets = bookmaker?.markets || [];

      const h2h = markets.find((m: any) => m?.key === 'h2h');
      const spreads = markets.find((m: any) => m?.key === 'spreads');
      const totals = markets.find((m: any) => m?.key === 'totals');

      const h2hOutcomes = h2h?.outcomes || [];
      const spreadOutcomes = spreads?.outcomes || [];
      const totalOutcomes = totals?.outcomes || [];

      const homeH2h = h2hOutcomes.find((o: any) => o?.name?.toLowerCase() === home);
      const awayH2h = h2hOutcomes.find((o: any) => o?.name?.toLowerCase() === away);

      const summary = {
        bookmaker: bookmaker?.title || 'bookmaker',
        homeMoneyline: homeH2h?.price ?? null,
        awayMoneyline: awayH2h?.price ?? null,
      };

      out[`${away} @ ${home}`] = summary;
      out[`${home} vs ${away}`] = summary;
      out[`${away} at ${home}`] = summary;
    }

    return out;
  }

  return {};
}

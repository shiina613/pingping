export function getCompetitionCountdowns(competitions, now = new Date()) {
  const nowTime = now.getTime();

  return competitions.map(comp => {
    const event = comp.timeline
      .filter(item => Number.isFinite(new Date(item.date).getTime()) && new Date(item.date).getTime() > nowTime)
      .sort((a, b) => new Date(a.date) - new Date(b.date))[0] || null;

    return { comp, event };
  }).sort((a, b) => (a.event ? new Date(a.event.date).getTime() : Infinity) - (b.event ? new Date(b.event.date).getTime() : Infinity));
}

export function getCountdownParts(target, now = new Date()) {
  let remaining = Math.max(0, target.getTime() - now.getTime());
  const take = divisor => {
    const value = Math.floor(remaining / divisor);
    remaining %= divisor;
    return String(value).padStart(2, '0');
  };

  return {
    days: take(86_400_000),
    hours: take(3_600_000),
    minutes: take(60_000),
    seconds: take(1_000)
  };
}

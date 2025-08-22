/**
 * Simple scoring algorithm:
 * - Start each category at 100
 * - Deduct per issue severity and category weights
 * - Return integer 0-100 for each category
 */

const severityWeights = { low: 2, medium: 6, high: 12, critical: 20 };

function computeScores({ findings = [], counts = {} }) {
  let security = 100, performance = 100, seo = 100, a11y = 100;

  for (const f of findings) {
    const w = severityWeights[f.severity] || 2;
    if (f.category === 'security') security = Math.max(0, security - w);
    if (f.category === 'performance') performance = Math.max(0, performance - w);
    if (f.category === 'seo') seo = Math.max(0, seo - w);
    if (f.category === 'accessibility') a11y = Math.max(0, a11y - w);
  }

  // extra heuristic penalties
  if (counts.requests && counts.requests > 150) performance = Math.max(0, performance - 5);

  return {
    security: Math.round(security),
    performance: Math.round(performance),
    seo: Math.round(seo),
    a11y: Math.round(a11y)
  };
}

module.exports = { computeScores };

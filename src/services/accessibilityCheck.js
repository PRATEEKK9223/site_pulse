/**
 * Accessibility checks using axe-core injected into Puppeteer page.
 * Returns violations mapped to our format.
 */

const axeCore = require('axe-core');

module.exports.check = async function (page) {
  try {
    // Inject axe-core script source
    await page.addScriptTag({ content: axeCore.source });
    const results = await page.evaluate(async () => await axe.run(document, { runOnly: ['wcag2aa', 'wcag21aa'] }));
    const violations = (results.violations || []).map(v => ({
      category: 'accessibility',
      severity: mapImpactToSeverity(v.impact),
      code: `A11Y_${v.id.toUpperCase()}`,
      message: v.description,
      meta: { help: v.help, nodes: v.nodes.length, impact: v.impact }
    }));
    return violations;
  } catch (e) {
    console.error('A11Y check failed', e.message);
    return [{
      category: 'accessibility',
      severity: 'low',
      code: 'A11Y_CHECK_FAILED',
      message: 'Accessibility check failed to run',
      meta: {}
    }];
  }
};

function mapImpactToSeverity(impact) {
  if (!impact) return 'low';
  if (impact === 'critical') return 'critical';
  if (impact === 'serious') return 'high';
  if (impact === 'moderate') return 'medium';
  return 'low';
}

const fs = require('fs');
const path = require('path');

const filesToPatch = [
  path.join(__dirname, '..', 'node_modules', 'apexcharts', 'dist', 'apexcharts.esm.js'),
  path.join(__dirname, '..', 'node_modules', 'apexcharts', 'dist', 'apexcharts.js')
];

for (const filePath of filesToPatch) {
  if (!fs.existsSync(filePath)) {
    console.log(`[patch-apexcharts] Skipping non-existent: ${filePath}`);
    continue;
  }

  let content = fs.readFileSync(filePath, 'utf8');
  let modified = false;

  // 1. Guard zoomRect.attr in drawSelectionRect
  if (content.includes('if (w.interact.zoomEnabled && this.dragged)') && !content.includes('if (w.interact.zoomEnabled && this.dragged && zoomRect)')) {
    content = content.replace(
      'if (w.interact.zoomEnabled && this.dragged) {',
      'if (w.interact.zoomEnabled && this.dragged && zoomRect) {'
    );
    modified = true;
  }

  // 2. Guard Graphics.setAttrs(zoomRect.node, scalingAttrs);
  if (content.includes('Graphics.setAttrs(zoomRect.node, scalingAttrs);') && !content.includes('if (zoomRect && zoomRect.node) Graphics.setAttrs(zoomRect.node, scalingAttrs);')) {
    content = content.replace(
      'Graphics.setAttrs(zoomRect.node, scalingAttrs);',
      'if (zoomRect && zoomRect.node) Graphics.setAttrs(zoomRect.node, scalingAttrs);'
    );
    modified = true;
  }

  // 3. Guard selRect in selectionDrawn
  const targetPattern1 = 'const selRect = w.interact.zoomEnabled ? me.zoomRect.node.getBoundingClientRect() : me.selectionRect.node.getBoundingClientRect();';
  const targetPattern2 = 'const selRect = w.interact.zoomEnabled ? me.zoomRect.node.getBoundingClientRect() : me.selectionRect.node.getBoundingClientRect();';
  const replacement = 'const selRect = (w.interact.zoomEnabled && me.zoomRect && me.zoomRect.node) ? me.zoomRect.node.getBoundingClientRect() : (me.selectionRect && me.selectionRect.node ? me.selectionRect.node.getBoundingClientRect() : null);\n    if (!selRect) return;';

  if (content.includes(targetPattern1)) {
    content = content.replace(targetPattern1, replacement);
    modified = true;
  }

  if (modified) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`[patch-apexcharts] Successfully patched: ${filePath}`);
  } else {
    console.log(`[patch-apexcharts] Already patched or pattern not found in: ${filePath}`);
  }
}

const fs = require('fs')

const fittingWxml = fs.readFileSync('packageFitting/pages/index.wxml', 'utf8')
const fittingWxss = fs.readFileSync('packageFitting/pages/index.wxss', 'utf8')
const aptechWxml = fs.readFileSync('pages/aptech/index.wxml', 'utf8')
const aptechWxss = fs.readFileSync('pages/aptech/index.wxss', 'utf8')

function requireMatch(text, pattern, message) {
  if (!pattern.test(text)) throw new Error(message)
}

function rejectMatch(text, pattern, message) {
  if (pattern.test(text)) throw new Error(message)
}

requireMatch(
  fittingWxml,
  /wx:if="\{\{candidate\.sourceModelText !== item\.input\}\}"[^>]*class="candidate-detail"/,
  'fitting must suppress a candidate model that duplicates the input'
)
requireMatch(
  aptechWxml,
  /wx:if="\{\{candidate\.sourceModel !== item\.input\}\}"[^>]*class="candidate-detail"/,
  'APTech must suppress a candidate model that duplicates the input'
)

for (const [name, wxml, wxss] of [
  ['fitting', fittingWxml, fittingWxss],
  ['APTech', aptechWxml, aptechWxss]
]) {
  requireMatch(wxml, /class="[^"]*mapping-stack[^"]*"/, `${name} must use compact stacked mappings`)
  requireMatch(wxml, /class="mapping-relation"[\s\S]*?→[\s\S]*?VIGOUR/, `${name} must dedicate one row to the brand relationship`)
  requireMatch(wxml, /class="mapping-model-row"/, `${name} must dedicate one row to the model and action`)
  requireMatch(wxml, /class="[^"]*mapping-target[^"]*"/, `${name} must expose a flexible VIGOUR target region`)
  rejectMatch(wxml, /VIGOUR 精确型号 \/ EXACT/, `${name} must remove the redundant exact mapping heading`)
  requireMatch(
    wxss,
    /\.mapping-stack\s*\{[^}]*flex-direction:\s*column;[^}]*align-items:\s*stretch;/s,
    `${name} mapping block must stack relationship above the model row`
  )
  requireMatch(
    wxss,
    /\.mapping-model-row\s*\{[^}]*display:\s*flex;[^}]*align-items:\s*center;/s,
    `${name} model and action must share a dedicated row`
  )
  requireMatch(
    wxss,
    /\.mapping-target\s*\{[^}]*min-width:\s*0;[^}]*flex:\s*1;/s,
    `${name} VIGOUR target must remain flexible for long model codes`
  )
}

requireMatch(
  fittingWxml,
  /<button[\s\S]*?class="[^"]*mapping-stack[^"]*mapping-card--warning[^"]*"[\s\S]*?bindtap="copyVigourModel"/,
  'fitting review candidates must retain the copy-and-review button'
)
requireMatch(
  aptechWxml,
  /<button[\s\S]*?wx:if="\{\{candidate\.vigourModel && candidate\.copySafe\}\}"[\s\S]*?class="[^"]*mapping-card--button[^"]*mapping-stack[^"]*"[\s\S]*?bindtap="copyModel"/,
  'APTech safe candidates must remain copy buttons'
)
requireMatch(
  aptechWxss,
  /\.mapping-card\.mapping-card--button\s*\{[^}]*align-self:\s*stretch;[^}]*width:\s*100%;[^}]*max-width:\s*100%;[^}]*margin:\s*0;/s,
  'APTech native mapping buttons must override the injected fixed width'
)
requireMatch(
  aptechWxml,
  /<view\s+wx:elif="\{\{candidate\.vigourModel\}\}"\s+class="[^"]*mapping-stack[^"]*mapping-card--warning[^"]*"/,
  'APTech unsafe candidates must remain non-interactive review rows'
)

console.log('compact cross-reference card contract passed')

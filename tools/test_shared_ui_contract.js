const fs = require("fs")

const appJson = JSON.parse(fs.readFileSync("app.json", "utf8"))
if (appJson.window.navigationStyle !== "custom") throw new Error("custom navigation is required")

const appWxss = fs.readFileSync("app.wxss", "utf8")
for (const token of ["--color-brand", "--color-success", "--color-warning", "--radius-card", ".ui-button-primary"]) {
  if (!appWxss.includes(token)) throw new Error(`missing global UI token: ${token}`)
}

if (!/\.ui-engineering-note\s*\{[^}]*display:\s*block/s.test(appWxss)) {
  throw new Error("engineering notes must be block-level so dividers and copy cannot overlap the toggle")
}
if (/SFMono-Regular|Liberation Mono|monospace/.test(appWxss)) {
  throw new Error("shared UI must not force a separate monospace font family")
}
if (!/\.ui-result-code\s*\{[^}]*font-family:\s*inherit;/s.test(appWxss)) {
  throw new Error("shared result codes must inherit the global app font")
}

if (!/view,\s*\ntext,\s*\ninput,\s*\ntextarea,\s*\npicker,\s*\nbutton\s*\{[^}]*box-sizing:\s*border-box/s.test(appWxss)) {
  throw new Error("native textareas must use border-box so padded inputs cannot create horizontal page overflow")
}
if (!/\nbutton\s*\{[^}]*min-width:\s*0;[^}]*max-width:\s*100%;/s.test(appWxss)) {
  throw new Error("native buttons must be capped to their grid or flex container width")
}
if (!/\.engineering-toggle\s*>\s*view\s*\{[^}]*display:\s*flex;[^}]*flex-direction:\s*column;[^}]*min-width:\s*0;/s.test(appWxss)) {
  throw new Error("bilingual engineering labels must use a stable vertical stack")
}
if (!/\.engineering-title\s*\{[^}]*line-height:\s*1\.25;/s.test(appWxss) ||
    !/\.engineering-en\s*\{[^}]*line-height:\s*1\.25;/s.test(appWxss)) {
  throw new Error("bilingual engineering labels need explicit line heights")
}
if (!/\.engineering-toggle\s*>\s*text:last-child\s*\{[^}]*flex:\s*0\s+0\s+auto;[^}]*line-height:\s*1;/s.test(appWxss)) {
  throw new Error("engineering disclosure arrows must keep a fixed, centered position")
}

const header = fs.readFileSync("components/app-header/index.wxml", "utf8")
if (!header.includes("safeTop") || !header.includes("subtitle")) throw new Error("header contract missing")

const headerWxss = fs.readFileSync("components/app-header/index.wxss", "utf8")
if (!/\.app-header__titles\s*\{[^}]*flex:\s*1/s.test(headerWxss)) {
  throw new Error("header title stack must occupy the remaining safe width")
}
if (!/\.app-header__title\s*\{[^}]*line-height:/s.test(headerWxss)) {
  throw new Error("header title needs an explicit line-height for visual alignment")
}

for (const stylesheet of ["pages/aptech/index.wxss", "packageFitting/pages/index.wxss"]) {
  const css = fs.readFileSync(stylesheet, "utf8")
  if (!/\.submit-row\s*\{[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s.test(css)) {
    throw new Error(`${stylesheet} must center the primary and reset actions in two equal, non-overflowing columns`)
  }
  if (!/\.summary-filters\s*\{[^}]*display:\s*grid;[^}]*grid-template-columns:\s*repeat\(2,\s*minmax\(0,\s*1fr\)\)/s.test(css)) {
    throw new Error(`${stylesheet} must present result filters as a two-column grid`)
  }
  if (!/\.summary-filter\s*\{[^}]*width:\s*100%;[^}]*min-height:\s*80rpx;[^}]*border-radius:\s*14rpx;/s.test(css)) {
    throw new Error(`${stylesheet} must use the shared rectangular result-filter geometry`)
  }
  if (!/\.copy-button\s*\{[^}]*min-height:\s*80rpx;/s.test(css)) {
    throw new Error(`${stylesheet} bulk copy actions must meet the shared touch target`)
  }
}

for (const stylesheet of [
  "packageFitting/pages/index.wxss",
  "pages/aptech/index.wxss",
  "pages/regulator/index.wxss",
  "pages/cv/index.wxss",
  "pages/compatibility/index.wxss"
]) {
  const css = fs.readFileSync(stylesheet, "utf8")
  if (!/\.example-button\s*\{[^}]*min-height:\s*80rpx[^}]*border-radius:\s*14rpx/s.test(css)) {
    throw new Error(`${stylesheet} must use the shared modern example-button geometry`)
  }
}

for (const stylesheet of [
  "pages/regulator/index.wxss",
  "pages/cv/index.wxss",
  "pages/compatibility/index.wxss"
]) {
  const css = fs.readFileSync(stylesheet, "utf8")
  if (!/\.reset-button\s*\{[^}]*min-height:\s*80rpx[^}]*border-radius:\s*14rpx/s.test(css)) {
    throw new Error(`${stylesheet} must use the shared modern standalone reset-button geometry`)
  }
}

for (const stylesheet of [
  "packageFitting/pages/index.wxss",
  "pages/aptech/index.wxss",
  "pages/regulator/index.wxss",
  "pages/cv/index.wxss",
  "pages/compatibility/index.wxss"
]) {
  const css = fs.readFileSync(stylesheet, "utf8")
  if (!/\.section-eyebrow(?:,\s*\n\.result-eyebrow)?\s*\{[^}]*font-size:\s*20rpx;/s.test(css)) {
    throw new Error(`${stylesheet} needs readable section labels`)
  }
  if (!/\.engineering-en\s*\{[^}]*color:\s*var\(--color-muted\);[^}]*font-size:\s*20rpx;/s.test(css)) {
    throw new Error(`${stylesheet} needs readable engineering subtitles`)
  }
}

for (const [stylesheet, cardSelector] of [
  ["packageFitting/pages/index.wxss", ".workspace-card"],
  ["pages/aptech/index.wxss", ".workspace-card"],
  ["pages/regulator/index.wxss", ".intro-card"],
  ["pages/cv/index.wxss", ".control-card"]
]) {
  const css = fs.readFileSync(stylesheet, "utf8")
  const escaped = cardSelector.replace(".", "\\.")
  if (!new RegExp(`${escaped}[\\s\\S]*?padding:\\s*24rpx;`).test(css) ||
      !new RegExp(`${escaped}[\\s\\S]*?margin-bottom:\\s*18rpx;`).test(css)) {
    throw new Error(`${stylesheet} must use the compact tool-card rhythm`)
  }
}

const aptechWxml = fs.readFileSync("pages/aptech/index.wxml", "utf8")
if (/tool-identity|APTech 专属工具/.test(aptechWxml)) {
  throw new Error("APTech workspace must not repeat identity already present in the page header")
}

const sheet = fs.readFileSync("components/option-sheet/index.wxml", "utf8")
if (!sheet.includes("searchable") || !sheet.includes('bindtap="selectOption"')) {
  throw new Error("searchable option sheet contract missing")
}

console.log("Shared UI contract passed")

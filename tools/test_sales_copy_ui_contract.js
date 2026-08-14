const fs = require("fs")
const path = require("path")

function findCopyableReviewButtons(markup) {
  const buttonElements = markup.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) || []
  return buttonElements.filter((button) => {
    const openingTagMatch = button.match(/^<button\b[^>]*>/)
    if (!openingTagMatch) return false

    const openingTag = openingTagMatch[0]
    const classMatch = openingTag.match(/\bclass="([^"]*)"/)
    const classes = classMatch ? classMatch[1].split(/\s+/) : []
    return classes.includes("mapping-card") &&
      classes.includes("mapping-card--warning") &&
      openingTag.includes('bindtap="copyVigourModel"')
  })
}

function findCopyableExactButtons(markup) {
  const buttonElements = markup.match(/<button\b[^>]*>[\s\S]*?<\/button>/g) || []
  return buttonElements.filter((button) => {
    const openingTagMatch = button.match(/^<button\b[^>]*>/)
    if (!openingTagMatch) return false

    const openingTag = openingTagMatch[0]
    const classMatch = openingTag.match(/\bclass="([^"]*)"/)
    const classes = classMatch ? classMatch[1].split(/\s+/) : []
    return classes.includes("mapping-card") &&
      !classes.includes("mapping-card--warning") &&
      openingTag.includes('bindtap="copyVigourModel"') &&
      openingTag.includes('data-review="false"')
  })
}

const wxml = fs.readFileSync(path.resolve("packageFitting/pages/index.wxml"), "utf8")
if (!wxml.includes("复制销售结果") || !wxml.includes('bindtap="copyBatchSales"')) {
  throw new Error("batch sales-copy action is not wired")
}
const reviewButtons = findCopyableReviewButtons(wxml)
const passiveReviewShape = `
  <button class="batch-submit" bindtap="runBatchValidation">提交</button>
  <view wx:if="{{candidate.salesNeedsConfirmation}}" class="mapping-card mapping-card--warning">待确认</view>
  <button wx:elif="{{candidate.copyAllowed}}" class="mapping-card" bindtap="copyVigourModel">复制</button>
`
const passiveReviewFalsePositives = findCopyableReviewButtons(passiveReviewShape)
if (passiveReviewFalsePositives.length !== 0) {
  throw new Error("review button matcher must not cross button boundaries around a passive warning view")
}
if (reviewButtons.length !== 2) {
  throw new Error(`both review result regions must use copyable warning buttons: ${reviewButtons.length}`)
}
for (const branch of [
  'wx:if="{{candidate.salesNeedsConfirmation && candidate.reviewCopyAllowed && candidate.displayVigourModel}}"',
  'wx:elif="{{item.salesNeedsConfirmation && item.reviewCopyAllowed && item.displayVigourModel}}"'
]) {
  if (!reviewButtons.some((button) => button.includes(branch))) {
    throw new Error(`review result branch is not a bounded copyable button: ${branch}`)
  }
}
if (!reviewButtons.every((button) => button.includes('data-review="true"') && button.includes("复制并核实"))) {
  throw new Error("review copy marker or action wording missing")
}
if (!wxml.includes('wx:elif="{{candidate.displayVigourModel}}"') || !wxml.includes("仅供核对")) {
  throw new Error("fuzzy candidates need a visible but non-copyable review card")
}
const exactButtons = findCopyableExactButtons(wxml)
const passiveExactShape = `
  <button class="batch-submit" bindtap="runBatchValidation">提交</button>
  <view class="mapping-card" data-review="false">精确型号</view>
  <button class="unrelated" bindtap="copyVigourModel">复制</button>
`
const passiveExactFalsePositives = findCopyableExactButtons(passiveExactShape)
if (passiveExactFalsePositives.length !== 0) {
  throw new Error("exact button matcher must not cross button boundaries around a passive mapping view")
}
if (exactButtons.length !== 2) {
  throw new Error(`both exact result regions must use copyable mapping buttons: ${exactButtons.length}`)
}
for (const branch of [
  'wx:elif="{{candidate.hasVigourModel && candidate.copyAllowed}}"',
  'wx:if="{{item.hasVigourModel && item.copyAllowed}}"'
]) {
  if (!exactButtons.some((button) => button.includes(branch))) {
    throw new Error(`exact result branch is not a copyable mapping button: ${branch}`)
  }
}

const wxss = fs.readFileSync(path.resolve("packageFitting/pages/index.wxss"), "utf8")
const warningRule = wxss.match(/\.mapping-card--warning\s*\{([^}]*)\}/s)
if (!warningRule || /\b(width|min-height|height|padding|display|flex-direction|align-items|justify-content)\s*:/.test(warningRule[1])) {
  throw new Error("warning mapping card must inherit the shared size skeleton")
}

console.log("Sales copy UI contract passed")

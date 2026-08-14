const fs = require("fs")
const path = require("path")

const ROOT = path.resolve(__dirname, "..")
const PACKAGE_LIMIT = 2 * 1024 * 1024
const SAFETY_MARGIN = 128 * 1024

function readJson(relativePath) {
  return JSON.parse(fs.readFileSync(path.join(ROOT, relativePath), "utf8"))
}

function normalize(relativePath) {
  return relativePath.split(path.sep).join("/")
}

function main() {
  const appConfig = readJson("app.json")
  const projectConfig = readJson("project.config.json")
  const subpackages = appConfig.subPackages || appConfig.subpackages || []
  const packages = [
    { name: "main", root: "" },
    ...subpackages.map((item) => ({
      name: item.name || item.root,
      root: item.root.replace(/\/$/, "")
    }))
  ]
  const ignoredRules = projectConfig.packOptions?.ignore || []
  const totals = Object.fromEntries(packages.map((item) => [item.name, { bytes: 0, files: 0 }]))

  function isIgnored(relativePath) {
    return ignoredRules.some((rule) => {
      if (rule.type === "folder") {
        return relativePath === rule.value || relativePath.startsWith(`${rule.value}/`)
      }
      if (rule.type === "file") return relativePath === rule.value
      if (rule.type === "suffix") return relativePath.endsWith(rule.value)
      return false
    })
  }

  function targetPackage(relativePath) {
    return packages
      .slice(1)
      .filter((item) => relativePath === item.root || relativePath.startsWith(`${item.root}/`))
      .sort((left, right) => right.root.length - left.root.length)[0] || packages[0]
  }

  function walk(relativeDirectory = "") {
    const absoluteDirectory = path.join(ROOT, relativeDirectory)
    for (const entry of fs.readdirSync(absoluteDirectory, { withFileTypes: true })) {
      const relativePath = normalize(path.join(relativeDirectory, entry.name))
      if (isIgnored(relativePath)) continue
      if (entry.isDirectory()) {
        walk(relativePath)
      } else if (entry.isFile()) {
        const packageInfo = targetPackage(relativePath)
        totals[packageInfo.name].bytes += fs.statSync(path.join(ROOT, relativePath)).size
        totals[packageInfo.name].files += 1
      }
    }
  }

  walk()

  let failed = false
  for (const packageInfo of packages) {
    const total = totals[packageInfo.name]
    const remaining = PACKAGE_LIMIT - total.bytes
    const status = remaining < 0 ? "OVER LIMIT" : remaining < SAFETY_MARGIN ? "LOW MARGIN" : "OK"
    if (remaining < 0) failed = true
    console.log(
      `${packageInfo.name.padEnd(16)} ${(total.bytes / 1024).toFixed(1).padStart(8)} KB` +
      `  ${String(total.files).padStart(3)} files  ${status}`
    )
  }

  if (failed) process.exitCode = 1
}

main()

const states = Object.create(null)

function clone(value) {
  return value === undefined ? undefined : JSON.parse(JSON.stringify(value))
}

function saveToolState(key, state) {
  states[key] = clone(state)
}

function readToolState(key) {
  return Object.prototype.hasOwnProperty.call(states, key) ? clone(states[key]) : null
}

function clearToolState(key) {
  delete states[key]
}

module.exports = { saveToolState, readToolState, clearToolState }

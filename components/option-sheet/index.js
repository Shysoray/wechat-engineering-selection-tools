Component({
  options: { styleIsolation: "apply-shared" },
  properties: {
    visible: { type: Boolean, value: false },
    title: { type: String, value: "" },
    options: { type: Array, value: [] },
    searchable: { type: Boolean, value: false }
  },
  data: { keyword: "", visibleOptions: [] },
  observers: {
    "options, keyword": function build(options, keyword) {
      const query = String(keyword || "").trim().toLowerCase()
      const visibleOptions = (options || []).map((option, originalIndex) => ({
        option,
        originalIndex,
        searchText: `${option.label || ""} ${option.value || ""}`.toLowerCase()
      })).filter((row) => !query || row.searchText.includes(query))
      this.setData({ visibleOptions })
    }
  },
  methods: {
    onSearch(event) {
      this.setData({ keyword: event.detail.value })
    },
    selectOption(event) {
      const row = this.data.visibleOptions[event.currentTarget.dataset.index]
      if (!row) return
      this.setData({ keyword: "" })
      this.triggerEvent("select", { index: row.originalIndex, option: row.option })
    },
    close() {
      this.setData({ keyword: "" })
      this.triggerEvent("close")
    },
    noop() {}
  }
})

const { classifyQuickModel } = require("../../utils/uiPresentation")

Page({
  data: {
    safeTop: 0,
    quickModel: "",
    pendingQuickModel: "",
    chooser: "",
    tools: [
      {
        id: "fitting",
        number: "01",
        eyebrow: "MOST USED",
        name: "管接头型号对标",
        english: "Fitting Cross Reference",
        desc: "跨品牌型号映射、批量校验与销售结果复制",
        image: "/assets/tools/fitting.png",
        featured: true,
        route: "/packageFitting/pages/index"
      },
      {
        id: "aptech",
        number: "02",
        name: "APTech 型号对标",
        english: "APTech Cross Reference",
        desc: "识别 AP / AZ 型号并给出 VIGOUR 候选",
        image: "/assets/tools/pressure-regulator-card.jpg",
        route: "/pages/aptech/index"
      },
      {
        id: "pressure-regulator",
        number: "03",
        name: "减压阀选型",
        english: "Regulator Selection",
        desc: "按压力、流量、介质与接口匹配系列",
        image: "/assets/tools/pressure-regulator-card.jpg",
        route: "/pages/regulator/index"
      },
      {
        id: "cv",
        number: "04",
        name: "Cv / 流量换算",
        english: "Flow Calculator",
        desc: "气体与液体工况的 Cv / Q 双向计算",
        image: "/assets/tools/valve-card.jpg",
        route: "/pages/cv/index"
      },
      {
        id: "compatibility",
        number: "05",
        name: "材质兼容性",
        english: "Material Compatibility",
        desc: "查询 MSDS 要点、危险等级与材料建议",
        image: "/assets/tools/accessory-card.jpg",
        route: "/pages/compatibility/index"
      }
    ]
  },

  onLoad() {
    const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
    this.setData({ safeTop: info.statusBarHeight || 0 })
  },

  onQuickInput(event) {
    this.setData({ quickModel: event.detail.value })
  },

  submitQuickModel() {
    const query = this.data.quickModel.trim()
    if (!query) {
      wx.showToast({ title: "请输入型号", icon: "none" })
      return
    }

    const kind = classifyQuickModel(query)
    if (kind === "ambiguous") {
      this.setData({ pendingQuickModel: query, chooser: "single" })
      return
    }
    this.navigateToModelTool(kind, query)
  },

  navigateToModelTool(kind, query) {
    const base = kind === "aptech" ? "/pages/aptech/index" : "/packageFitting/pages/index"
    wx.navigateTo({ url: `${base}?query=${encodeURIComponent(query)}&source=home` })
  },

  openBatchChooser() {
    this.setData({ chooser: "batch", pendingQuickModel: "" })
  },

  chooseModelTool(event) {
    const kind = event.currentTarget.dataset.kind
    const chooser = this.data.chooser
    const query = this.data.pendingQuickModel
    this.closeChooser()

    if (chooser === "batch") {
      const base = kind === "aptech" ? "/pages/aptech/index" : "/packageFitting/pages/index"
      wx.navigateTo({ url: `${base}?mode=batch&source=home` })
      return
    }

    this.navigateToModelTool(kind, query)
  },

  closeChooser() {
    this.setData({ chooser: "", pendingQuickModel: "" })
  },

  openTool(event) {
    const tool = this.data.tools.find((item) => item.id === event.currentTarget.dataset.id)
    if (!tool) return
    wx.navigateTo({ url: tool.route })
  },

  noop() {}
})

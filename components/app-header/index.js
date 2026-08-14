Component({
  options: { styleIsolation: "apply-shared" },
  properties: {
    title: { type: String, value: "" },
    subtitle: { type: String, value: "" },
    showBack: { type: Boolean, value: true }
  },
  data: { safeTop: 0 },
  lifetimes: {
    attached() {
      const info = wx.getWindowInfo ? wx.getWindowInfo() : wx.getSystemInfoSync()
      this.setData({ safeTop: info.statusBarHeight || 0 })
    }
  },
  methods: {
    goBack() {
      if (getCurrentPages().length > 1) wx.navigateBack()
      else wx.reLaunch({ url: "/pages/index/index" })
    }
  }
})

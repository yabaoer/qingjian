const app = getApp()
const API_BASE = 'https://qingjian.yh888.cn'
Page({
  data: {
    imageList: [],
    maxCount: 9,
    loggedIn: false,
    user: null,
    canUpload: false
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    this.checkLogin()
  },

  async checkLogin() {
    const openid = app.globalData.openid
    const token = app.globalData.token
    if (!openid) {
      this.setData({ loggedIn: false, user: null, canUpload: false })
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => { wx.navigateTo({ url: '../index/index' }) }, 500)
      return
    }
    this.setData({ loggedIn: true, user: { openid } })

    // 检查上传权限
    try {
      const res = await new Promise((resolve, reject) => {
        wx.request({
          url: `${API_BASE}/api/upload/check?openid=${openid}`,
          success: resolve,
          fail: reject
        })
      })
      if (res.data.success) {
        this.setData({ canUpload: res.data.data.canUpload })
      }
    } catch (e) {
      console.error('检查上传权限失败', e)
    }

    this.loadImages()
  },

  loadImages() {
    const list = wx.getStorageSync('albumImages') || []
    this.setData({ imageList: list })
  },

  chooseImage() {
    if (!this.data.canUpload) {
      wx.showToast({ title: '仅管理员可上传图片', icon: 'none' })
      return
    }
    const that = this
    const remain = this.data.maxCount - this.data.imageList.length
    if (remain <= 0) {
      wx.showToast({ title: '最多9张图片', icon: 'none' })
      return
    }
    wx.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success(res) {
        const newList = [...that.data.imageList, ...res.tempFilePaths]
        that.setData({ imageList: newList })
        wx.setStorageSync('albumImages', newList)
        wx.showToast({ title: '添加成功', icon: 'success' })
      }
    })
  },

  previewImage(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.imageList[index],
      urls: this.data.imageList
    })
  },

  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const list = [...this.data.imageList]
    list.splice(index, 1)
    this.setData({ imageList: list })
    wx.setStorageSync('albumImages', list)
    wx.showToast({ title: '已删除', icon: 'success' })
  },

  clearAll() {
    wx.showModal({
      title: '提示',
      content: '确定清空所有图片？',
      success(res) {
        if (res.confirm) {
          this.setData({ imageList: [] })
          wx.setStorageSync('albumImages', [])
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }.bind(this)
    })
  },

  logout() {
    app.clearUser()
    wx.showToast({ title: '已退出', icon: 'success' })
    setTimeout(() => { wx.navigateTo({ url: '../index/index' }) }, 800)
  }
})
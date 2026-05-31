// 获取应用实例
const app = getApp()
const API_BASE = 'https://qingjian.yh888.cn'
Page({
  data: {
    imageList: [],
    maxCount: 9,
    loggedIn: false,
    user: null
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    this.checkLogin()
  },

  checkLogin() {
    const openid = app.globalData.openid
    const token = app.globalData.token
    this.setData({ loggedIn: !!openid, user: openid ? { openid } : null })
    if (!openid) {
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => { wx.navigateTo({ url: '../index/index' }) }, 500)
    }
  },

  loadImages() {
    const list = wx.getStorageSync('albumImages') || []
    this.setData({ imageList: list })
  },

  chooseImage() {
    if (!this.data.loggedIn) {
      wx.navigateTo({ url: '../index/index' })
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
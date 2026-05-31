const app = getApp()
const UPLOAD_API = 'https://up.yh888.cn/upload'
const { get } = require('../../utils/request')

Page({
  data: {
    imageList: [],
    maxCount: 9,
    loggedIn: false,
    canUpload: false,
    uploading: false
  },

  onLoad() {
    this.checkLogin()
  },

  onShow() {
    this.checkLogin()
  },

  async checkLogin() {
    const openid = app.globalData.openid
    if (!openid) {
      this.setData({ loggedIn: false, canUpload: false })
      wx.showToast({ title: '请先登录', icon: 'none' })
      setTimeout(() => { wx.navigateTo({ url: '../index/index' }) }, 500)
      return
    }

    this.setData({ loggedIn: true })

    try {
      const res = await get('/api/upload/check', { openid })
      if (res.success) {
        this.setData({ canUpload: res.data.canUpload })
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

    const remain = this.data.maxCount - this.data.imageList.length
    if (remain <= 0) {
      wx.showToast({ title: '最多9张图片', icon: 'none' })
      return
    }

    wx.chooseImage({
      count: remain,
      sizeType: ['compressed'],
      sourceType: ['album', 'camera'],
      success: (res) => {
        const tempPaths = res.tempFilePaths
        wx.showLoading({ title: '上传中...', mask: true })
        this.uploadImages(tempPaths, 0, [])
      }
    })
  },

  uploadImages(tempPaths, index, uploadedUrls) {
    if (index >= tempPaths.length) {
      wx.hideLoading()
      if (uploadedUrls.length > 0) {
        const newList = [...this.data.imageList, ...uploadedUrls]
        this.setData({ imageList: newList })
        wx.setStorageSync('albumImages', newList)
        wx.showToast({ title: `上传成功${uploadedUrls.length}张`, icon: 'success' })
      }
      this.setData({ uploading: false })
      return
    }

    const filePath = tempPaths[index]
    wx.uploadFile({
      url: UPLOAD_API,
      filePath: filePath,
      name: 'file',
      success: (res) => {
        const data = JSON.parse(res.data)
        if (data.success) {
          uploadedUrls.push(data.data.url)
          this.uploadImages(tempPaths, index + 1, uploadedUrls)
        } else {
          wx.hideLoading()
          wx.showToast({ title: '上传失败', icon: 'none' })
        }
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '上传失败', icon: 'none' })
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
      success: (res) => {
        if (res.confirm) {
          this.setData({ imageList: [] })
          wx.setStorageSync('albumImages', [])
          wx.showToast({ title: '已清空', icon: 'success' })
        }
      }
    })
  },

  logout() {
    app.clearUser()
    wx.showToast({ title: '已退出', icon: 'success' })
    setTimeout(() => { wx.navigateTo({ url: '../index/index' }) }, 800)
  }
})
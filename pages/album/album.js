// 获取应用实例
const app = getApp()
Page({
  data: {
    imageList: [],
    maxCount: 9,
  },

  onLoad() {
    this.loadImages()
  },

  onShow() {
    this.loadImages()
  },

  // 从本地存储加载图片
  loadImages() {
    const list = wx.getStorageSync('albumImages') || []
    this.setData({ imageList: list })
  },

  // 选择图片
  chooseImage() {
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

  // 预览图片
  previewImage(e) {
    const index = e.currentTarget.dataset.index
    wx.previewImage({
      current: this.data.imageList[index],
      urls: this.data.imageList
    })
  },

  // 删除图片
  deleteImage(e) {
    const index = e.currentTarget.dataset.index
    const list = [...this.data.imageList]
    list.splice(index, 1)
    this.setData({ imageList: list })
    wx.setStorageSync('albumImages', list)
    wx.showToast({ title: '已删除', icon: 'success' })
  },

  // 清空相册
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
      }
    })
  },

  // 预览模式下长按删除
  longPressImage(e) {
    const index = e.currentTarget.dataset.index
    wx.showModal({
      title: '提示',
      content: '删除这张图片？',
      success(res) {
        if (res.confirm) {
          const list = [...this.data.imageList]
          list.splice(index, 1)
          this.setData({ imageList: list })
          wx.setStorageSync('albumImages', list)
          wx.showToast({ title: '已删除', icon: 'success' })
        }
      }
    })
  }
})
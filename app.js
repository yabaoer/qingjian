// app.js
App({
  globalData: {
    userInfo: null,
    openid: null,
    token: null
  },

  onLaunch() {
    const token = wx.getStorageSync('token')
    const openid = wx.getStorageSync('openid')
    if (token && openid) {
      this.globalData.token = token
      this.globalData.openid = openid
    }
  },

  saveUser(openid, token) {
    this.globalData.openid = openid
    this.globalData.token = token
    wx.setStorageSync('openid', openid)
    wx.setStorageSync('token', token)
  },

  clearUser() {
    this.globalData.openid = null
    this.globalData.token = null
    wx.removeStorageSync('openid')
    wx.removeStorageSync('token')
  }
})
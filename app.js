// app.js
App({
  globalData: {
    userInfo: null,
    openid: null,
    token: null
  },

  onLaunch() {
    // 检查本地存储的登录态
    const openid = wx.getStorageSync('openid');
    const token = wx.getStorageSync('token');
    if (openid && token) {
      this.globalData.openid = openid;
      this.globalData.token = token;
    }
  },

  saveUser(openid, token) {
    this.globalData.openid = openid;
    this.globalData.token = token;
    wx.setStorageSync('openid', openid);
    wx.setStorageSync('token', token);
  },

  clearUser() {
    this.globalData.openid = null;
    this.globalData.token = null;
    wx.removeStorageSync('openid');
    wx.removeStorageSync('token');
  }
})
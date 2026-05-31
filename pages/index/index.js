const app = getApp()
const { post } = require('../../utils/request')

Page({
  data: {},

  doLogin() {
    wx.showLoading({ title: '登录中...' })

    wx.login({
      success(loginRes) {
        if (!loginRes.code) {
          wx.hideLoading()
          wx.showToast({ title: '微信登录失败', icon: 'none' })
          return
        }

        post('/api/login', { code: loginRes.code })
          .then(res => {
            wx.hideLoading()
            app.saveUser(res.data.user.openid, res.data.token)
            wx.showToast({ title: '登录成功', icon: 'success' })
            setTimeout(() => {
              wx.switchTab({ url: '../album/album' })
            }, 800)
          })
          .catch(err => {
            wx.hideLoading()
            wx.showToast({ title: err.message || '登录失败', icon: 'none' })
          })
      },
      fail() {
        wx.hideLoading()
        wx.showToast({ title: '微信登录失败', icon: 'none' })
      }
    })
  }
})
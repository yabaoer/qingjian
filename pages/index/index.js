const app = getApp()
const { post } = require('../../utils/request')

Page({
  data: {},

  async doLogin() {
    wx.showLoading({ title: '登录中...', mask: true })

    wx.login({
      success: async (loginRes) => {
        if (!loginRes.code) {
          wx.hideLoading()
          wx.showToast({ title: '微信登录失败', icon: 'none' })
          return
        }

        post('/api/login', { code: loginRes.code })
          .then(res => {
            app.saveUser(res.data.user.openid, res.data.token)
            wx.showToast({ title: '登录成功', icon: 'success' })
            setTimeout(() => {
              wx.switchTab({ url: '../album/album' })
            }, 800)
          })
          .catch(err => {
            const msg = err.errMsg || err.message || '登录超时，请检查网络'
            wx.showToast({ title: msg, icon: 'none' })
          })
          .finally(() => {
            wx.hideLoading()
          })
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '微信登录拉起失败', icon: 'none' })
      }
    })
  }
})
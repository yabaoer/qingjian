const app = getApp()
const API_BASE = 'https://qingjian.yh888.cn'

Page({
  data: {

  },

  doLogin() {
    wx.showLoading({ title: '登录中...' })

    wx.login({
      success(loginRes) {
        if (!loginRes.code) {
          wx.hideLoading()
          wx.showToast({ title: '微信登录失败', icon: 'none' })
          return
        }

        wx.request({
          url: `${API_BASE}/api/login`,
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          data: { code: loginRes.code },
          success(res) {
            wx.hideLoading()
            const data = res.data
            if (data.success) {
              app.saveUser(data.data.user.openid, data.data.token)
              wx.showToast({ title: '登录成功', icon: 'success' })
              setTimeout(() => {
                wx.switchTab({ url: '../album/album' })
              }, 800)
            } else {
              wx.showToast({ title: data.message || '登录失败', icon: 'none' })
            }
          },
          fail(err) {
            wx.hideLoading()
            wx.showToast({ title: '网络错误', icon: 'none' })
            console.error('登录请求失败', err)
          }
        })
      },
      fail() {
        wx.hideLoading()
        wx.showToast({ title: '微信登录失败', icon: 'none' })
      }
    })
  }
})
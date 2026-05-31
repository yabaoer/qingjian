const app = getApp()
const API_BASE = 'https://qingjian.yh888.cn'

Page({
  data: {
    account: '',
    password: '',
    remember: false
  },

  onAccountInput(e) {
    this.setData({ account: e.detail.value })
  },

  onPasswordInput(e) {
    this.setData({ password: e.detail.value })
  },

  toggleRemember() {
    this.setData({ remember: !this.data.remember })
  },

  doLogin() {
    const { account, password } = this.data
    if (!account || !password) {
      wx.showToast({ title: '请输入账号密码', icon: 'none' })
      return
    }

    wx.showLoading({ title: '登录中...' })

    // 先通过微信 code 登录
    wx.login({
      success(loginRes) {
        if (!loginRes.code) {
          wx.hideLoading()
          wx.showToast({ title: '微信登录失败', icon: 'none' })
          return
        }

        // 调用后端登录接口
        wx.request({
          url: `${API_BASE}/api/login`,
          method: 'POST',
          header: { 'Content-Type': 'application/json' },
          data: { code: loginRes.code },
          success(res) {
            wx.hideLoading()
            const data = res.data
            if (data.success) {
              // 保存登录态
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
  },

  goRegister() {
    wx.showToast({ title: '注册功能开发中', icon: 'none' })
  }
})
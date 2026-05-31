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
    if (!account) {
      wx.showToast({ title: '请输入账号', icon: 'none' })
      return
    }
    if (!password) {
      wx.showToast({ title: '请输入密码', icon: 'none' })
      return
    }
    // 模拟登录成功，跳转相册
    wx.showToast({ title: '登录成功', icon: 'success' })
    setTimeout(() => {
      wx.switchTab({ url: '../album/album' })
    }, 800)
  },

  goRegister() {
    wx.showToast({ title: '注册功能开发中', icon: 'none' })
  }
})
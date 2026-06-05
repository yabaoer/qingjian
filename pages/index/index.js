const app = getApp()
const { post } = require('../../utils/request')

Page({
  data: {
    nickname: '',
    avatarUrl: '',
    submitting: false,
    canSubmit: false
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value }, this._recompute)
  },

  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    if (!avatarUrl) return
    this.setData({ avatarUrl }, this._recompute)
  },

  _recompute() {
    this.setData({
      canSubmit: !!(this.data.avatarUrl && this.data.nickname && !this.data.submitting)
    })
  },

  // 拿一个新鲜的微信 code（每次提交时都重拿，避免 5 分钟过期）
  freshWxCode() {
    return new Promise((resolve) => {
      wx.login({
        success: (res) => resolve(res.code || ''),
        fail: () => resolve('')
      })
    })
  },

  async onSubmit() {
    if (this.data.submitting) return
    if (!this.data.avatarUrl || !this.data.nickname) {
      wx.showToast({ title: '请先选头像和昵称', icon: 'none' })
      return
    }
    this.setData({ submitting: true, canSubmit: false })
    wx.showLoading({ title: '登录中...', mask: true })

    try {
      const code = await this.freshWxCode()
      if (!code) throw new Error('微信登录拉起失败')

      const loginRes = await post('/api/login', { code })
      const { token, user } = loginRes.data
      const openid = user.openid
      app.saveUser(openid, token)

      await post('/api/user/update', {
        openid,
        nickname: this.data.nickname,
        avatar:   this.data.avatarUrl
      })

      app.globalData.userInfo = {
        nickname: this.data.nickname,
        avatar:   this.data.avatarUrl
      }
      wx.setStorageSync('userInfo', app.globalData.userInfo)

      wx.hideLoading()
      wx.showToast({ title: '登录成功', icon: 'success' })
      setTimeout(() => {
        wx.navigateTo({ url: '/pages/album/album' })
      }, 800)
    } catch (err) {
      wx.hideLoading()
      const msg = (err && err.message) || (err && err.errMsg) || '登录失败，请重试'
      wx.showToast({ title: msg, icon: 'none' })
    } finally {
      this.setData({ submitting: false })
      this._recompute()
    }
  }
})

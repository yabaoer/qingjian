const app = getApp()
const { post } = require('../../utils/request')

const UPLOAD_API = 'https://qingjian.yh888.cn/upload'

Page({
  data: {
    nickname: '',
    avatarUrl: '',
    submitting: false,
    canSubmit: false,
    uploadingAvatar: false
  },

  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value }, this._recompute)
  },

  // wx.chooseAvatar 触发：拿到微信临时 URL，立刻转存到自己 COS
  async onChooseAvatar(e) {
    const tempUrl = e.detail.avatarUrl
    if (!tempUrl) return
    if (this.data.uploadingAvatar) return

    this.setData({ uploadingAvatar: true })
    wx.showLoading({ title: '头像上传中...', mask: true })

    try {
      // 拿 openid（先 wx.login）
      const openid = await this._ensureOpenid()
      if (!openid) throw new Error('未登录')

      // 把微信临时 URL 传到自己的 /upload → COS
      const cosUrl = await this._uploadAvatar(tempUrl, openid)
      this.setData({ avatarUrl: cosUrl }, this._recompute)
      wx.hideLoading()
      wx.showToast({ title: '头像已保存', icon: 'success' })
    } catch (err) {
      wx.hideLoading()
      const msg = (err && err.message) || (err && err.errMsg) || '头像上传失败'
      wx.showToast({ title: msg, icon: 'none' })
    } finally {
      this.setData({ uploadingAvatar: false })
    }
  },

  // 拿 openid（先 wx.login → /api/login）
  async _ensureOpenid() {
    let openid = app.globalData.openid
    if (openid) return openid

    const code = await this.freshWxCode()
    if (!code) return ''
    try {
      const res = await post('/api/login', { code })
      const { token, user } = res.data
      app.saveUser(user.openid, token)
      return user.openid
    } catch (e) {
      return ''
    }
  },

  // 把微信临时头像传到自己 /upload，返回 COS 永久 URL
  _uploadAvatar(filePath, openid) {
    return new Promise((resolve, reject) => {
      wx.uploadFile({
        url: UPLOAD_API,
        filePath: filePath,
        name: 'file',
        formData: { openid: openid, kind: 'avatar' },
        success: (res) => {
          try {
            const data = typeof res.data === 'string' ? JSON.parse(res.data) : res.data
            if (data && data.success && data.data && data.data.url) {
              resolve(data.data.url)
            } else {
              reject(new Error((data && data.message) || '上传失败'))
            }
          } catch (e) {
            reject(new Error('响应解析失败'))
          }
        },
        fail: (err) => reject(new Error(err.errMsg || '网络错误'))
      })
    })
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

      // avatarUrl 已经是 COS 永久 URL，直接传后端
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

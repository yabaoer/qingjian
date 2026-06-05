const app = getApp()
const { post } = require('../../utils/request')

Page({
  data: {
    // 微信昵称 + 头像
    nickname: '',
    avatarUrl: '',
    // 省市区（picker mode=region）
    region: ['', '', ''],
    regionText: '请选择省/市/区',
    // 步骤状态
    step: 1,             // 1=待授权, 2=已授权待选地区, 3=已选待登录
    submitting: false
  },

  onShow() {
    // 每次回到页面，根据已有数据重算 step
    this.recomputeStep()
  },

  recomputeStep() {
    const { nickname, avatarUrl, region } = this.data
    const hasProfile = !!(nickname && avatarUrl)
    const hasRegion  = !!(region[0] && region[1] && region[2])
    const step = hasProfile && hasRegion ? 3 : (hasProfile ? 2 : 1)
    this.setData({ step })
  },

  // 步骤 1：button 触发 wx.getUserProfile + wx.login
  onWxLogin() {
    if (this.data.submitting) return
    wx.showLoading({ title: '拉起授权...', mask: true })

    // 先 wx.login 拿 code（其实 getUserProfile 流程不需要 code，但后面要传给后端换 openid）
    wx.login({
      success: (loginRes) => {
        if (!loginRes.code) {
          wx.hideLoading()
          wx.showToast({ title: '微信登录失败', icon: 'none' })
          return
        }
        // 再调 getUserProfile 拿用户信息（必须在 button click 回调里）
        wx.getUserProfile({
          desc: '用于完善资料',
          lang: 'zh_CN',
          success: (profileRes) => {
            wx.hideLoading()
            const ui = profileRes.userInfo || {}
            this.setData({
              nickname:  ui.nickName  || '',
              avatarUrl: ui.avatarUrl || '',
            })
            wx.setStorageSync('wxCode', loginRes.code) // 留着后面登录用
            this.recomputeStep()
            wx.showToast({ title: '已获取微信信息，请选择地区', icon: 'none' })
          },
          fail: () => {
            wx.hideLoading()
            wx.showToast({ title: '已取消授权', icon: 'none' })
          }
        })
      },
      fail: () => {
        wx.hideLoading()
        wx.showToast({ title: '微信登录拉起失败', icon: 'none' })
      }
    })
  },

  // 步骤 2：picker mode=region 选省市区
  onRegionChange(e) {
    const val = e.detail.value || []
    if (val.length < 3) return
    this.setData({
      region: val,
      regionText: val.join(' / ')
    })
    this.recomputeStep()
  },

  // 步骤 3：把昵称/头像/省市区提交到后端
  async onSubmit() {
    if (this.data.submitting) return
    if (this.data.step !== 3) {
      wx.showToast({ title: '请先完成微信授权和地区选择', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    wx.showLoading({ title: '登录中...', mask: true })

    try {
      const code = wx.getStorageSync('wxCode')
      if (!code) throw new Error('缺少微信 code，请重新授权')

      // 1) 调后端换 openid + token
      const loginRes = await post('/api/login', { code })
      const { token, user } = loginRes.data
      const openid = user.openid
      app.saveUser(openid, token)

      // 2) 把昵称/头像/省市区写到后端
      await post('/api/user/update', {
        openid,
        nickname: this.data.nickname,
        avatar:   this.data.avatarUrl,
        region:   this.data.region.join('-')   // "广东-广州-天河区"
      })

      // 3) 缓存到 app 全局 + 本地
      app.globalData.userInfo = {
        nickname: this.data.nickname,
        avatar:   this.data.avatarUrl,
        region:   this.data.region
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
    }
  }
})

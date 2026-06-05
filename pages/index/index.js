const app = getApp()
const { post } = require('../../utils/request')

Page({
  data: {
    // 用户资料（来自 chooseAvatar + picker）
    nickname: '',
    avatarUrl: '',
    // 省市区（picker mode=region）
    region: ['', '', ''],
    regionText: '请选择省/市/区',
    // 步骤状态
    step: 1,             // 1=待选头像+填昵称, 2=待选地区, 3=待登录
    submitting: false
  },

  onShow() {
    this.recomputeStep()
  },

  recomputeStep() {
    const { nickname, avatarUrl, region } = this.data
    const hasProfile = !!(nickname && avatarUrl)
    const hasRegion  = !!(region[0] && region[1] && region[2])
    const step = hasProfile && hasRegion ? 3 : (hasProfile ? 2 : 1)
    this.setData({ step })
  },

  // 步骤 1：button open-type="chooseAvatar" 触发
  // 弹微信"换头像"面板，用户选头像 + 填昵称
  onChooseAvatar(e) {
    const { avatarUrl } = e.detail
    if (!avatarUrl) {
      wx.showToast({ title: '未选择头像', icon: 'none' })
      return
    }
    this.setData({ avatarUrl })

    // chooseAvatar 在用户选完头像后，微信 UI 会自动让用户填昵称
    // 但拿不到 nickName 字段，需要用户在小程序内手动填一个 input
    // 提示用户去下面填昵称
    wx.showToast({ title: '请在下方填写昵称', icon: 'none' })
  },

  // 昵称 input 双向绑定
  onNicknameInput(e) {
    this.setData({ nickname: e.detail.value })
    this.recomputeStep()
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
      wx.showToast({ title: '请先完成头像昵称和地区选择', icon: 'none' })
      return
    }
    this.setData({ submitting: true })
    wx.showLoading({ title: '登录中...', mask: true })

    try {
      const code = wx.getStorageSync('wxCode')
      if (!code) throw new Error('缺少微信 code，请重新进入')

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
        region:   this.data.region.join('-')
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

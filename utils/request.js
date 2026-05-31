const app = getApp()
const API_BASE = 'https://qingjian.yh888.cn'

/**
 * 通用请求封装
 * @param {String} url 接口路径，如 /user/login
 * @param {Object} data 请求参数
 * @param {String} method GET/POST/PUT/DELETE
 * @param {Object} customHeader 自定义请求头
 * @returns Promise
 */
function request(url, data = {}, method = 'GET', customHeader = {}) {
  // 读取本地token登录凭证
  const token = wx.getStorageSync('token')
  // 默认请求头
  let header = {
    'Content-Type': 'application/json; charset=utf-8',
    ...customHeader
  }
  // 携带token
  if (token) {
    header.Authorization = `Bearer ${token}`
  }

  // 拼接完整接口地址
  const fullUrl = API_BASE + url

  return new Promise((resolve, reject) => {
    wx.showLoading({ title: '加载中', mask: true })
    wx.request({
      url: fullUrl,
      data,
      method,
      header,
      timeout: 12000,
      success: (res) => {
        wx.hideLoading()
        // 状态码200正常返回数据
        if (res.statusCode === 200) {
          // 后端统一返回体处理
          if (res.data.code === 0 || res.data.success) {
            resolve(res.data)
          } else {
            wx.showToast({ title: res.data.message || '请求失败', icon: 'none' })
            reject(res.data)
          }
        } else if (res.statusCode === 401) {
          // 未登录/登录过期，清空token跳转登录页
          app.clearUser()
          wx.showModal({
            title: '登录失效',
            content: '请重新登录',
            showCancel: false,
            success() {
              wx.navigateTo({ url: '/pages/index/index' })
            }
          })
          reject(res)
        } else {
          wx.showToast({ title: `服务器错误${res.statusCode}`, icon: 'none' })
          reject(res)
        }
      },
      fail: (err) => {
        wx.hideLoading()
        wx.showToast({ title: '网络请求失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

// 快捷请求方法
const get = (url, data) => request(url, data, 'GET')
const post = (url, data) => request(url, data, 'POST')
const put = (url, data) => request(url, data, 'PUT')
const del = (url, data) => request(url, data, 'DELETE')

module.exports = {
  request,
  get,
  post,
  put,
  del,
  API_BASE
}
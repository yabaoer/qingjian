const app = getApp()
const API_BASE = 'https://qingjian.yh888.cn'

/**
 * 通用请求封装
 * @param {String} url 接口路径
 * @param {Object} options { data, method, customHeader }
 * @returns Promise
 */
function request(url, options = {}) {
  const { data = {}, method = 'GET', customHeader = {} } = options

  const token = wx.getStorageSync('token')
  let header = {
    'Content-Type': 'application/json; charset=utf-8',
    ...customHeader
  }
  if (token) {
    header.Authorization = `Bearer ${token}`
  }

  return new Promise((resolve, reject) => {
    wx.request({
      url: API_BASE + url,
      data,
      method,
      header,
      timeout: 15000,
      success: (res) => {
        if (res.statusCode === 200) {
          if (res.data.success) {
            resolve(res.data)
          } else {
            wx.showToast({ title: res.data.message || '请求失败', icon: 'none' })
            reject(res.data)
          }
        } else if (res.statusCode === 401) {
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
        wx.showToast({ title: '网络请求失败', icon: 'none' })
        reject(err)
      }
    })
  })
}

const get = (url, data) => request(url, { method: 'GET', data })
const post = (url, data) => request(url, { method: 'POST', data })
const put = (url, data) => request(url, { method: 'PUT', data })
const del = (url, data) => request(url, { method: 'DELETE', data })

module.exports = {
  request, get, post, put, del, API_BASE
}
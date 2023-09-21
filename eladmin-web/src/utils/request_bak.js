import axios from 'axios'
import router from '@/router/routers'
import { Notification } from 'element-ui'
import store from '../store'
import { getToken } from '@/utils/auth'
import Config from '@/settings'
import Cookies from 'js-cookie'

// 创建axios实例
const service = axios.create({
  baseURL: process.env.NODE_ENV === 'production' ? process.env.VUE_APP_BASE_API : '/', // api 的 base_url
  timeout: Config.timeout // 请求超时时间
})

// request拦截器
service.interceptors.request.use(
  config => {
    if (getToken()) {
      config.headers['Authorization'] = getToken() // 让每个请求携带自定义token 请根据实际情况自行修改
    }
    config.headers['Content-Type'] = 'application/json'
    return config
  },
  error => {
    Promise.reject(error)
  }
)

// response 拦截器
service.interceptors.response.use(

  response => {
    const res = response.data
    if (res.code !== undefined && res.code !== 200) {
      Notification.error({
        title: res.message || 'Error',
        duration: 5000
      })
      if (res.code === 401) {
        store.dispatch('LogOut').then(() => {
          // 用户登录界面提示
          Cookies.set('point', 401)
          location.reload()
        })
      } else if (res.code === 403) {
        router.push({ path: '/401' })
      }
    }
    if (res.code === 200) {
      return res.data
    }
    return res
  },
  // onRejected 方法在 onFulfilled 执行错误后执行，接收 onFulfilled 执行后的错误对象。
  error => {
    // 兼容blob下载出错json提示
    if (error.response.data instanceof Blob && error.response.data.type.toLowerCase().indexOf('json') !== -1) {
      const reader = new FileReader()
      reader.readAsText(error.response.data, 'utf-8')
      reader.onload = function(e) {
        const errorMsg = JSON.parse(reader.result).message
        Notification.error({
          title: errorMsg,
          duration: 5000
        })
      }
    } else {
      console.log('response error:', error) // for debug
      Notification.error({
        title: error.message,
        duration: 5000
      })
    }
    return Promise.reject(error)
  }
)
export default service

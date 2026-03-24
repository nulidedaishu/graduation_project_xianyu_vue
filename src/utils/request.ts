import axios, { type AxiosInstance, type AxiosRequestConfig, type AxiosResponse } from 'axios'
import { ElMessage } from 'element-plus'
import type { ApiResponse } from '@/types/api'

// 创建 axios 实例
const instance: AxiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || '',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
})

// 请求队列（用于取消重复请求）
const pendingMap = new Map<string, AbortController>()

// 生成请求key
const getRequestKey = (config: AxiosRequestConfig): string => {
  // 对购物车GET请求添加时间戳，避免重复请求取消
  // 购物车GET请求是幂等操作，不应被取消
  const isCartGetRequest = config.method?.toLowerCase() === 'get' &&
                         config.url?.includes('/api/cart')

  if (isCartGetRequest) {
    // 添加时间戳使每个请求key唯一
    return `${config.method}_${config.url}_${Date.now()}`
  }

  // 未读数请求使用不同key，避免被取消
  const isUnreadRequest = config.url?.includes('/unread-count') ||
                         config.url?.includes('/unread')

  if (isUnreadRequest) {
    return `${config.method}_${config.url}_${Date.now()}`
  }

  return `${config.method}_${config.url}_${JSON.stringify(config.params)}_${JSON.stringify(config.data)}`
}

// 添加请求到队列
const addPending = (config: AxiosRequestConfig): void => {
  const key = getRequestKey(config)
  const controller = new AbortController()
  config.signal = controller.signal
  pendingMap.set(key, controller)
}

// 移除请求队列
const removePending = (config: AxiosRequestConfig): void => {
  const key = getRequestKey(config)
  if (pendingMap.has(key)) {
    const controller = pendingMap.get(key)
    controller?.abort()
    pendingMap.delete(key)
  }
}

// 请求拦截器
instance.interceptors.request.use(
  config => {
    // 移除重复请求
    removePending(config)
    addPending(config)

    // 添加 token (根据请求路径判断使用用户token还是管理员token)
    const isAdminPath = config.url?.startsWith('/api/admin') || config.url?.startsWith('/api/products/pending')
    const token = isAdminPath
      ? localStorage.getItem('adminToken')
      : localStorage.getItem('token')
    if (token && config.headers) {
      config.headers.Authorization = token
    }

    return config
  },
  error => {
    return Promise.reject(error)
  }
)

// 响应拦截器
instance.interceptors.response.use(
  (response: AxiosResponse<ApiResponse>) => {
    // 从队列中移除
    removePending(response.config)

    const res = response.data

    // 业务成功
    if (res.code === 200) {
      return res.data
    }

    // 业务错误
    ElMessage.error(res.message || '请求失败')

    // 401 未登录
    if (res.code === 401) {
      const isAdminPath = response.config.url?.startsWith('/api/admin') || response.config.url?.startsWith('/api/products/pending')
      if (isAdminPath) {
        localStorage.removeItem('adminToken')
        setTimeout(() => {
          window.location.href = '/admin/login'
        }, 1500)
      } else {
        localStorage.removeItem('token')
        localStorage.removeItem('userInfo')
        setTimeout(() => {
          window.location.href = '/login'
        }, 1500)
      }
    }

    return Promise.reject(new Error(res.message || '请求失败'))
  },
  error => {
    // 从队列中移除
    if (error.config) {
      removePending(error.config)
    }

    // 取消请求不报错
    if (error.name === 'CanceledError') {
      return Promise.reject(error)
    }

    // 网络错误
    if (error.message === 'Network Error') {
      ElMessage.error('网络连接失败，请检查网络')
    } else if (error.code === 'ECONNABORTED') {
      ElMessage.error('请求超时，请稍后重试')
    } else {
      // 检查是否有后端返回的错误消息
      let errorMessage = error.message || '网络错误'
      if (error.response && error.response.data) {
        const responseData = error.response.data
        // 如果后端返回了 message 字段，使用它
        if (responseData.message && typeof responseData.message === 'string') {
          errorMessage = responseData.message
        }
      }
      // 更新 error 对象的 message，以便调用方可以获取正确的错误信息
      error.message = errorMessage
      ElMessage.error(errorMessage)
    }

    return Promise.reject(error)
  }
)

// 封装请求方法
const request = {
  get: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return instance.get(url, config) as Promise<T>
  },
  post: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return instance.post(url, data, config) as Promise<T>
  },
  put: <T = any>(url: string, data?: any, config?: AxiosRequestConfig): Promise<T> => {
    return instance.put(url, data, config) as Promise<T>
  },
  delete: <T = any>(url: string, config?: AxiosRequestConfig): Promise<T> => {
    return instance.delete(url, config) as Promise<T>
  },
}

export default request

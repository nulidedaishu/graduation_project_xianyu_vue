import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores'
import type { MessagePushEvent } from '@/types/api'

/**
 * 消息推送配置选项
 */
export interface MessagePushOptions {
  /** 收到消息时的回调 */
  onMessage?: (event: MessagePushEvent) => void
  /** 连接成功时的回调 */
  onConnect?: () => void
  /** 断开连接时的回调 */
  onDisconnect?: () => void
  /** 连接错误时的回调 */
  onError?: (error: Error) => void
}

/**
 * 消息推送 Composable
 * 使用 SSE (Server-Sent Events) 进行实时消息推送
 */
export function useMessagePush(options: MessagePushOptions = {}) {
  const userStore = useUserStore()

  // 连接状态
  const isConnected = ref(false)
  const lastError = ref<string | null>(null)

  // EventSource 实例
  let eventSource: EventSource | null = null
  // 消息回调列表
  const messageCallbacks: ((event: MessagePushEvent) => void)[] = []

  /**
   * 创建 SSE 连接
   */
  function createConnection(): EventSource | null {
    const token = localStorage.getItem('token')
    if (!token) {
      console.warn('[MessagePush] 用户未登录，无法建立 SSE 连接')
      return null
    }

    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    const url = `${baseUrl}/api/sse/connect?token=${encodeURIComponent(token)}`

    const es = new EventSource(url)

    es.onopen = () => {
      console.log('[MessagePush] SSE 连接成功')
      isConnected.value = true
      lastError.value = null
      options.onConnect?.()
    }

    es.onmessage = (event) => {
      try {
        const data: MessagePushEvent = JSON.parse(event.data)
        // 触发所有注册的回调
        messageCallbacks.forEach((cb) => cb(data))
        options.onMessage?.(data)
      } catch (err) {
        console.error('[MessagePush] 解析消息失败:', err)
      }
    }

    es.onerror = (error) => {
      console.error('[MessagePush] SSE 连接错误:', error)
      isConnected.value = false
      lastError.value = '连接失败'
      options.onError?.(new Error('SSE connection failed'))

      // 自动重连：3秒后尝试重新连接
      setTimeout(() => {
        if (userStore.isLoggedIn && !isConnected.value) {
          console.log('[MessagePush] 尝试重新连接...')
          disconnect()
          connect()
        }
      }, 3000)
    }

    return es
  }

  /**
   * 建立 SSE 连接
   */
  function connect() {
    if (!userStore.isLoggedIn) {
      console.warn('[MessagePush] 用户未登录，无法建立连接')
      return
    }

    if (eventSource?.readyState === EventSource.OPEN) {
      console.log('[MessagePush] SSE 已经连接')
      return
    }

    // 关闭旧连接
    disconnect()

    eventSource = createConnection()
  }

  /**
   * 断开 SSE 连接
   */
  function disconnect() {
    if (eventSource) {
      eventSource.close()
      eventSource = null
      isConnected.value = false
      options.onDisconnect?.()
    }
  }

  /**
   * 注册消息监听回调
   */
  function onMessage(callback: (event: MessagePushEvent) => void) {
    messageCallbacks.push(callback)
  }

  /**
   * 移除消息监听回调
   */
  function offMessage(callback: (event: MessagePushEvent) => void) {
    const index = messageCallbacks.indexOf(callback)
    if (index > -1) {
      messageCallbacks.splice(index, 1)
    }
  }

  // 组件卸载时自动断开连接
  onUnmounted(() => {
    disconnect()
  })

  return {
    isConnected,
    lastError,
    connect,
    disconnect,
    onMessage,
    offMessage,
  }
}

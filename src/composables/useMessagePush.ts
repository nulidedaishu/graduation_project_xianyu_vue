import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/stores'
import type { MessagePushEvent } from '@/types/api'

/**
 * SSE消息推送Composable
 * 管理SSE连接、重连机制和消息监听
 */
export function useMessagePush() {
  const userStore = useUserStore()

  // 连接状态
  const isConnected = ref(false)
  const isConnecting = ref(false)
  const lastError = ref<string | null>(null)

  // 内部状态
  let eventSource: EventSource | null = null
  let reconnectTimer: ReturnType<typeof setTimeout> | null = null
  let heartbeatTimer: ReturnType<typeof setTimeout> | null = null
  let messageHandlers: ((event: MessagePushEvent) => void)[] = []

  // 重连配置
  let reconnectAttempts = 0
  const maxReconnectDelay = 30000 // 最大30秒
  const heartbeatTimeout = 60000 // 心跳超时60秒
  let lastHeartbeatTime = Date.now()

  /**
   * 计算重连延迟（指数退避）
   */
  function getReconnectDelay(): number {
    const delay = Math.min(1000 * Math.pow(2, reconnectAttempts), maxReconnectDelay)
    reconnectAttempts++
    return delay
  }

  /**
   * 建立SSE连接
   */
  function connect() {
    if (!userStore.isLoggedIn) {
      console.warn('用户未登录，无法建立SSE连接')
      return
    }

    if (isConnecting.value || eventSource) {
      return
    }

    isConnecting.value = true
    lastError.value = null

    try {
      // 使用EventSource建立连接
      // withCredentials: true 允许发送cookie进行身份验证
      // 同时也在URL中传递token作为备选认证方式
      const baseUrl = import.meta.env.VITE_API_BASE_URL || ''
      const token = localStorage.getItem('token') || ''
      const url = `${baseUrl}/api/messages/stream?token=${encodeURIComponent(token)}`

      eventSource = new EventSource(url, {
        withCredentials: true,
      })

      // 连接建立
      eventSource.onopen = () => {
        console.log('SSE连接已建立')
        isConnected.value = true
        isConnecting.value = false
        reconnectAttempts = 0
        lastHeartbeatTime = Date.now()
        startHeartbeatCheck()
      }

      // 接收消息
      eventSource.onmessage = (event) => {
        try {
          const data: MessagePushEvent = JSON.parse(event.data)

          // 更新心跳时间
          lastHeartbeatTime = Date.now()

          // 处理ping消息
          if (data.eventType === 'ping') {
            return
          }

          // 分发消息给所有处理器
          messageHandlers.forEach((handler) => {
            try {
              handler(data)
            } catch (err) {
              console.error('消息处理器执行失败:', err)
            }
          })
        } catch (err) {
          console.error('解析SSE消息失败:', err)
        }
      }

      // 处理特定事件类型
      eventSource.addEventListener('chat', (event) => {
        handleEventData(event.data)
      })

      eventSource.addEventListener('notice', (event) => {
        handleEventData(event.data)
      })

      eventSource.addEventListener('order', (event) => {
        handleEventData(event.data)
      })

      eventSource.addEventListener('system', (event) => {
        handleEventData(event.data)
      })

      eventSource.addEventListener('ping', () => {
        lastHeartbeatTime = Date.now()
      })

      // 连接错误
      eventSource.onerror = (error) => {
        console.error('SSE连接错误:', error)
        isConnected.value = false
        isConnecting.value = false
        lastError.value = '连接失败'

        // 关闭当前连接
        disconnect()

        // 触发重连
        scheduleReconnect()
      }
    } catch (err) {
      console.error('创建SSE连接失败:', err)
      isConnecting.value = false
      lastError.value = '创建连接失败'
      scheduleReconnect()
    }
  }

  /**
   * 处理事件数据
   */
  function handleEventData(data: string) {
    try {
      const eventData: MessagePushEvent = JSON.parse(data)
      messageHandlers.forEach((handler) => {
        try {
          handler(eventData)
        } catch (err) {
          console.error('消息处理器执行失败:', err)
        }
      })
    } catch (err) {
      console.error('解析事件数据失败:', err)
    }
  }

  /**
   * 断开SSE连接
   */
  function disconnect() {
    // 清除重连定时器
    if (reconnectTimer) {
      clearTimeout(reconnectTimer)
      reconnectTimer = null
    }

    // 清除心跳检查定时器
    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer)
      heartbeatTimer = null
    }

    // 关闭EventSource
    if (eventSource) {
      eventSource.close()
      eventSource = null
    }

    isConnected.value = false
    isConnecting.value = false
  }

  /**
   * 计划重连
   */
  function scheduleReconnect() {
    if (reconnectTimer) return

    const delay = getReconnectDelay()
    console.log(`计划${delay}ms后重连`)

    reconnectTimer = setTimeout(() => {
      reconnectTimer = null
      connect()
    }, delay)
  }

  /**
   * 启动心跳检测
   */
  function startHeartbeatCheck() {
    if (heartbeatTimer) {
      clearTimeout(heartbeatTimer)
    }

    const checkHeartbeat = () => {
      const now = Date.now()
      const elapsed = now - lastHeartbeatTime

      // 如果超过心跳超时时间没有收到消息，认为连接已断开
      if (elapsed > heartbeatTimeout) {
        console.warn('心跳超时，连接可能已断开')
        isConnected.value = false
        disconnect()
        scheduleReconnect()
        return
      }

      heartbeatTimer = setTimeout(checkHeartbeat, 10000) // 每10秒检查一次
    }

    heartbeatTimer = setTimeout(checkHeartbeat, 10000)
  }

  /**
   * 注册消息处理器
   */
  function onMessage(handler: (event: MessagePushEvent) => void) {
    messageHandlers.push(handler)

    // 返回取消注册函数
    return () => {
      const index = messageHandlers.indexOf(handler)
      if (index > -1) {
        messageHandlers.splice(index, 1)
      }
    }
  }

  /**
   * 手动重连
   */
  function reconnect() {
    disconnect()
    reconnectAttempts = 0
    connect()
  }

  // 页面卸载时断开连接
  onUnmounted(() => {
    disconnect()
  })

  return {
    // 状态
    isConnected,
    isConnecting,
    lastError,

    // 方法
    connect,
    disconnect,
    onMessage,
    reconnect,
  }
}

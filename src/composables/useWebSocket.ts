import { ref, onMounted, onUnmounted } from 'vue'
import { Client, IMessage, StompSubscription } from '@stomp/stompjs'
import { useUserStore } from '@/stores'
import type { ChatMessage } from '@/types/api'

/**
 * WebSocket 连接状态
 */
export type ConnectionStatus = 'disconnected' | 'connecting' | 'connected' | 'error'

/**
 * WebSocket 配置选项
 */
export interface WebSocketOptions {
  /** 收到消息时的回调 */
  onMessage?: (message: ChatMessage) => void
  /** 连接成功时的回调 */
  onConnect?: () => void
  /** 断开连接时的回调 */
  onDisconnect?: () => void
  /** 连接错误时的回调 */
  onError?: (error: Error) => void
}

/**
 * WebSocket Composable
 * 使用 STOMP over WebSocket 进行实时消息通信
 */
export function useWebSocket(options: WebSocketOptions = {}) {
  const userStore = useUserStore()

  // 连接状态（内部使用，不暴露给UI）
  const connectionStatus = ref<ConnectionStatus>('disconnected')
  const lastError = ref<string | null>(null)

  // STOMP 客户端
  let client: Client | null = null
  let subscription: StompSubscription | null = null

  /**
   * 创建并配置 STOMP 客户端
   */
  function createClient(): Client {
    const baseUrl = import.meta.env.VITE_API_BASE_URL || 'http://localhost:8080'
    // 将 http(s) 替换为 ws(s)
    const wsUrl = baseUrl.replace(/^http/, 'ws')
    const token = localStorage.getItem('token') || ''

    const newClient = new Client({
      brokerURL: `${wsUrl}/ws/chat?token=${encodeURIComponent(token)}`,
      connectHeaders: {
        // STOMP 连接头，如果需要可以在这里添加
      },
      debug: (str) => {
        // 开发环境输出调试信息
        if (import.meta.env.DEV) {
          console.log('[STOMP]', str)
        }
      },
      reconnectDelay: 5000, // 自动重连延迟 5 秒
      heartbeatIncoming: 4000, // 接收心跳间隔
      heartbeatOutgoing: 4000, // 发送心跳间隔
    })

    // 连接成功回调
    newClient.onConnect = (frame) => {
      console.log('WebSocket 连接成功')
      connectionStatus.value = 'connected'
      lastError.value = null

      // 订阅个人消息队列
      subscription = newClient.subscribe('/user/queue/messages', (message: IMessage) => {
        try {
          const body = JSON.parse(message.body)
          // 将后端 ChatMessageVO 转换为前端 ChatMessage
          const chatMessage: ChatMessage = convertToChatMessage(body)
          options.onMessage?.(chatMessage)
        } catch (err) {
          console.error('解析消息失败:', err)
        }
      })

      // 订阅错误队列
      newClient.subscribe('/user/queue/errors', (message: IMessage) => {
        console.error('服务器错误:', message.body)
        lastError.value = message.body
      })

      options.onConnect?.()
    }

    // 连接断开回调
    newClient.onDisconnect = () => {
      console.log('WebSocket 连接断开')
      connectionStatus.value = 'disconnected'
      subscription = null
      options.onDisconnect?.()
    }

    // 连接错误回调
    newClient.onStompError = (frame) => {
      console.error('STOMP 错误:', frame.headers['message'], frame.body)
      connectionStatus.value = 'error'
      lastError.value = frame.headers['message'] || '连接错误'
      options.onError?.(new Error(frame.headers['message'] || 'Unknown error'))
    }

    // WebSocket 错误回调
    newClient.onWebSocketError = (event) => {
      console.error('WebSocket 错误:', event)
      connectionStatus.value = 'error'
      lastError.value = 'WebSocket 连接失败'
      options.onError?.(new Error('WebSocket connection failed'))
    }

    return newClient
  }

  /**
   * 建立 WebSocket 连接
   */
  function connect() {
    if (!userStore.isLoggedIn) {
      console.warn('用户未登录，无法建立 WebSocket 连接')
      return
    }

    if (client?.active) {
      console.log('WebSocket 已经连接')
      return
    }

    connectionStatus.value = 'connecting'
    client = createClient()
    client.activate()
  }

  /**
   * 断开 WebSocket 连接
   */
  function disconnect() {
    subscription?.unsubscribe()
    subscription = null
    client?.deactivate()
    client = null
    connectionStatus.value = 'disconnected'
  }

  /**
   * 发送聊天消息
   */
  function sendMessage(receiverId: number, content: string, productId?: number) {
    if (!client?.active) {
      console.error('WebSocket 未连接，无法发送消息')
      return false
    }

    client.publish({
      destination: '/app/chat/send',
      body: JSON.stringify({
        receiverId,
        content,
        productId,
        msgType: 0, // 0-文字消息
      }),
    })

    return true
  }

  /**
   * 发送心跳（可选）
   */
  function sendPing() {
    if (!client?.active) {
      return false
    }

    client.publish({
      destination: '/app/chat/ping',
      body: JSON.stringify({}),
    })

    return true
  }

  // 组件挂载时自动连接
  onMounted(() => {
    connect()
  })

  // 组件卸载时断开连接
  onUnmounted(() => {
    disconnect()
  })

  /**
   * 将后端 ChatMessageVO 转换为前端 ChatMessage
   */
  function convertToChatMessage(body: any): ChatMessage {
    return {
      id: body.id,
      sessionId: body.sessionKey || '',
      senderId: body.senderId,
      senderName: body.senderNickname,
      senderAvatar: body.senderAvatar,
      receiverId: body.receiverId,
      receiverName: body.receiverNickname,
      productId: body.productId,
      productName: body.productTitle,
      productImage: body.productImage,
      content: body.content,
      // 后端 msgType: 0=文字, 1=图片; 前端: 1=文字, 2=图片
      messageType: body.msgType === 1 ? 2 : 1,
      isRead: body.isRead === 1,
      createTime: body.createTime,
    }
  }

  return {
    // 状态（内部使用，不推荐在 UI 中显示）
    connectionStatus,
    lastError,
    isConnected: () => connectionStatus.value === 'connected',

    // 方法
    connect,
    disconnect,
    sendMessage,
    sendPing,
  }
}

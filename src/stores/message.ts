import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type {
  UnifiedSession,
  ChatMessage,
  Notice,
  TotalUnreadCount,
  CursorPageParams,
} from '@/types/api'
import {
  getUnifiedSessions,
  getChatMessages,
  getNoticeMessages,
  sendChatMessage,
  markSessionRead,
  getTotalUnreadCount,
  deleteSession as deleteSessionApi,
} from '@/api/message'

/**
 * 消息中心Store
 * 管理统一会话列表、消息内容和SSE连接
 */
export const useMessageStore = defineStore('message', () => {
  // ===== State =====
  // 统一会话列表
  const sessions = ref<UnifiedSession[]>([])
  // 当前选中的会话
  const currentSession = ref<UnifiedSession | null>(null)
  // 当前会话的消息列表
  const currentMessages = ref<(ChatMessage | Notice)[]>([])
  // 总未读数
  const totalUnreadCount = ref<TotalUnreadCount>({ total: 0, chat: 0, notice: 0 })
  // 分页状态
  const hasMoreMessages = ref(true)
  const isLoadingMessages = ref(false)
  // 会话分页
  const sessionPage = ref(1)
  const hasMoreSessions = ref(true)
  const isLoadingSessions = ref(false)

  // ===== Getters =====
  // 系统通知会话
  const systemSession = computed(() =>
    sessions.value.find((s) => s.sessionType === 'system')
  )
  // 用户聊天会话列表（不包括系统通知）
  const userSessions = computed(() =>
    sessions.value.filter((s) => s.sessionType === 'user')
  )

  // ===== Actions =====

  /**
   * 获取统一会话列表
   */
  async function fetchSessions(page = 1, size = 20, append = false) {
    if (isLoadingSessions.value) return
    isLoadingSessions.value = true

    try {
      const res = await getUnifiedSessions({ page, size })
      const newSessions = res.records || []

      if (append) {
        sessions.value.push(...newSessions)
      } else {
        sessions.value = newSessions
      }

      sessionPage.value = page
      hasMoreSessions.value = newSessions.length === size
    } finally {
      isLoadingSessions.value = false
    }
  }

  /**
   * 加载更多会话
   */
  async function loadMoreSessions(size = 20) {
    if (!hasMoreSessions.value || isLoadingSessions.value) return
    await fetchSessions(sessionPage.value + 1, size, true)
  }

  /**
   * 选择会话并加载消息
   */
  async function selectSession(session: UnifiedSession | null) {
    currentSession.value = session
    currentMessages.value = []
    hasMoreMessages.value = true

    if (!session) return

    // 加载消息
    await loadMessages()

    // 标记会话已读
    if (session.unreadCount > 0) {
      await markSessionAsRead(session.sessionId, session.sessionType)
    }
  }

  /**
   * 加载当前会话的消息
   */
  async function loadMessages(params?: CursorPageParams) {
    if (!currentSession.value || isLoadingMessages.value) return
    if (!params && !hasMoreMessages.value) return

    isLoadingMessages.value = true

    try {
      let messages: (ChatMessage | Notice)[] = []

      if (currentSession.value.sessionType === 'user') {
        // 加载用户聊天记录
        const res = await getChatMessages(
          currentSession.value.otherUserId!,
          params || { size: 20 }
        )
        messages = res.records || []
      } else {
        // 加载系统通知
        const res = await getNoticeMessages(params || { size: 20 })
        messages = res.records || []
      }

      if (params?.lastId) {
        // 加载更多历史消息（较老的消息），插入到列表前面
        currentMessages.value.unshift(...messages)
      } else {
        // 首次加载，后端返回的是升序（老消息在前，新消息在后）
        currentMessages.value = messages
      }

      // 判断是否还有更多
      hasMoreMessages.value = messages.length === (params?.size || 20)
    } finally {
      isLoadingMessages.value = false
    }
  }

  /**
   * 加载更多消息（游标分页）
   */
  async function loadMoreMessages(size = 20) {
    if (!hasMoreMessages.value || isLoadingMessages.value) return

    const firstMessage = currentMessages.value[0]
    if (!firstMessage) return

    await loadMessages({ lastId: firstMessage.id, size })
  }

  /**
   * 发送消息
   */
  async function sendMessage(content: string): Promise<ChatMessage | null> {
    if (!currentSession.value || currentSession.value.sessionType !== 'user') {
      return null
    }

    const msg = await sendChatMessage({
      receiverId: currentSession.value.otherUserId!,
      productId: currentSession.value.productId,
      content,
      messageType: 1,
    })

    // 添加到当前消息列表（新消息在底部）
    currentMessages.value.push(msg)

    // 更新会话列表中的最后消息
    const session = sessions.value.find(
      (s) => s.sessionId === currentSession.value?.sessionId
    )
    if (session) {
      session.lastMessage = content
      session.lastMsgType = 0
      session.lastMessageTime = new Date().toISOString()
    }

    return msg
  }

  /**
   * 标记会话已读
   */
  async function markSessionAsRead(sessionId: string, sessionType: SessionType) {
    await markSessionRead(sessionId, sessionType)

    // 更新本地状态
    const session = sessions.value.find((s) => s.sessionId === sessionId)
    if (session) {
      session.unreadCount = 0
    }

    // 刷新总未读数
    await fetchTotalUnreadCount()
  }

  /**
   * 获取总未读数
   */
  async function fetchTotalUnreadCount() {
    try {
      totalUnreadCount.value = await getTotalUnreadCount()
    } catch (error) {
      console.error('获取未读数失败:', error)
    }
  }

  /**
   * 删除会话
   */
  async function deleteSession(sessionKey: string) {
    await deleteSessionApi(sessionKey)

    // 从本地会话列表中移除
    const index = sessions.value.findIndex((s) => s.sessionId === sessionKey)
    if (index > -1) {
      sessions.value.splice(index, 1)
    }

    // 如果删除的是当前选中的会话，清空当前会话
    if (currentSession.value?.sessionId === sessionKey) {
      currentSession.value = null
      currentMessages.value = []
    }

    // 刷新总未读数
    await fetchTotalUnreadCount()
  }

  /**
   * 处理 WebSocket 推送的新消息
   */
  function handleNewMessage(message: ChatMessage | Notice, type: 'chat' | 'notice') {
    // 更新总未读数
    fetchTotalUnreadCount()

    if (type === 'chat') {
      handleChatMessage(message as ChatMessage)
    } else if (type === 'notice') {
      handleNoticeMessage(message as Notice)
    }
  }

  /**
   * 处理聊天消息
   */
  function handleChatMessage(message: ChatMessage) {
    // 如果当前正在查看该会话，添加到消息列表
    if (
      currentSession.value?.sessionType === 'user' &&
      (currentSession.value.otherUserId === message.senderId ||
        currentSession.value.otherUserId === message.receiverId)
    ) {
      // 避免重复添加
      const exists = currentMessages.value.some((m) => m.id === message.id)
      if (!exists) {
        currentMessages.value.push(message)
      }
    }

    // 更新或创建会话
    const sessionKey = [message.senderId, message.receiverId].sort().join('_')
    const existingSession = sessions.value.find((s) => s.sessionId === sessionKey)

    if (existingSession) {
      existingSession.lastMessage = message.content
      existingSession.lastMsgType = message.messageType === 2 ? 1 : 0
      existingSession.lastMessageTime = message.createTime
      // 如果不是当前查看的会话，增加未读数
      if (currentSession.value?.sessionId !== sessionKey) {
        existingSession.unreadCount++
      }
    } else {
      // 创建新会话（需要获取对方用户信息）
      // 这里简化处理，实际应该调用API获取用户信息
      const otherUserId =
        message.receiverId === currentSession.value?.otherUserId
          ? message.senderId
          : message.receiverId

      const newSession: UnifiedSession = {
        sessionType: 'user',
        sessionId: sessionKey,
        otherUserId: otherUserId,
        otherUserName: message.senderName || '未知用户',
        otherUserAvatar: message.senderAvatar,
        productId: message.productId,
        productTitle: message.productName,
        productImage: message.productImage,
        lastMessage: message.content,
        lastMsgType: message.messageType === 2 ? 1 : 0,
        lastMessageTime: message.createTime,
        unreadCount: 1,
        isPinned: false,
      }
      sessions.value.push(newSession)
    }
  }

  /**
   * 处理通知消息
   */
  function handleNoticeMessage(notice: Notice) {
    // 更新系统通知会话
    const systemSession = sessions.value.find((s) => s.sessionType === 'system')
    if (systemSession) {
      systemSession.lastMessage = notice.title
      systemSession.lastMsgType = 2
      systemSession.lastMessageTime = notice.createTime
      if (currentSession.value?.sessionType !== 'system') {
        systemSession.unreadCount++
      }
    }

    // 如果当前正在查看系统通知，添加到消息列表
    if (currentSession.value?.sessionType === 'system') {
      const exists = currentMessages.value.some((m) => m.id === notice.id)
      if (!exists) {
        currentMessages.value.push(notice as any)
      }
    }
  }

  /**
   * 更新会话列表
   */
  function updateSession(sessionId: string, updates: Partial<UnifiedSession>) {
    const session = sessions.value.find((s) => s.sessionId === sessionId)
    if (session) {
      Object.assign(session, updates)
    }
  }

  /**
   * 重置状态
   */
  function reset() {
    sessions.value = []
    currentSession.value = null
    currentMessages.value = []
    totalUnreadCount.value = { total: 0, chat: 0, notice: 0 }
    hasMoreMessages.value = true
    sessionPage.value = 1
    hasMoreSessions.value = true
  }

  return {
    // State
    sessions,
    currentSession,
    currentMessages,
    totalUnreadCount,
    hasMoreMessages,
    isLoadingMessages,
    hasMoreSessions,
    isLoadingSessions,

    // Getters
    systemSession,
    userSessions,

    // Actions
    fetchSessions,
    loadMoreSessions,
    selectSession,
    loadMessages,
    loadMoreMessages,
    sendMessage,
    markSessionAsRead,
    fetchTotalUnreadCount,
    handleNewMessage,
    updateSession,
    deleteSession,
    reset,
  }
})

type SessionType = 'user' | 'system'

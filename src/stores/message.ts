import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useUserStore } from '@/stores'
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
        // 加载用户聊天记录（游标接口返回的是数组，不是分页对象）
        const res = await getChatMessages(
          currentSession.value.otherUserId!,
          params || { size: 20 }
        )
        console.log('[loadMessages] 获取聊天记录:', res)
        // 确保 ID 是数字类型
        messages = (res || []).map((m: any) => ({
          ...m,
          id: Number(m.id),
          senderId: Number(m.senderId),
          receiverId: Number(m.receiverId),
        }))
      } else {
        // 加载系统通知
        const res = await getNoticeMessages(params || { size: 20 })
        messages = res.records || []
      }

      if (params?.lastId) {
        // 加载更多历史消息（较老的消息），插入到列表前面
        // 后端返回降序，需要反转后再插入到前面
        currentMessages.value.unshift(...messages.reverse())
      } else {
        // 首次加载，后端返回的是降序（新消息在前，老消息在后）
        // 需要反转为升序显示（老消息在上，新消息在下）
        currentMessages.value = messages.reverse()
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
   * 注意：此方法不添加消息到列表，由调用方处理UI更新
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
    } catch (error: any) {
      // 忽略请求被取消的错误（这是正常的，比如组件卸载时）
      if (error?.name === 'CanceledError' || error?.message?.includes('canceled')) {
        return
      }
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
    console.log('[handleChatMessage] 收到消息:', {id: message.id, content: message.content, senderId: message.senderId, senderIdType: typeof message.senderId})

    // 如果当前正在查看该会话，添加到消息列表
    if (
      currentSession.value?.sessionType === 'user' &&
      (currentSession.value.otherUserId === message.senderId ||
        currentSession.value.otherUserId === message.receiverId)
    ) {
      // 首先检查是否已存在相同ID的消息（严格去重）
      const existsById = currentMessages.value.some((m) => m.id === message.id && m.id > 0)
      if (existsById) {
        console.log('[handleChatMessage] 消息已存在，跳过:', message.id)
        return
      }

      // 检查是否是当前用户发送的消息（可能是乐观更新的确认）
      const userStore = useUserStore()
      const currentUserId = userStore.userInfo?.id
      console.log('[handleChatMessage] currentUserId:', currentUserId, typeof currentUserId)

      // 使用 == 避免类型不一致问题
      const isSelfMessage = message.senderId == currentUserId
      console.log('[handleChatMessage] isSelfMessage:', isSelfMessage)

      if (isSelfMessage) {
        // 查找并移除相同内容的临时消息（临时消息使用负数ID）
        console.log('[handleChatMessage] 查找临时消息，content:', message.content, 'senderId:', message.senderId)
        console.log('[handleChatMessage] 当前消息列表详情:', currentMessages.value.map(m => ({id: m.id, content: m.content, senderId: m.senderId, senderIdType: typeof m.senderId})))
        const tempIndex = currentMessages.value.findIndex(
          (m) => {
            const isNegativeId = m.id < 0
            const contentMatch = m.content === message.content
            const senderMatch = m.senderId == message.senderId
            console.log('[handleChatMessage] 检查消息:', {id: m.id, content: m.content, senderId: m.senderId, isNegativeId, contentMatch, senderMatch})
            return isNegativeId && contentMatch && senderMatch
          }
        )
        console.log('[handleChatMessage] tempIndex:', tempIndex)
        if (tempIndex > -1) {
          console.log('[handleChatMessage] 移除临时消息:', currentMessages.value[tempIndex].id)
          currentMessages.value.splice(tempIndex, 1)
        } else {
          console.log('[handleChatMessage] 未找到匹配的临时消息')
        }
      }

      // 添加消息到列表
      console.log('[handleChatMessage] 添加消息到列表:', message.id)
      currentMessages.value.push(message)
      console.log('[handleChatMessage] 当前消息列表:', currentMessages.value.map(m => ({id: m.id, content: m.content})))
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

/**
 * 获取当前用户ID（从本地存储中获取）
 */
function getCurrentUserId(): number {
  // 注意：localStorage 中存储的键是 'userInfo'（camelCase）
  const userInfo = localStorage.getItem('userInfo')
  if (userInfo) {
    try {
      const user = JSON.parse(userInfo)
      return Number(user.id) || 0
    } catch {
      return 0
    }
  }
  return 0
}

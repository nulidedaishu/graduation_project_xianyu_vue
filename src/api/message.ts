import request from '@/utils/request'
import type {
  ChatMessage,
  ChatMessageRequest,
  CursorPageParams,
  Notice,
  PageResult,
  TotalUnreadCount,
  UnifiedSession,
} from '@/types/api'

// 统一会话列表分页参数
interface SessionPageParams {
  page?: number
  size?: number
}

/**
 * 获取统一会话列表
 */
export const getUnifiedSessions = (
  params?: SessionPageParams
): Promise<PageResult<UnifiedSession>> => {
  return request.get('/api/chat/sessions/unified', { params })
}

/**
 * 获取用户聊天记录（游标分页）
 * 注意：此接口返回的是数组，不是PageResult
 */
export const getChatMessages = (
  userId: number,
  params?: CursorPageParams
): Promise<ChatMessage[]> => {
  return request.get(`/api/chat/messages/${userId}/cursor`, { params })
}

/**
 * 获取通知消息列表（游标分页）
 */
export const getNoticeMessages = (
  params?: CursorPageParams
): Promise<PageResult<Notice>> => {
  return request.get('/api/notices/messages', { params })
}

/**
 * 发送聊天消息
 */
export const sendChatMessage = (
  data: ChatMessageRequest
): Promise<ChatMessage> => {
  return request.post('/api/chat/messages', data)
}

/**
 * 标记会话已读
 * @param sessionId 会话ID
 * @param sessionType 会话类型: user-用户聊天, system-系统通知
 */
export const markSessionRead = (
  sessionId: string,
  sessionType: 'user' | 'system'
): Promise<void> => {
  if (sessionType === 'system') {
    return request.put('/api/notices/session/read')
  } else {
    // 从sessionKey中提取对方用户ID
    const otherUserId = sessionId.split('_').find((id) => id !== String(getCurrentUserId()))
    if (otherUserId) {
      return request.put(`/api/chat/sessions/${otherUserId}/read`)
    }
    return Promise.resolve()
  }
}

/**
 * 获取消息未读总数（聊天+通知）
 */
export const getTotalUnreadCount = (): Promise<TotalUnreadCount> => {
  return request.get('/api/chat/messages/unread-count')
}

/**
 * 获取系统通知会话信息
 */
export const getNoticeSession = (): Promise<{
  sessionId: string
  title: string
  icon: string
  lastNoticeTitle: string
  lastNoticeTime?: string
  unreadCount: number
}> => {
  return request.get('/api/notices/session')
}

/**
 * 删除会话
 * @param sessionKey 会话标识
 */
export const deleteSession = (sessionKey: string): Promise<void> => {
  return request.delete(`/api/chat/sessions/${sessionKey}`)
}

// 辅助函数：获取当前用户ID（从本地存储或store中获取）
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

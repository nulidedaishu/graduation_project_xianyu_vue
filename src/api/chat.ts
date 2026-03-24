import request from '@/utils/request'
import type { ChatMessage, ChatSession, ChatMessageRequest, ChatUnreadCount } from '@/types/api'

// 发送消息
export const sendMessage = (data: ChatMessageRequest): Promise<ChatMessage> => {
  return request.post('/api/chat/messages', data)
}

// 获取聊天记录
export const getChatMessages = (userId: number, params?: { page?: number; size?: number }): Promise<ChatMessage[]> => {
  return request.get(`/api/chat/messages/${userId}`, { params })
}

// 获取会话列表
export const getChatSessions = (): Promise<ChatSession[]> => {
  return request.get('/api/chat/sessions')
}

// 标记消息已读
export const markMessageRead = (messageId: number): Promise<void> => {
  return request.put(`/api/chat/messages/${messageId}/read`)
}

// 标记会话已读
export const markSessionRead = (userId: number): Promise<void> => {
  return request.put(`/api/chat/sessions/${userId}/read`)
}

// 获取未读消息数
export const getUnreadCount = (): Promise<ChatUnreadCount> => {
  return request.get('/api/chat/unread-count')
}

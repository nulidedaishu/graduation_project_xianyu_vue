import request from '@/utils/request'
import type { Notice, NoticeStatistics, PageResult } from '@/types/api'

// 获取通知列表
export const getNotices = (params?: { page?: number; size?: number; type?: number }): Promise<PageResult<Notice>> => {
  return request.get('/api/notices', { params })
}

// 获取未读通知
export const getUnreadNotices = (): Promise<Notice[]> => {
  return request.get('/api/notices/unread')
}

// 获取通知统计
export const getNoticeStatistics = (): Promise<NoticeStatistics> => {
  return request.get('/api/notices/statistics')
}

// 标记通知已读
export const markNoticeRead = (id: number): Promise<void> => {
  return request.put(`/api/notices/${id}/read`)
}

// 标记全部已读
export const markAllNoticesRead = (): Promise<void> => {
  return request.put('/api/notices/read-all')
}

// 删除通知
export const deleteNotice = (id: number): Promise<void> => {
  return request.delete(`/api/notices/${id}`)
}

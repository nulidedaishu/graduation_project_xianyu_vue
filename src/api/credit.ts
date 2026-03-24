import request from '@/utils/request'
import type { CreditLog, CreditStatistics, PageResult } from '@/types/api'

// 获取积分记录
export const getCreditLogs = (params?: { page?: number; size?: number; changeType?: number }): Promise<PageResult<CreditLog>> => {
  return request.get('/api/credit-logs', { params })
}

// 获取积分统计
export const getCreditStatistics = (): Promise<CreditStatistics> => {
  return request.get('/api/credit-logs/statistics')
}

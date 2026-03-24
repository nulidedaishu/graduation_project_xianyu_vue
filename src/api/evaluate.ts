import request from '@/utils/request'
import type { Evaluate, EvaluateCreateRequest, PendingEvaluateOrder, PageResult } from '@/types/api'

// 提交评价
export const createEvaluate = (data: EvaluateCreateRequest): Promise<Evaluate> => {
  return request.post('/api/evaluates', data)
}

// 获取商品评价列表
export const getProductEvaluates = (productId: number, params?: { page?: number; size?: number }): Promise<PageResult<Evaluate>> => {
  return request.get(`/api/evaluates/product/${productId}`, { params })
}

// 获取用户信用评价
export const getUserEvaluates = (userId: number, params?: { page?: number; size?: number }): Promise<PageResult<Evaluate>> => {
  return request.get(`/api/evaluates/user/${userId}`, { params })
}

// 获取我的评价
export const getMyEvaluates = (params?: { page?: number; size?: number }): Promise<PageResult<Evaluate>> => {
  return request.get('/api/evaluates/my', { params })
}

// 获取待评价订单
export const getPendingEvaluates = (): Promise<PendingEvaluateOrder[]> => {
  return request.get('/api/evaluates/pending')
}

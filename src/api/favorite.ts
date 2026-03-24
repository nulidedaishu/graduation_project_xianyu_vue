import request from '@/utils/request'
import type { Favorite, FavoriteCreateRequest, PageResult } from '@/types/api'

// 添加收藏
export const addFavorite = (data: FavoriteCreateRequest): Promise<Favorite> => {
  return request.post('/api/favorites', data)
}

// 取消收藏
export const removeFavorite = (productId: number): Promise<void> => {
  return request.delete(`/api/favorites/${productId}`)
}

// 获取收藏列表
export const getFavorites = (params?: { page?: number; size?: number }): Promise<PageResult<Favorite>> => {
  return request.get('/api/favorites', { params })
}

// 检查是否已收藏
export const checkFavoriteStatus = (productId: number): Promise<boolean> => {
  return request.get(`/api/favorites/check/${productId}`)
}

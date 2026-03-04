import request from '@/utils/request'
import type { Cart, CartAddRequest, CartUpdateRequest, StockCheckRequest, StockCheckResult, StockLockRequest, StockLockResult } from '@/types/api'

// 添加商品到购物车
export const addToCart = (data: CartAddRequest): Promise<Cart> => {
  return request.post('/api/cart', data)
}

// 获取购物车列表
export const getCartList = (): Promise<Cart[]> => {
  return request.get('/api/cart')
}

// 修改购物车商品数量
export const updateCartQuantity = (id: number, data: CartUpdateRequest): Promise<void> => {
  return request.put(`/api/cart/${id}`, null, { params: data })
}

// 删除购物车商品
export const removeFromCart = (id: number): Promise<void> => {
  return request.delete(`/api/cart/${id}`)
}

// 清空购物车
export const clearCart = (): Promise<void> => {
  return request.delete('/api/cart')
}

// 获取购物车商品数量
export const getCartCount = (): Promise<number> => {
  return request.get('/api/cart/count')
}

// 检查单个商品库存
export const checkStock = (productId: number, data: StockCheckRequest): Promise<StockCheckResult> => {
  return request.post(`/api/products/${productId}/check-stock`, data)
}

// 锁定单个商品库存
export const lockStock = (productId: number, data: StockLockRequest): Promise<StockLockResult> => {
  return request.post(`/api/products/${productId}/lock-stock`, data)
}

// 批量校验库存（并发调用单个接口）
export const checkStockBatch = async (items: StockCheckRequest[]): Promise<StockCheckResult[]> => {
  const promises = items.map(item => checkStock(item.productId, item))
  return Promise.all(promises)
}

// 批量锁定库存（下单前调用，并发调用单个接口）
export const lockStockBatch = async (items: StockLockRequest[]): Promise<StockLockResult[]> => {
  const promises = items.map(item => lockStock(item.productId, item))
  return Promise.all(promises)
}

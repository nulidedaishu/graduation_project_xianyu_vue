import request from '@/utils/request'
import type { Order, OrderCreateRequest, OrderQueryParams } from '@/types/api'

// 创建订单
export const createOrder = (data: OrderCreateRequest): Promise<Order> => {
  return request.post('/api/orders', data)
}

// 获取我的订单列表
export const getMyOrders = (params?: OrderQueryParams): Promise<Order[]> => {
  return request.get('/api/orders', { params })
}

// 获取我卖出的订单列表
export const getSoldOrders = (params?: OrderQueryParams): Promise<Order[]> => {
  return request.get('/api/orders/sold', { params })
}

// 获取订单详情
export const getOrderDetail = (id: number): Promise<Order> => {
  return request.get(`/api/orders/${id}`)
}

// 取消订单
export const cancelOrder = (id: number): Promise<void> => {
  return request.post(`/api/orders/${id}/cancel`)
}

// 卖家发货
export const shipOrder = (id: number): Promise<void> => {
  return request.post(`/api/orders/${id}/ship`)
}

// 确认收货
export const confirmReceive = (id: number): Promise<void> => {
  return request.post(`/api/orders/${id}/receive`)
}

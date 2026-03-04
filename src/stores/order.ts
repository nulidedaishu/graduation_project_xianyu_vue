import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { ElMessage } from 'element-plus'
import type { Order, OrderCreateRequest, OrderQueryParams, OrderStatusType } from '@/types/api'
import { OrderStatus, OrderStatusDesc } from '@/types/api'
import {
  createOrder,
  getMyOrders,
  getSoldOrders,
  getOrderDetail,
  cancelOrder,
  shipOrder,
  confirmReceive,
} from '@/api/order'

export const useOrderStore = defineStore(
  'order',
  () => {
    // State
    const orders = ref<Order[]>([])
    const soldOrders = ref<Order[]>([])
    const currentOrder = ref<Order | null>(null)
    const loading = ref(false)
    const creating = ref(false)

    // Getters
    const orderCount = computed(() => orders.value.length)
    const soldOrderCount = computed(() => soldOrders.value.length)

    // 按状态分组的订单
    const ordersByStatus = computed(() => {
      const result: Record<number, Order[]> = {
        [OrderStatus.PENDING_PAYMENT]: [],
        [OrderStatus.PENDING_SHIPMENT]: [],
        [OrderStatus.PENDING_RECEIPT]: [],
        [OrderStatus.PENDING_REVIEW]: [],
        [OrderStatus.COMPLETED]: [],
        [OrderStatus.CANCELLED]: [],
        [OrderStatus.CLOSED]: [],
      }
      orders.value.forEach(order => {
        if (result[order.status]) {
          result[order.status].push(order)
        }
      })
      return result
    })

    // 按状态分组的我卖出的订单
    const soldOrdersByStatus = computed(() => {
      const result: Record<number, Order[]> = {
        [OrderStatus.PENDING_PAYMENT]: [],
        [OrderStatus.PENDING_SHIPMENT]: [],
        [OrderStatus.PENDING_RECEIPT]: [],
        [OrderStatus.PENDING_REVIEW]: [],
        [OrderStatus.COMPLETED]: [],
        [OrderStatus.CANCELLED]: [],
        [OrderStatus.CLOSED]: [],
      }
      soldOrders.value.forEach(order => {
        if (result[order.status]) {
          result[order.status].push(order)
        }
      })
      return result
    })

    // 获取状态描述
    const getStatusDesc = (status: OrderStatusType): string => {
      return OrderStatusDesc[status] || '未知状态'
    }

    // 获取状态标签类型
    const getStatusTagType = (status: OrderStatusType): string => {
      switch (status) {
        case OrderStatus.PENDING_PAYMENT:
          return 'warning'
        case OrderStatus.PENDING_SHIPMENT:
          return 'primary'
        case OrderStatus.PENDING_RECEIPT:
          return 'success'
        case OrderStatus.PENDING_REVIEW:
          return 'info'
        case OrderStatus.COMPLETED:
          return 'success'
        case OrderStatus.CANCELLED:
        case OrderStatus.CLOSED:
          return 'info'
        default:
          return ''
      }
    }

    // Actions
    // 创建订单
    const createOrderAction = async (data: OrderCreateRequest): Promise<Order | null> => {
      creating.value = true
      try {
        const order = await createOrder(data)
        orders.value.unshift(order)
        ElMessage.success('订单创建成功')
        return order
      } catch (error) {
        return null
      } finally {
        creating.value = false
      }
    }

    // 获取我的订单列表
    const fetchMyOrders = async (params?: OrderQueryParams): Promise<Order[]> => {
      loading.value = true
      try {
        const data = await getMyOrders(params)
        orders.value = data
        return data
      } catch (error) {
        return []
      } finally {
        loading.value = false
      }
    }

    // 获取我卖出的订单列表
    const fetchSoldOrders = async (params?: OrderQueryParams): Promise<Order[]> => {
      loading.value = true
      try {
        const data = await getSoldOrders(params)
        soldOrders.value = data
        return data
      } catch (error) {
        return []
      } finally {
        loading.value = false
      }
    }

    // 获取订单详情
    const fetchOrderDetail = async (orderId: number): Promise<Order | null> => {
      loading.value = true
      try {
        const order = await getOrderDetail(orderId)
        currentOrder.value = order
        return order
      } catch (error) {
        return null
      } finally {
        loading.value = false
      }
    }

    // 取消订单
    const cancelOrderAction = async (orderId: number): Promise<boolean> => {
      try {
        await cancelOrder(orderId)
        // 更新本地订单状态
        const order = orders.value.find(o => o.id === orderId)
        if (order) {
          order.status = OrderStatus.CANCELLED
          order.statusDesc = getStatusDesc(OrderStatus.CANCELLED)
        }
        if (currentOrder.value?.id === orderId) {
          currentOrder.value.status = OrderStatus.CANCELLED
          currentOrder.value.statusDesc = getStatusDesc(OrderStatus.CANCELLED)
        }
        ElMessage.success('订单已取消')
        return true
      } catch (error) {
        return false
      }
    }

    // 卖家发货
    const shipOrderAction = async (orderId: number): Promise<boolean> => {
      try {
        await shipOrder(orderId)
        // 更新本地订单状态
        const order = soldOrders.value.find(o => o.id === orderId)
        if (order) {
          order.status = OrderStatus.PENDING_RECEIPT
          order.statusDesc = getStatusDesc(OrderStatus.PENDING_RECEIPT)
          order.deliveryTime = new Date().toISOString()
        }
        if (currentOrder.value?.id === orderId) {
          currentOrder.value.status = OrderStatus.PENDING_RECEIPT
          currentOrder.value.statusDesc = getStatusDesc(OrderStatus.PENDING_RECEIPT)
          currentOrder.value.deliveryTime = new Date().toISOString()
        }
        ElMessage.success('发货成功')
        return true
      } catch (error) {
        return false
      }
    }

    // 确认收货
    const confirmReceiveAction = async (orderId: number): Promise<boolean> => {
      try {
        await confirmReceive(orderId)
        // 更新本地订单状态
        const order = orders.value.find(o => o.id === orderId)
        if (order) {
          order.status = OrderStatus.PENDING_REVIEW
          order.statusDesc = getStatusDesc(OrderStatus.PENDING_REVIEW)
          order.receiveTime = new Date().toISOString()
        }
        if (currentOrder.value?.id === orderId) {
          currentOrder.value.status = OrderStatus.PENDING_REVIEW
          currentOrder.value.statusDesc = getStatusDesc(OrderStatus.PENDING_REVIEW)
          currentOrder.value.receiveTime = new Date().toISOString()
        }
        ElMessage.success('确认收货成功')
        return true
      } catch (error) {
        return false
      }
    }

    // 清空当前订单
    const clearCurrentOrder = () => {
      currentOrder.value = null
    }

    return {
      // State
      orders,
      soldOrders,
      currentOrder,
      loading,
      creating,
      // Getters
      orderCount,
      soldOrderCount,
      ordersByStatus,
      soldOrdersByStatus,
      // Actions
      getStatusDesc,
      getStatusTagType,
      createOrderAction,
      fetchMyOrders,
      fetchSoldOrders,
      fetchOrderDetail,
      cancelOrderAction,
      shipOrderAction,
      confirmReceiveAction,
      clearCurrentOrder,
    }
  }
)

<template>
  <div class="order-list-view">
    <!-- 页面标题 -->
    <div class="page-header">
      <h1>{{ isSoldList ? '我卖出的' : '我买到的' }}</h1>
    </div>

    <!-- 状态筛选 -->
    <div class="filter-section">
      <el-radio-group v-model="selectedStatus" @change="handleStatusChange">
        <el-radio-button label="">全部</el-radio-button>
        <el-radio-button :label="OrderStatus.PENDING_PAYMENT">待付款</el-radio-button>
        <el-radio-button :label="OrderStatus.PENDING_SHIPMENT">待发货</el-radio-button>
        <el-radio-button :label="OrderStatus.PENDING_RECEIPT">待收货</el-radio-button>
        <el-radio-button :label="OrderStatus.PENDING_REVIEW">待评价</el-radio-button>
        <el-radio-button :label="OrderStatus.COMPLETED">已完成</el-radio-button>
      </el-radio-group>
    </div>

    <!-- 订单列表 -->
    <div v-if="orderList.length > 0" class="order-list">
      <el-card
        v-for="order in orderList"
        :key="order.id"
        class="order-card"
        shadow="never"
      >
        <!-- 订单头部 -->
        <div class="order-header">
          <div class="order-info">
            <span class="order-sn">订单号：{{ order.orderSn }}</span>
            <span class="order-time">{{ formatDate(order.createTime) }}</span>
          </div>
          <el-tag :type="orderStore.getStatusTagType(order.status)">
            {{ order.statusDesc }}
          </el-tag>
        </div>

        <el-divider />

        <!-- 订单商品 -->
        <div class="order-items">
          <div
            v-for="item in order.items"
            :key="item.id"
            class="order-item"
            @click="goToOrderDetail(order.id)"
          >
            <el-image
              :src="item.productImage || '/placeholder.png'"
              fit="cover"
              class="product-image"
            />
            <div class="item-info">
              <div class="product-name">{{ item.productName }}</div>
              <div class="item-meta">
                <span class="seller">{{ isSoldList ? '买家' : '卖家' }}：{{ isSoldList ? order.userId : item.sellerName }}</span>
              </div>
            </div>
            <div class="item-price">
              <div class="price">¥{{ item.price.toFixed(2) }}</div>
              <div class="quantity">×{{ item.quantity }}</div>
            </div>
          </div>
        </div>

        <el-divider />

        <!-- 订单底部 -->
        <div class="order-footer">
          <div class="order-total">
            共 {{ getTotalQuantity(order) }} 件商品，实付款：
            <span class="total-amount">¥{{ order.totalAmount.toFixed(2) }}</span>
          </div>
          <div class="order-actions">
            <!-- 买家操作 -->
            <template v-if="!isSoldList">
              <el-button
                v-if="order.status === OrderStatus.PENDING_PAYMENT"
                type="primary"
                @click="handlePay(order)"
              >
                立即付款
              </el-button>
              <el-button
                v-if="order.status === OrderStatus.PENDING_PAYMENT"
                @click="handleCancel(order.id)"
              >
                取消订单
              </el-button>
              <el-button
                v-if="order.status === OrderStatus.PENDING_RECEIPT"
                type="primary"
                @click="handleConfirmReceive(order.id)"
              >
                确认收货
              </el-button>
            </template>

            <!-- 卖家操作 -->
            <template v-if="isSoldList">
              <el-button
                v-if="order.status === OrderStatus.PENDING_SHIPMENT"
                type="primary"
                @click="handleShip(order.id)"
              >
                发货
              </el-button>
            </template>

            <el-button @click="goToOrderDetail(order.id)">
              查看详情
            </el-button>
          </div>
        </div>
      </el-card>
    </div>

    <!-- 空状态 -->
    <el-empty
      v-else
      :description="isSoldList ? '暂无卖出的订单' : '暂无购买的订单'"
    >
      <template #extra>
        <el-button type="primary" @click="router.push('/home')">
          去逛逛
        </el-button>
      </template>
    </el-empty>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useOrderStore } from '@/stores'
import { OrderStatus } from '@/types/api'
import type { Order } from '@/types/api'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()

// 判断是"我买到的"还是"我卖出的"
const isSoldList = computed(() => route.path === '/orders/sold')

// 状态筛选
const selectedStatus = ref<OrderStatus | ''>('')

// 订单列表
const orderList = computed(() => {
  return isSoldList.value ? orderStore.soldOrders : orderStore.orders
})

// 获取订单列表
const fetchOrders = async () => {
  const params = selectedStatus.value !== '' ? { status: selectedStatus.value } : undefined
  if (isSoldList.value) {
    await orderStore.fetchSoldOrders(params)
  } else {
    await orderStore.fetchMyOrders(params)
  }
}

// 状态变更
const handleStatusChange = () => {
  fetchOrders()
}

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 获取订单总数量
const getTotalQuantity = (order: Order) => {
  return order.items.reduce((sum, item) => sum + item.quantity, 0)
}

// 查看订单详情
const goToOrderDetail = (orderId: number) => {
  router.push(`/order/${orderId}`)
}

// 支付
const handlePay = (order: Order) => {
  // 模拟支付
  ElMessageBox.confirm(
    `确认支付订单 ¥${order.totalAmount.toFixed(2)}？`,
    '确认支付',
    {
      confirmButtonText: '确认支付',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(() => {
    // 这里调用支付API
    ElMessage.success('支付成功')
    fetchOrders()
  }).catch(() => {
    // 取消支付
  })
}

// 取消订单
const handleCancel = async (orderId: number) => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await orderStore.cancelOrderAction(orderId)
    fetchOrders()
  } catch {
    // 取消操作
  }
}

// 确认收货
const handleConfirmReceive = async (orderId: number) => {
  try {
    await ElMessageBox.confirm('确认已收到商品？', '提示', {
      confirmButtonText: '确认收货',
      cancelButtonText: '取消',
      type: 'info',
    })
    await orderStore.confirmReceiveAction(orderId)
    fetchOrders()
  } catch {
    // 取消操作
  }
}

// 发货
const handleShip = async (orderId: number) => {
  try {
    await ElMessageBox.confirm('确认发货？', '提示', {
      confirmButtonText: '确认发货',
      cancelButtonText: '取消',
      type: 'info',
    })
    await orderStore.shipOrderAction(orderId)
    fetchOrders()
  } catch {
    // 取消操作
  }
}

// 监听路由变化，刷新订单列表
watch(() => route.path, () => {
  selectedStatus.value = ''
  fetchOrders()
})

onMounted(() => {
  fetchOrders()
})
</script>

<style scoped lang="scss">
.order-list-view {
  .page-header {
    margin-bottom: 20px;

    h1 {
      font-size: 24px;
      color: #303133;
      margin: 0;
    }
  }

  .filter-section {
    margin-bottom: 20px;
  }

  .order-list {
    .order-card {
      margin-bottom: 16px;

      .order-header {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .order-info {
          display: flex;
          align-items: center;
          gap: 20px;

          .order-sn {
            font-size: 14px;
            color: #303133;
            font-weight: 500;
          }

          .order-time {
            font-size: 13px;
            color: #909399;
          }
        }
      }

      .order-items {
        .order-item {
          display: flex;
          align-items: center;
          gap: 16px;
          padding: 12px 0;
          cursor: pointer;

          .product-image {
            width: 80px;
            height: 80px;
            border-radius: 4px;
            flex-shrink: 0;
          }

          .item-info {
            flex: 1;

            .product-name {
              font-size: 14px;
              color: #303133;
              margin-bottom: 8px;
            }

            .item-meta {
              font-size: 13px;
              color: #909399;
            }
          }

          .item-price {
            text-align: right;

            .price {
              font-size: 14px;
              color: #303133;
              margin-bottom: 4px;
            }

            .quantity {
              font-size: 13px;
              color: #909399;
            }
          }
        }
      }

      .order-footer {
        display: flex;
        justify-content: space-between;
        align-items: center;

        .order-total {
          font-size: 14px;
          color: #606266;

          .total-amount {
            font-size: 18px;
            font-weight: bold;
            color: #f56c6c;
          }
        }

        .order-actions {
          display: flex;
          gap: 12px;
        }
      }
    }
  }
}

// 响应式适配
@media (max-width: 768px) {
  .order-list-view {
    .order-card {
      .order-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }

      .order-footer {
        flex-direction: column;
        gap: 16px;

        .order-actions {
          width: 100%;
          justify-content: flex-end;
        }
      }
    }
  }
}
</style>

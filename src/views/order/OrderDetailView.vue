<template>
  <div class="order-detail-view">
    <!-- 加载中 -->
    <div v-if="orderStore.loading" class="loading-wrapper">
      <el-skeleton :rows="5" animated />
    </div>

    <template v-else-if="orderStore.currentOrder">
      <!-- 页面头部 -->
      <div class="page-header">
        <el-button @click="goBack">
          <el-icon><ArrowLeft /></el-icon>返回
        </el-button>
        <h1>订单详情</h1>
      </div>

      <!-- 订单状态 -->
      <el-card class="status-section" shadow="never">
        <div class="status-header">
          <div class="status-info">
            <el-icon :size="48" :color="getStatusColor(orderStore.currentOrder.status)">
              <component :is="getStatusIcon(orderStore.currentOrder.status)" />
            </el-icon>
            <div class="status-text">
              <h2>{{ orderStore.currentOrder.statusDesc }}</h2>
              <p v-if="orderStore.currentOrder.expireTime && orderStore.currentOrder.status === OrderStatus.PENDING_PAYMENT">
                请在 {{ formatDate(orderStore.currentOrder.expireTime) }} 前完成支付
              </p>
            </div>
          </div>
          <div class="order-sn">
            订单号：{{ orderStore.currentOrder.orderSn }}
          </div>
        </div>
      </el-card>

      <!-- 订单进度 -->
      <el-card v-if="showProgress" class="progress-section" shadow="never">
        <el-steps :active="getProgressActive" align-center>
          <el-step title="提交订单" :description="formatDate(orderStore.currentOrder.createTime)" />
          <el-step title="付款成功" :description="formatDate(orderStore.currentOrder.payTime)" />
          <el-step title="卖家发货" :description="formatDate(orderStore.currentOrder.deliveryTime)" />
          <el-step title="确认收货" :description="formatDate(orderStore.currentOrder.receiveTime)" />
          <el-step title="完成评价" :description="formatDate(orderStore.currentOrder.completeTime)" />
        </el-steps>
      </el-card>

      <!-- 商品列表 -->
      <el-card class="products-section" shadow="never">
        <template #header>
          <div class="section-header">商品信息</div>
        </template>
        <div class="product-list">
          <div
            v-for="item in orderStore.currentOrder.items"
            :key="item.id"
            class="product-item"
            @click="goToProduct(item.productId)"
          >
            <el-image
              :src="item.productImage || '/placeholder.png'"
              fit="cover"
              class="product-image"
            />
            <div class="product-info">
              <div class="product-name">{{ item.productName }}</div>
              <div class="product-seller">卖家：{{ item.sellerName }}</div>
            </div>
            <div class="product-price">
              <div class="price">¥{{ item.price.toFixed(2) }}</div>
              <div class="quantity">×{{ item.quantity }}</div>
            </div>
            <div class="product-subtotal">
              ¥{{ (item.price * item.quantity).toFixed(2) }}
            </div>
          </div>
        </div>
      </el-card>

      <!-- 订单信息 -->
      <el-card class="info-section" shadow="never">
        <template #header>
          <div class="section-header">订单信息</div>
        </template>
        <div class="info-grid">
          <div class="info-item">
            <span class="label">创建时间：</span>
            <span class="value">{{ formatDate(orderStore.currentOrder.createTime) }}</span>
          </div>
          <div v-if="orderStore.currentOrder.payTime" class="info-item">
            <span class="label">付款时间：</span>
            <span class="value">{{ formatDate(orderStore.currentOrder.payTime) }}</span>
          </div>
          <div v-if="orderStore.currentOrder.deliveryTime" class="info-item">
            <span class="label">发货时间：</span>
            <span class="value">{{ formatDate(orderStore.currentOrder.deliveryTime) }}</span>
          </div>
          <div v-if="orderStore.currentOrder.receiveTime" class="info-item">
            <span class="label">收货时间：</span>
            <span class="value">{{ formatDate(orderStore.currentOrder.receiveTime) }}</span>
          </div>
          <div v-if="orderStore.currentOrder.closeTime" class="info-item">
            <span class="label">关闭时间：</span>
            <span class="value">{{ formatDate(orderStore.currentOrder.closeTime) }}</span>
          </div>
          <div v-if="orderStore.currentOrder.remark" class="info-item full-width">
            <span class="label">订单备注：</span>
            <span class="value">{{ orderStore.currentOrder.remark }}</span>
          </div>
        </div>
      </el-card>

      <!-- 金额汇总 -->
      <el-card class="amount-section" shadow="never">
        <div class="amount-row">
          <span>商品总额：</span>
          <span>¥{{ orderStore.currentOrder.totalAmount.toFixed(2) }}</span>
        </div>
        <div class="amount-row">
          <span>运费：</span>
          <span>¥0.00</span>
        </div>
        <el-divider />
        <div class="amount-row total">
          <span>实付款：</span>
          <span class="total-amount">¥{{ orderStore.currentOrder.totalAmount.toFixed(2) }}</span>
        </div>
      </el-card>

      <!-- 操作按钮 -->
      <div class="action-section">
        <!-- 买家操作 -->
        <template v-if="isBuyer">
          <el-button
            v-if="orderStore.currentOrder.status === OrderStatus.PENDING_PAYMENT"
            type="primary"
            size="large"
            @click="handlePay"
          >
            立即付款
          </el-button>
          <el-button
            v-if="orderStore.currentOrder.status === OrderStatus.PENDING_PAYMENT"
            size="large"
            @click="handleCancel"
          >
            取消订单
          </el-button>
          <el-button
            v-if="orderStore.currentOrder.status === OrderStatus.PENDING_RECEIPT"
            type="primary"
            size="large"
            @click="handleConfirmReceive"
          >
            确认收货
          </el-button>
        </template>

        <!-- 卖家操作 -->
        <template v-if="isSeller">
          <el-button
            v-if="orderStore.currentOrder.status === OrderStatus.PENDING_SHIPMENT"
            type="primary"
            size="large"
            @click="handleShip"
          >
            发货
          </el-button>
        </template>
      </div>
    </template>

    <!-- 未找到 -->
    <el-empty v-else description="订单不存在或已被删除" />
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import {
  ArrowLeft,
  Wallet,
  Box,
  Van,
  Check,
  Star,
  CircleClose,
  CircleCheck,
} from '@element-plus/icons-vue'
import { useOrderStore, useUserStore } from '@/stores'
import { OrderStatus } from '@/types/api'

const route = useRoute()
const router = useRouter()
const orderStore = useOrderStore()
const userStore = useUserStore()

const orderId = computed(() => Number(route.params.id))

// 是否是买家
const isBuyer = computed(() => {
  // 简化判断：当前登录用户创建了这个订单
  return true // 实际应根据订单userId判断
})

// 是否是卖家
const isSeller = computed(() => {
  // 简化判断：当前登录用户是订单中某个商品的卖家
  return orderStore.currentOrder?.items.some(
    item => item.sellerId === userStore.userInfo?.id
  ) ?? false
})

// 是否显示进度条
const showProgress = computed(() => {
  const status = orderStore.currentOrder?.status
  return status !== OrderStatus.CANCELLED && status !== OrderStatus.CLOSED
})

// 获取进度条当前步骤
const getProgressActive = computed(() => {
  const status = orderStore.currentOrder?.status
  switch (status) {
    case OrderStatus.PENDING_PAYMENT:
      return 0
    case OrderStatus.PENDING_SHIPMENT:
      return 1
    case OrderStatus.PENDING_RECEIPT:
      return 2
    case OrderStatus.PENDING_REVIEW:
      return 3
    case OrderStatus.COMPLETED:
      return 4
    default:
      return 0
  }
})

// 获取状态图标
const getStatusIcon = (status: number) => {
  switch (status) {
    case OrderStatus.PENDING_PAYMENT:
      return Wallet
    case OrderStatus.PENDING_SHIPMENT:
      return Box
    case OrderStatus.PENDING_RECEIPT:
      return Van
    case OrderStatus.PENDING_REVIEW:
      return Check
    case OrderStatus.COMPLETED:
      return Star
    case OrderStatus.CANCELLED:
    case OrderStatus.CLOSED:
      return CircleClose
    default:
      return CircleCheck
  }
}

// 获取状态颜色
const getStatusColor = (status: number) => {
  switch (status) {
    case OrderStatus.PENDING_PAYMENT:
      return '#E6A23C'
    case OrderStatus.PENDING_SHIPMENT:
      return '#409EFF'
    case OrderStatus.PENDING_RECEIPT:
      return '#67C23A'
    case OrderStatus.PENDING_REVIEW:
      return '#909399'
    case OrderStatus.COMPLETED:
      return '#67C23A'
    case OrderStatus.CANCELLED:
    case OrderStatus.CLOSED:
      return '#909399'
    default:
      return '#409EFF'
  }
}

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 返回
const goBack = () => {
  router.back()
}

// 跳转商品详情
const goToProduct = (productId: number) => {
  router.push(`/product/${productId}`)
}

// 支付
const handlePay = () => {
  if (!orderStore.currentOrder) return
  ElMessageBox.confirm(
    `确认支付订单 ¥${orderStore.currentOrder.totalAmount.toFixed(2)}？`,
    '确认支付',
    {
      confirmButtonText: '确认支付',
      cancelButtonText: '取消',
      type: 'info',
    }
  ).then(() => {
    ElMessage.success('支付成功')
    orderStore.fetchOrderDetail(orderId.value)
  })
}

// 取消订单
const handleCancel = async () => {
  try {
    await ElMessageBox.confirm('确定要取消该订单吗？', '提示', {
      confirmButtonText: '确定',
      cancelButtonText: '取消',
      type: 'warning',
    })
    await orderStore.cancelOrderAction(orderId.value)
    orderStore.fetchOrderDetail(orderId.value)
  } catch {
    // 取消操作
  }
}

// 确认收货
const handleConfirmReceive = async () => {
  try {
    await ElMessageBox.confirm('确认已收到商品？', '提示', {
      confirmButtonText: '确认收货',
      cancelButtonText: '取消',
      type: 'info',
    })
    await orderStore.confirmReceiveAction(orderId.value)
    orderStore.fetchOrderDetail(orderId.value)
  } catch {
    // 取消操作
  }
}

// 发货
const handleShip = async () => {
  try {
    await ElMessageBox.confirm('确认发货？', '提示', {
      confirmButtonText: '确认发货',
      cancelButtonText: '取消',
      type: 'info',
    })
    await orderStore.shipOrderAction(orderId.value)
    orderStore.fetchOrderDetail(orderId.value)
  } catch {
    // 取消操作
  }
}

onMounted(() => {
  if (orderId.value) {
    orderStore.fetchOrderDetail(orderId.value)
  }
})
</script>

<style scoped lang="scss">
.order-detail-view {
  .loading-wrapper {
    padding: 40px;
  }

  .page-header {
    display: flex;
    align-items: center;
    gap: 16px;
    margin-bottom: 20px;

    h1 {
      font-size: 20px;
      color: #303133;
      margin: 0;
    }
  }

  .status-section {
    margin-bottom: 20px;

    .status-header {
      display: flex;
      justify-content: space-between;
      align-items: center;

      .status-info {
        display: flex;
        align-items: center;
        gap: 16px;

        .status-text {
          h2 {
            font-size: 18px;
            color: #303133;
            margin: 0 0 8px;
          }

          p {
            font-size: 13px;
            color: #909399;
            margin: 0;
          }
        }
      }

      .order-sn {
        font-size: 14px;
        color: #606266;
      }
    }
  }

  .progress-section {
    margin-bottom: 20px;
  }

  .products-section {
    margin-bottom: 20px;

    .section-header {
      font-size: 16px;
      font-weight: bold;
      color: #303133;
    }

    .product-list {
      .product-item {
        display: flex;
        align-items: center;
        gap: 16px;
        padding: 16px 0;
        border-bottom: 1px solid #ebeef5;
        cursor: pointer;

        &:last-child {
          border-bottom: none;
        }

        .product-image {
          width: 80px;
          height: 80px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .product-info {
          flex: 1;

          .product-name {
            font-size: 14px;
            color: #303133;
            margin-bottom: 8px;

            &:hover {
              color: #409eff;
            }
          }

          .product-seller {
            font-size: 13px;
            color: #909399;
          }
        }

        .product-price {
          text-align: right;
          margin-right: 40px;

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

        .product-subtotal {
          font-size: 16px;
          font-weight: bold;
          color: #f56c6c;
          width: 100px;
          text-align: right;
        }
      }
    }
  }

  .info-section {
    margin-bottom: 20px;

    .section-header {
      font-size: 16px;
      font-weight: bold;
      color: #303133;
    }

    .info-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 16px;

      .info-item {
        font-size: 14px;

        .label {
          color: #909399;
        }

        .value {
          color: #303133;
        }

        &.full-width {
          grid-column: span 2;
        }
      }
    }
  }

  .amount-section {
    margin-bottom: 20px;

    .amount-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 8px 0;
      font-size: 14px;
      color: #606266;

      &.total {
        font-size: 16px;
        font-weight: bold;
        color: #303133;

        .total-amount {
          font-size: 24px;
          color: #f56c6c;
        }
      }
    }
  }

  .action-section {
    display: flex;
    justify-content: center;
    gap: 16px;
    padding: 20px 0;
  }
}

// 响应式适配
@media (max-width: 768px) {
  .order-detail-view {
    .status-section {
      .status-header {
        flex-direction: column;
        align-items: flex-start;
        gap: 12px;
      }
    }

    .info-section {
      .info-grid {
        grid-template-columns: 1fr;

        .info-item.full-width {
          grid-column: span 1;
        }
      }
    }

    .products-section {
      .product-list {
        .product-item {
          flex-wrap: wrap;

          .product-subtotal {
            width: 100%;
            text-align: left;
            padding-left: 96px;
          }
        }
      }
    }
  }
}
</style>

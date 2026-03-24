<template>
  <div class="evaluate-view">
    <!-- 待评价订单列表 -->
    <div v-if="!isEvaluating">
      <div class="page-header">
        <h1>待评价订单</h1>
      </div>

      <div v-if="pendingOrders.length > 0" class="pending-list">
        <el-card
          v-for="order in pendingOrders"
          :key="order.orderId"
          class="pending-card"
          shadow="never"
        >
          <div class="order-info">
            <div class="product-section">
              <el-image
                :src="order.productImage || '/placeholder.png'"
                fit="cover"
                class="product-image"
              />
              <div class="product-details">
                <div class="product-name">{{ order.productName }}</div>
                <div class="order-sn">订单号：{{ order.orderSn }}</div>
              </div>
            </div>

            <div class="evaluate-info">
              <div class="evaluate-role">
                <el-tag :type="order.type === 'buyer' ? 'primary' : 'success'" size="small">
                  {{ order.type === 'buyer' ? '我是买家' : '我是卖家' }}
                </el-tag>
                <span class="target-user">
                  需要评价：{{ order.type === 'buyer' ? order.sellerName : order.buyerName }}
                </span>
              </div>
              <el-button type="primary" @click="startEvaluate(order)">去评价</el-button>
            </div>
          </div>
        </el-card>
      </div>

      <el-empty v-else description="暂无待评价订单">
        <template #extra>
          <el-button type="primary" @click="$router.push('/orders/bought')">
            查看我的订单
          </el-button>
        </template>
      </el-empty>

      <!-- 我的历史评价 -->
      <div class="page-header" style="margin-top: 40px;">
        <h2>我的历史评价</h2>
      </div>

      <el-table :data="myEvaluates" v-loading="loading" stripe>
        <el-table-column label="商品" min-width="200">
          <template #default="{ row }">
            <div class="product-cell">
              <span class="product-name">{{ row.productName }}</span>
            </div>
          </template>
        </el-table-column>
        <el-table-column label="评价对象" width="120">
          <template #default="{ row }">
            <el-tag :type="row.type === 1 ? 'primary' : 'success'" size="small">
              {{ row.type === 1 ? '卖家' : '买家' }}
            </el-tag>
            <div class="user-name">{{ row.evaluateeName }}</div>
          </template>
        </el-table-column>
        <el-table-column label="评分" width="180">
          <template #default="{ row }">
            <el-rate v-model="row.rating" disabled show-score />
          </template>
        </el-table-column>
        <el-table-column label="评价内容" prop="content" min-width="200" show-overflow-tooltip />
        <el-table-column label="评价时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
      </el-table>

      <div v-if="myEvaluates.length > 0" class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="total"
          :page-sizes="[10, 20, 50]"
          layout="total, sizes, prev, pager, next"
          @size-change="handleSizeChange"
          @current-change="handlePageChange"
        />
      </div>
    </div>

    <!-- 评价表单 -->
    <div v-else class="evaluate-form">
      <el-page-header title="返回列表" @back="cancelEvaluate" />

      <el-card class="form-card" shadow="never">
        <template #header>
          <span>评价订单</span>
        </template>

        <div v-if="currentOrder" class="order-summary">
          <el-image
            :src="currentOrder.productImage || '/placeholder.png'"
            fit="cover"
            class="product-image"
          />
          <div class="product-info">
            <div class="product-name">{{ currentOrder.productName }}</div>
            <div class="evaluate-target">
              <el-tag :type="currentOrder.type === 'buyer' ? 'primary' : 'success'">
                {{ currentOrder.type === 'buyer' ? '评价卖家' : '评价买家' }}
              </el-tag>
              <span class="target-name">{{ currentOrder.type === 'buyer' ? currentOrder.sellerName : currentOrder.buyerName }}</span>
            </div>
          </div>
        </div>

        <el-divider />

        <el-form :model="evaluateForm" label-position="top">
          <el-form-item label="评分">
            <el-rate
              v-model="evaluateForm.rating"
              :colors="['#99A9BF', '#F7BA2A', '#FF9900']"
              show-score
              score-template="{value} 分"
            />
          </el-form-item>

          <el-form-item label="评价内容">
            <el-input
              v-model="evaluateForm.content"
              type="textarea"
              :rows="4"
              placeholder="请输入您的评价内容（选填）"
              maxlength="500"
              show-word-limit
            />
          </el-form-item>

          <el-form-item>
            <el-button type="primary" :loading="submitting" @click="submitEvaluate">
              提交评价
            </el-button>
            <el-button @click="cancelEvaluate">取消</el-button>
          </el-form-item>
        </el-form>
      </el-card>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { getPendingEvaluates, getMyEvaluates, createEvaluate } from '@/api/evaluate'
import type { PendingEvaluateOrder, Evaluate, EvaluateCreateRequest } from '@/types/api'

const pendingOrders = ref<PendingEvaluateOrder[]>([])
const myEvaluates = ref<Evaluate[]>([])
const currentOrder = ref<PendingEvaluateOrder | null>(null)
const isEvaluating = ref(false)
const loading = ref(false)
const submitting = ref(false)
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)

const evaluateForm = ref({
  rating: 5,
  content: '',
})

// 获取待评价订单
const fetchPendingOrders = async () => {
  try {
    pendingOrders.value = await getPendingEvaluates()
  } catch (error) {
    console.error('获取待评价订单失败:', error)
  }
}

// 获取我的评价
const fetchMyEvaluates = async () => {
  loading.value = true
  try {
    const res = await getMyEvaluates({
      page: currentPage.value,
      size: pageSize.value,
    })
    myEvaluates.value = res.records
    total.value = res.total
  } catch (error) {
    console.error('获取我的评价失败:', error)
  } finally {
    loading.value = false
  }
}

// 开始评价
const startEvaluate = (order: PendingEvaluateOrder) => {
  currentOrder.value = order
  evaluateForm.value = {
    rating: 5,
    content: '',
  }
  isEvaluating.value = true
}

// 取消评价
const cancelEvaluate = () => {
  isEvaluating.value = false
  currentOrder.value = null
}

// 提交评价
const submitEvaluate = async () => {
  if (!currentOrder.value) return

  if (evaluateForm.value.rating < 1) {
    ElMessage.warning('请选择评分')
    return
  }

  submitting.value = true
  try {
    const data: EvaluateCreateRequest = {
      orderId: currentOrder.value.orderId,
      productId: currentOrder.value.productId,
      evaluateeId: currentOrder.value.type === 'buyer' ? currentOrder.value.sellerId : currentOrder.value.buyerId,
      type: currentOrder.value.type === 'buyer' ? 1 : 2,
      rating: evaluateForm.value.rating,
      content: evaluateForm.value.content,
    }

    await createEvaluate(data)
    ElMessage.success('评价提交成功')
    isEvaluating.value = false
    currentOrder.value = null
    fetchPendingOrders()
    fetchMyEvaluates()
  } catch (error) {
    console.error('提交评价失败:', error)
  } finally {
    submitting.value = false
  }
}

// 分页大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  fetchMyEvaluates()
}

// 页码变化
const handlePageChange = (val: number) => {
  currentPage.value = val
  fetchMyEvaluates()
}

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

onMounted(() => {
  fetchPendingOrders()
  fetchMyEvaluates()
})
</script>

<style scoped lang="scss">
.evaluate-view {
  .page-header {
    margin-bottom: 20px;

    h1,
    h2 {
      font-size: 24px;
      color: #303133;
      margin: 0;
    }

    h2 {
      font-size: 20px;
    }
  }

  .pending-list {
    .pending-card {
      margin-bottom: 16px;

      .order-info {
        display: flex;
        justify-content: space-between;
        align-items: center;
        gap: 20px;

        @media (max-width: 768px) {
          flex-direction: column;
          align-items: flex-start;
        }

        .product-section {
          display: flex;
          gap: 16px;
          flex: 1;

          .product-image {
            width: 80px;
            height: 80px;
            border-radius: 4px;
            flex-shrink: 0;
          }

          .product-details {
            .product-name {
              font-size: 14px;
              color: #303133;
              margin-bottom: 8px;
            }

            .order-sn {
              font-size: 13px;
              color: #909399;
            }
          }
        }

        .evaluate-info {
          display: flex;
          flex-direction: column;
          align-items: flex-end;
          gap: 12px;

          @media (max-width: 768px) {
            width: 100%;
            flex-direction: row;
            justify-content: space-between;
          }

          .evaluate-role {
            display: flex;
            align-items: center;
            gap: 8px;

            .target-user {
              font-size: 13px;
              color: #606266;
            }
          }
        }
      }
    }
  }

  .evaluate-form {
    .form-card {
      margin-top: 20px;

      .order-summary {
        display: flex;
        gap: 16px;

        .product-image {
          width: 100px;
          height: 100px;
          border-radius: 4px;
          flex-shrink: 0;
        }

        .product-info {
          .product-name {
            font-size: 16px;
            font-weight: bold;
            color: #303133;
            margin-bottom: 12px;
          }

          .evaluate-target {
            display: flex;
            align-items: center;
            gap: 8px;

            .target-name {
              font-size: 14px;
              color: #606266;
            }
          }
        }
      }
    }
  }

  .product-cell {
    .product-name {
      font-size: 14px;
      color: #303133;
    }
  }

  .user-name {
    font-size: 13px;
    color: #606266;
    margin-top: 4px;
  }

  .pagination-wrapper {
    display: flex;
    justify-content: center;
    margin-top: 20px;
  }
}
</style>

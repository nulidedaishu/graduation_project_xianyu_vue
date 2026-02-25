<template>
  <div class="admin-product-review">
    <el-card shadow="never">
      <template #header>
        <div class="card-header">
          <span>商品审核</span>
          <el-button type="primary" @click="loadData">刷新</el-button>
        </div>
      </template>

      <el-table v-loading="adminStore.loading" :data="adminStore.pendingProducts" border>
        <el-table-column prop="id" label="ID" width="60" />
        <el-table-column prop="name" label="商品名称" min-width="150" />
        <el-table-column prop="categoryName" label="分类" width="100" />
        <el-table-column prop="price" label="价格" width="100">
          <template #default="{ row }">
            ¥{{ row.price.toFixed(2) }}
          </template>
        </el-table-column>
        <el-table-column prop="userNickname" label="发布者" width="120" />
        <el-table-column prop="createTime" label="发布时间" width="160" />
        <el-table-column label="操作" width="180" fixed="right">
          <template #default="{ row }">
            <el-button size="small" @click="viewDetail(row)">查看</el-button>
            <el-button size="small" type="success" @click="handleApprove(row)">通过</el-button>
            <el-button size="small" type="danger" @click="handleReject(row)">驳回</el-button>
          </template>
        </el-table-column>
      </el-table>

      <div class="pagination-wrapper">
        <el-pagination
          v-model:current-page="currentPage"
          v-model:page-size="pageSize"
          :total="adminStore.total"
          layout="total, prev, pager, next"
          @current-change="loadData"
        />
      </div>
    </el-card>

    <!-- 详情弹窗 -->
    <el-dialog v-model="detailVisible" title="商品详情" width="600px">
      <div v-if="currentProduct" class="product-detail">
        <p><strong>商品名称：</strong>{{ currentProduct.name }}</p>
        <p><strong>商品描述：</strong>{{ currentProduct.description }}</p>
        <p><strong>商品价格：</strong>¥{{ currentProduct.price.toFixed(2) }}</p>
        <p><strong>商品详情：</strong>{{ currentProduct.detail }}</p>
        <p><strong>联系方式：</strong>{{ currentProduct.contactInfo }}</p>
        <p><strong>发布者：</strong>{{ currentProduct.userNickname }}</p>
      </div>
    </el-dialog>

    <!-- 驳回弹窗 -->
    <el-dialog v-model="rejectVisible" title="驳回原因" width="400px">
      <el-input
        v-model="rejectReason"
        type="textarea"
        :rows="3"
        placeholder="请输入驳回原因"
      />
      <template #footer>
        <el-button @click="rejectVisible = false">取消</el-button>
        <el-button type="primary" @click="confirmReject">确定</el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { useAdminStore } from '@/stores'
import type { Product } from '@/types/api'

const adminStore = useAdminStore()

const currentPage = ref(1)
const pageSize = ref(10)
const detailVisible = ref(false)
const rejectVisible = ref(false)
const currentProduct = ref<Product | null>(null)
const rejectReason = ref('')
const rejectProductId = ref<number | null>(null)

const loadData = () => {
  adminStore.fetchPendingProducts(currentPage.value, pageSize.value)
}

const viewDetail = (row: Product) => {
  currentProduct.value = row
  detailVisible.value = true
}

const handleApprove = async (row: Product) => {
  await adminStore.reviewProductAction(row.id, 1)
  loadData()
}

const handleReject = (row: Product) => {
  rejectProductId.value = row.id
  rejectReason.value = ''
  rejectVisible.value = true
}

const confirmReject = async () => {
  if (rejectProductId.value) {
    await adminStore.reviewProductAction(rejectProductId.value, 2, rejectReason.value)
    rejectVisible.value = false
    loadData()
  }
}

onMounted(() => {
  loadData()
})
</script>

<style scoped lang="scss">
.admin-product-review {
  .card-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
  }

  .pagination-wrapper {
    margin-top: 20px;
    display: flex;
    justify-content: center;
  }

  .product-detail {
    p {
      margin: 12px 0;
      line-height: 1.6;
    }
  }
}
</style>

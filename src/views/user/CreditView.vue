<template>
  <div class="credit-view">
    <div class="page-header">
      <h1>信用积分</h1>
    </div>

    <!-- 积分统计卡片 -->
    <el-row :gutter="20" class="stat-cards">
      <el-col :xs="24" :sm="8">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #409eff;">
            <el-icon><Star /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">当前信用分</div>
            <div class="stat-value">{{ currentCredit }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #67c23a;">
            <el-icon><ArrowUp /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">累计收入</div>
            <div class="stat-value">+{{ totalIncome }}</div>
          </div>
        </el-card>
      </el-col>
      <el-col :xs="24" :sm="8">
        <el-card class="stat-card" shadow="hover">
          <div class="stat-icon" style="background: #f56c6c;">
            <el-icon><ArrowDown /></el-icon>
          </div>
          <div class="stat-info">
            <div class="stat-label">累计支出</div>
            <div class="stat-value">-{{ totalExpense }}</div>
          </div>
        </el-card>
      </el-col>
    </el-row>

    <!-- 信用等级 -->
    <el-card class="credit-level-card" shadow="never">
      <template #header>
        <span>信用等级</span>
      </template>
      <div class="credit-level-content">
        <div class="level-badge" :class="getLevelClass(creditLevelInfo.level)">
          {{ creditLevelInfo.level }}
        </div>
        <div class="level-desc">
          <p>{{ creditLevelInfo.desc }}</p>
          <p>信用等级说明：</p>
          <ul>
            <li><span class="level-tag level-excellent">极好</span> 信用分 ≥ 200</li>
            <li><span class="level-tag level-good">优秀</span> 信用分 150-199</li>
            <li><span class="level-tag level-normal">良好</span> 信用分 100-149</li>
            <li><span class="level-tag level-fair">一般</span> 信用分 50-99</li>
            <li><span class="level-tag level-poor">较低</span> 信用分 < 50</li>
          </ul>
        </div>
      </div>
    </el-card>

    <!-- 积分记录 -->
    <el-card class="credit-logs-card" shadow="never">
      <template #header>
        <div class="card-header">
          <span>积分记录</span>
          <el-radio-group v-model="filterType" size="small" @change="handleFilterChange">
            <el-radio-button label="">全部</el-radio-button>
            <el-radio-button :label="1">收入</el-radio-button>
            <el-radio-button :label="2">支出</el-radio-button>
          </el-radio-group>
        </div>
      </template>

      <el-table :data="creditLogs" v-loading="loading" stripe>
        <el-table-column label="类型" width="100">
          <template #default="{ row }">
            <el-tag :type="row.changeType === 1 ? 'success' : 'danger'" size="small">
              {{ row.changeTypeDesc }}
            </el-tag>
          </template>
        </el-table-column>
        <el-table-column label="积分变动" width="120">
          <template #default="{ row }">
            <span :class="row.changeType === 1 ? 'text-success' : 'text-danger'">
              {{ row.changeType === 1 ? '+' : '-' }}{{ row.points }}
            </span>
          </template>
        </el-table-column>
        <el-table-column label="说明" prop="description" min-width="200" />
        <el-table-column label="时间" width="180">
          <template #default="{ row }">
            {{ formatDate(row.createTime) }}
          </template>
        </el-table-column>
      </el-table>

      <!-- 分页 -->
      <div class="pagination-wrapper">
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
    </el-card>
  </div>
</template>

<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useUserStore } from '@/stores'
import { Star, ArrowUp, ArrowDown } from '@element-plus/icons-vue'
import { getCreditLogs, getCreditStatistics } from '@/api/credit'
import type { CreditLog } from '@/types/api'

const userStore = useUserStore()

const creditLogs = ref<CreditLog[]>([])
const totalIncome = ref(0)
const totalExpense = ref(0)

// 当前信用分从 userStore 获取
const currentCredit = computed(() => userStore.userInfo?.creditScore || 0)

// 计算信用等级
const creditLevelInfo = computed(() => {
  const score = currentCredit.value
  if (score >= 200) {
    return {
      level: '极好',
      desc: '您的信用极好，享受所有权益和优先推荐'
    }
  } else if (score >= 150) {
    return {
      level: '优秀',
      desc: '您的信用非常优秀，享受优先推荐权益'
    }
  } else if (score >= 100) {
    return {
      level: '良好',
      desc: '您的信用良好，正常享受平台服务'
    }
  } else if (score >= 50) {
    return {
      level: '一般',
      desc: '您的信用一般，建议多完成交易提升信用'
    }
  } else {
    return {
      level: '较低',
      desc: '您的信用较低，部分功能可能受限'
    }
  }
})
const currentPage = ref(1)
const pageSize = ref(10)
const total = ref(0)
const loading = ref(false)
const filterType = ref<number | ''>('')

// 获取积分统计
const fetchStatistics = async () => {
  try {
    const res = await getCreditStatistics()
    totalIncome.value = res.totalIncome || 0
    totalExpense.value = res.totalExpense || 0
  } catch (error) {
    console.error('获取积分统计失败:', error)
  }
}

// 获取积分记录
const fetchCreditLogs = async () => {
  loading.value = true
  try {
    const params: any = {
      page: currentPage.value,
      size: pageSize.value,
    }
    if (filterType.value !== '') {
      params.changeType = filterType.value
    }
    const res = await getCreditLogs(params)
    creditLogs.value = res.records
    total.value = res.total
  } catch (error) {
    console.error('获取积分记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 获取等级样式类
const getLevelClass = (level?: string) => {
  if (!level) return 'level-normal'
  const map: Record<string, string> = {
    '极好': 'level-excellent',
    '优秀': 'level-good',
    '良好': 'level-normal',
    '一般': 'level-fair',
    '较低': 'level-poor',
  }
  return map[level] || 'level-normal'
}

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 筛选变化
const handleFilterChange = () => {
  currentPage.value = 1
  fetchCreditLogs()
}

// 分页大小变化
const handleSizeChange = (val: number) => {
  pageSize.value = val
  currentPage.value = 1
  fetchCreditLogs()
}

// 页码变化
const handlePageChange = (val: number) => {
  currentPage.value = val
  fetchCreditLogs()
}

onMounted(() => {
  fetchStatistics()
  fetchCreditLogs()
})
</script>

<style scoped lang="scss">
.credit-view {
  .page-header {
    margin-bottom: 20px;

    h1 {
      font-size: 24px;
      color: #303133;
      margin: 0;
    }
  }

  .stat-cards {
    margin-bottom: 20px;

    .stat-card {
      margin-bottom: 20px;

      :deep(.el-card__body) {
        display: flex;
        align-items: center;
        gap: 16px;
      }

      .stat-icon {
        width: 60px;
        height: 60px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        color: #fff;
        font-size: 28px;
      }

      .stat-info {
        .stat-label {
          font-size: 14px;
          color: #909399;
          margin-bottom: 4px;
        }

        .stat-value {
          font-size: 28px;
          font-weight: bold;
          color: #303133;
        }
      }
    }
  }

  .credit-level-card {
    margin-bottom: 20px;

    .credit-level-content {
      display: flex;
      align-items: flex-start;
      gap: 40px;

      .level-badge {
        width: 100px;
        height: 100px;
        border-radius: 50%;
        display: flex;
        align-items: center;
        justify-content: center;
        font-size: 24px;
        font-weight: bold;
        color: #fff;
        flex-shrink: 0;

        &.level-excellent {
          background: linear-gradient(135deg, #67c23a, #85ce61);
        }

        &.level-good {
          background: linear-gradient(135deg, #409eff, #66b1ff);
        }

        &.level-normal {
          background: linear-gradient(135deg, #e6a23c, #ebb563);
        }

        &.level-fair {
          background: linear-gradient(135deg, #909399, #a6a9ad);
        }

        &.level-poor {
          background: linear-gradient(135deg, #f56c6c, #f78989);
        }
      }

      .level-desc {
        p {
          font-weight: bold;
          margin-bottom: 12px;
        }

        ul {
          list-style: none;
          padding: 0;
          margin: 0;

          li {
            margin-bottom: 8px;
            display: flex;
            align-items: center;
            gap: 8px;
          }
        }

        .level-tag {
          display: inline-block;
          padding: 2px 8px;
          border-radius: 4px;
          font-size: 12px;
          color: #fff;
          min-width: 40px;
          text-align: center;

          &.level-excellent {
            background: #67c23a;
          }

          &.level-good {
            background: #409eff;
          }

          &.level-normal {
            background: #e6a23c;
          }

          &.level-fair {
            background: #909399;
          }

          &.level-poor {
            background: #f56c6c;
          }
        }
      }
    }
  }

  .credit-logs-card {
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .text-success {
      color: #67c23a;
      font-weight: bold;
    }

    .text-danger {
      color: #f56c6c;
      font-weight: bold;
    }

    .pagination-wrapper {
      display: flex;
      justify-content: center;
      margin-top: 20px;
    }
  }
}
</style>

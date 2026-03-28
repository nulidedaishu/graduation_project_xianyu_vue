<template>
  <span v-if="shouldShow" class="order-countdown" :class="{ urgent: isUrgent, finished: isFinished }">
    <el-icon><Timer /></el-icon>
    {{ countdownText }}
  </span>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { Timer } from '@element-plus/icons-vue'
import { useOrderCountdown } from '@/composables/useCountdown'

const props = defineProps<{
  expireTime?: string
  status: number
}>()

const emit = defineEmits<{
  finish: []
}>()

const { countdownText, isUrgent, isFinished } = useOrderCountdown(
  computed(() => props.expireTime),
  computed(() => props.status),
  {
    onFinish: () => {
      // 倒计时结束，通知父组件
      emit('finish')
    },
  }
)

// 是否显示倒计时
const shouldShow = computed(() => {
  // 只有待付款状态才显示
  return props.status === 0 && countdownText.value
})
</script>

<style scoped lang="scss">
.order-countdown {
  display: inline-flex;
  align-items: center;
  gap: 4px;
  font-size: 13px;
  color: #409eff;
  font-weight: 500;
  padding: 2px 8px;
  background: #ecf5ff;
  border-radius: 4px;

  .el-icon {
    font-size: 14px;
  }

  &.urgent {
    color: #f56c6c;
    background: #fef0f0;
    animation: pulse 1s ease-in-out infinite;
  }

  &.finished {
    color: #909399;
    background: #f4f4f5;
    animation: none;
  }
}

@keyframes pulse {
  0%, 100% {
    opacity: 1;
  }
  50% {
    opacity: 0.6;
  }
}
</style>

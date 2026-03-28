import { ref, computed, onUnmounted } from 'vue'

/**
 * 倒计时组合式函数
 * @param targetTime 目标时间（ISO字符串或时间戳）
 * @param options 配置选项
 */
export function useCountdown(
  targetTime: string | number | Date | undefined,
  options: {
    /** 倒计时结束回调 */
    onFinish?: () => void
    /** 是否立即开始 */
    immediate?: boolean
  } = {}
) {
  const { onFinish, immediate = true } = options

  // 剩余时间（毫秒）
  const remainingMs = ref(0)
  // 倒计时是否已结束
  const isFinished = ref(false)
  // 定时器ID
  let timerId: ReturnType<typeof setInterval> | null = null

  /**
   * 计算剩余时间
   */
  const calculateRemaining = () => {
    if (!targetTime) {
      remainingMs.value = 0
      isFinished.value = true
      return
    }

    const target = new Date(targetTime).getTime()
    const now = Date.now()
    const diff = target - now

    if (diff <= 0) {
      remainingMs.value = 0
      isFinished.value = true
      stop()
      onFinish?.()
    } else {
      remainingMs.value = diff
      isFinished.value = false
    }
  }

  /**
   * 开始倒计时
   */
  const start = () => {
    // 先停止之前的定时器
    stop()
    // 立即计算一次
    calculateRemaining()
    // 如果已经结束，不再启动定时器
    if (isFinished.value) return
    // 每秒更新一次
    timerId = setInterval(() => {
      calculateRemaining()
    }, 1000)
  }

  /**
   * 停止倒计时
   */
  const stop = () => {
    if (timerId) {
      clearInterval(timerId)
      timerId = null
    }
  }

  /**
   * 格式化后的倒计时文本
   * 格式：29分59秒 / 59秒 / 1小时29分
   */
  const formattedTime = computed(() => {
    if (remainingMs.value <= 0) return '已超时'

    const totalSeconds = Math.floor(remainingMs.value / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}小时${minutes.toString().padStart(2, '0')}分`
    } else if (minutes > 0) {
      return `${minutes}分${seconds.toString().padStart(2, '0')}秒`
    } else {
      return `${seconds}秒`
    }
  })

  /**
   * 详细格式化（包含毫秒效果）
   * 格式：29:59
   */
  const formattedTimeDetail = computed(() => {
    if (remainingMs.value <= 0) return '00:00'

    const totalSeconds = Math.floor(remainingMs.value / 1000)
    const hours = Math.floor(totalSeconds / 3600)
    const minutes = Math.floor((totalSeconds % 3600) / 60)
    const seconds = totalSeconds % 60

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    } else {
      return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`
    }
  })

  // 组件卸载时自动清理
  onUnmounted(() => {
    stop()
  })

  // 立即开始
  if (immediate) {
    start()
  }

  return {
    /** 剩余毫秒数 */
    remainingMs,
    /** 是否已结束 */
    isFinished,
    /** 格式化后的时间文本 */
    formattedTime,
    /** 详细格式化（MM:SS） */
    formattedTimeDetail,
    /** 开始倒计时 */
    start,
    /** 停止倒计时 */
    stop,
  }
}

/**
 * 创建订单倒计时
 * 专为订单超时场景设计
 */
export function useOrderCountdown(
  expireTime: string | undefined,
  status: number,
  options: {
    /** 倒计时结束回调 */
    onFinish?: () => void
  } = {}
) {
  // 只有待付款状态才显示倒计时
  const isPendingPayment = status === 0 // OrderStatus.PENDING_PAYMENT = 0

  const {
    remainingMs,
    isFinished,
    formattedTime,
    formattedTimeDetail,
    start,
    stop,
  } = useCountdown(isPendingPayment ? expireTime : undefined, {
    onFinish: options.onFinish,
    immediate: true,
  })

  // 是否即将超时（小于5分钟）
  const isUrgent = computed(() => {
    return remainingMs.value > 0 && remainingMs.value < 5 * 60 * 1000
  })

  // 倒计时显示文本
  const countdownText = computed(() => {
    if (!isPendingPayment) return ''
    if (isFinished.value) return '已超时'
    return `剩余 ${formattedTime.value}`
  })

  return {
    remainingMs,
    isFinished,
    formattedTime,
    formattedTimeDetail,
    isUrgent,
    countdownText,
    start,
    stop,
    isPendingPayment,
  }
}

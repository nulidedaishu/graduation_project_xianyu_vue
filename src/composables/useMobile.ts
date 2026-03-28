import { ref, onMounted, onUnmounted } from 'vue'
import { debounce } from '@/utils/throttle'

/**
 * 移动端检测组合式函数
 * @returns isMobile - 是否为移动端（屏幕宽度 < 768px）
 */
export function useMobile() {
  const isMobile = ref(false)

  const checkMobile = () => {
    isMobile.value = window.innerWidth < 768
  }

  // 防抖处理，避免 resize 事件频繁触发
  const debouncedCheckMobile = debounce(checkMobile, 200)

  onMounted(() => {
    checkMobile()
    window.addEventListener('resize', debouncedCheckMobile)
  })

  onUnmounted(() => {
    window.removeEventListener('resize', debouncedCheckMobile)
  })

  return { isMobile }
}

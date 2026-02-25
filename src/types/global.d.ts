import { ElMessage, ElMessageBox, ElNotification } from 'element-plus'

declare global {
  const ElMessage: typeof ElMessage
  const ElMessageBox: typeof ElMessageBox
  const ElNotification: typeof ElNotification
}

export {}

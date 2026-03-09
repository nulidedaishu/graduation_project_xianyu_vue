<template>
  <div class="image-upload">
    <!-- 图片预览列表 -->
    <div class="image-list">
      <div
        v-for="(url, index) in modelValue"
        :key="url + index"
        class="image-item"
        :class="{ 'is-main': index === 0 }"
      >
        <el-image
          :src="url"
          fit="cover"
          class="preview-image"
          :preview-src-list="modelValue"
          :initial-index="index"
        />
        <!-- 主图标记 -->
        <div v-if="index === 0" class="main-badge">主图</div>
        <!-- 删除按钮 -->
        <div class="image-actions">
          <el-icon class="delete-btn" @click.stop="removeImage(index)">
            <Close />
          </el-icon>
        </div>
      </div>

      <!-- 上传按钮 -->
      <el-upload
        v-if="canUpload"
        ref="uploadRef"
        class="upload-btn"
        action="#"
        :auto-upload="false"
        :show-file-list="false"
        :multiple="multiple"
        :limit="limit"
        accept="image/*"
        :on-change="handleFileChange"
        :on-exceed="handleExceed"
      >
        <div class="upload-trigger">
          <el-icon class="upload-icon"><Plus /></el-icon>
          <span class="upload-text">{{ uploadText }}</span>
        </div>
      </el-upload>
    </div>

    <!-- 上传进度 -->
    <div v-if="uploading" class="upload-progress">
      <el-progress :percentage="uploadProgress" :stroke-width="4" />
      <span class="progress-text">正在上传...</span>
    </div>

    <!-- 提示信息 -->
    <p class="upload-tip">
      <span v-if="multiple && modelValue.length > 0">第一张图片将作为主图，</span>
      支持jpg、png、gif格式，单张图片超过10MB将自动压缩
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Close } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadRawFile } from 'element-plus'
import { getOssSignature, type OssSignature } from '@/api/oss'

interface Props {
  /** 图片URL数组 */
  modelValue: string[]
  /** 是否多图模式 */
  multiple?: boolean
  /** 最大上传数量 */
  limit?: number
  /** OSS上传目录 */
  dir?: string
}

const props = withDefaults(defineProps<Props>(), {
  multiple: true,
  limit: 5,
  dir: 'products',
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
}>()

const uploadRef = ref()
const uploading = ref(false)
const uploadProgress = ref(0)

/** 是否还可以继续上传 */
const canUpload = computed(() => {
  return props.modelValue.length < props.limit
})

/** 上传按钮文字 */
const uploadText = computed(() => {
  if (props.multiple) {
    return props.modelValue.length === 0 ? '点击上传' : '继续添加'
  }
  return '点击上传'
})

/** 压缩图片 */
const compressImage = async (file: File, maxSizeMB: number = 10): Promise<File> => {
  // 如果文件小于限制，直接返回
  const maxSize = maxSizeMB * 1024 * 1024
  if (file.size <= maxSize) return file

  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const img = new Image()
      img.onload = () => {
        const canvas = document.createElement('canvas')
        const ctx = canvas.getContext('2d')
        if (!ctx) {
          reject(new Error('无法创建canvas上下文'))
          return
        }

        // 计算压缩比例
        const ratio = Math.sqrt(maxSize / file.size)
        canvas.width = Math.floor(img.width * ratio)
        canvas.height = Math.floor(img.height * ratio)

        // 使用更好的图像质量设置
        ctx.imageSmoothingEnabled = true
        ctx.imageSmoothingQuality = 'high'

        ctx.drawImage(img, 0, 0, canvas.width, canvas.height)

        // 根据原图类型导出
        const mimeType = file.type || 'image/jpeg'
        const quality = mimeType === 'image/png' ? undefined : 0.92

        canvas.toBlob(
          (blob) => {
            if (blob) {
              const compressedFile = new File([blob], file.name, { type: mimeType })
              console.log(`图片压缩: ${(file.size / 1024 / 1024).toFixed(2)}MB → ${(compressedFile.size / 1024 / 1024).toFixed(2)}MB`)
              resolve(compressedFile)
            } else {
              reject(new Error('图片压缩失败'))
            }
          },
          mimeType,
          quality
        )
      }
      img.onerror = () => reject(new Error('图片加载失败'))
      img.src = e.target?.result as string
    }
    reader.onerror = () => reject(new Error('文件读取失败'))
    reader.readAsDataURL(file)
  })
}

/** 上传单张图片到OSS */
const uploadToOss = async (file: File, signature: OssSignature): Promise<string> => {
  // 生成唯一文件名
  const timestamp = Date.now()
  const random = Math.random().toString(36).substring(2, 8)
  const ext = file.name.split('.').pop() || 'jpg'
  const filename = `${timestamp}_${random}.${ext}`
  const key = `${props.dir}/${filename}`

  // 构造FormData
  const formData = new FormData()
  formData.append('success_action_status', '200')
  formData.append('policy', signature.policy)
  formData.append('x-oss-signature', signature.signature)
  formData.append('x-oss-signature-version', 'OSS4-HMAC-SHA256')
  formData.append('x-oss-credential', signature.x_oss_credential)
  formData.append('x-oss-date', signature.x_oss_date)
  formData.append('key', key)
  formData.append('x-oss-security-token', signature.security_token)
  formData.append('file', file) // file必须放在最后

  // 发送上传请求
  const response = await fetch(signature.host, {
    method: 'POST',
    body: formData,
  })

  if (!response.ok) {
    throw new Error(`上传失败: ${response.status}`)
  }

  // 返回完整的图片URL
  return `${signature.host}/${key}`
}

/** 处理文件选择 */
const handleFileChange = async (uploadFile: UploadFile) => {
  const rawFile = uploadFile.raw
  if (!rawFile) return

  // 校验文件类型
  if (!rawFile.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件')
    return
  }

  uploading.value = true
  uploadProgress.value = 0

  try {
    // 步骤1: 压缩图片（如需要）
    uploadProgress.value = 10
    const compressedFile = await compressImage(rawFile)

    // 步骤2: 获取OSS签名
    uploadProgress.value = 30
    const signature = await getOssSignature()

    // 步骤3: 上传到OSS
    uploadProgress.value = 60
    const imageUrl = await uploadToOss(compressedFile, signature)

    // 步骤4: 更新图片列表
    uploadProgress.value = 100
    const newList = [...props.modelValue, imageUrl]
    emit('update:modelValue', newList)

    ElMessage.success('上传成功')
  } catch (error: any) {
    console.error('上传失败:', error)
    ElMessage.error(error.message || '上传失败，请重试')
  } finally {
    uploading.value = false
    uploadProgress.value = 0
    // 清除上传组件的文件列表
    uploadRef.value?.clearFiles?.()
  }
}

/** 处理超出限制 */
const handleExceed = () => {
  ElMessage.warning(`最多上传${props.limit}张图片`)
}

/** 删除图片 */
const removeImage = (index: number) => {
  const newList = [...props.modelValue]
  newList.splice(index, 1)
  emit('update:modelValue', newList)
}
</script>

<style scoped lang="scss">
.image-upload {
  width: 100%;
}

.image-list {
  display: flex;
  flex-wrap: wrap;
  gap: 12px;
}

.image-item {
  position: relative;
  width: 120px;
  height: 120px;
  border-radius: 8px;
  overflow: hidden;
  border: 2px solid #dcdfe6;
  transition: all 0.3s;

  &.is-main {
    border-color: #409eff;
    box-shadow: 0 0 0 2px rgba(64, 158, 255, 0.2);
  }

  &:hover {
    .image-actions {
      opacity: 1;
    }
  }
}

.preview-image {
  width: 100%;
  height: 100%;
}

.main-badge {
  position: absolute;
  top: 0;
  left: 0;
  background: #409eff;
  color: #fff;
  font-size: 12px;
  padding: 2px 8px;
  border-bottom-right-radius: 8px;
}

.image-actions {
  position: absolute;
  top: 0;
  right: 0;
  bottom: 0;
  left: 0;
  background: rgba(0, 0, 0, 0.4);
  display: flex;
  align-items: center;
  justify-content: center;
  opacity: 0;
  transition: opacity 0.3s;
}

.delete-btn {
  width: 32px;
  height: 32px;
  background: #f56c6c;
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 16px;

  &:hover {
    background: #f78989;
  }
}

.upload-btn {
  :deep(.el-upload) {
    display: block;
  }
}

.upload-trigger {
  width: 120px;
  height: 120px;
  border: 2px dashed #dcdfe6;
  border-radius: 8px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  cursor: pointer;
  transition: all 0.3s;

  &:hover {
    border-color: #409eff;
    color: #409eff;
  }
}

.upload-icon {
  font-size: 28px;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 12px;
}

.upload-progress {
  margin-top: 12px;
}

.progress-text {
  font-size: 12px;
  color: #909399;
  margin-left: 8px;
}

.upload-tip {
  font-size: 12px;
  color: #909399;
  margin: 8px 0 0;
  line-height: 1.5;
}
</style>

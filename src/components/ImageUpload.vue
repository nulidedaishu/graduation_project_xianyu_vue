<template>
  <div class="image-upload">
    <!-- 图片预览列表 -->
    <div class="image-list">
      <div
        v-for="(img, index) in displayImages"
        :key="img.url + index"
        class="image-item"
      >
        <el-image
          :src="img.url"
          fit="cover"
          class="preview-image"
          :preview-src-list="displayImages.map(i => i.url)"
          :initial-index="index"
        />
        <!-- 删除按钮 - 固定在右上角 -->
        <div class="delete-btn-wrapper" @click.stop="removeImage(index)">
          <el-icon class="delete-btn">
            <Close v-if="img.uploaded" />
            <RefreshLeft v-else />
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
      <span v-if="!uploading && localFiles.length > 0">已选择{{ localFiles.length }}张图片，</span>
      <span v-if="multiple && modelValue.length > 0">第一张图片将作为主图，</span>
      支持 jpg、png、gif 格式，单张图片超过 10MB 将自动压缩
    </p>
  </div>
</template>

<script setup lang="ts">
import { ref, computed } from 'vue'
import { Plus, Close, RefreshLeft } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadFile, UploadRawFile } from 'element-plus'
import { getOssSignature, type OssSignature } from '@/api/oss'

interface ImageFile {
  /** 临时预览 URL */
  url: string
  /** 原始文件对象 */
  file: File
  /** 是否已上传到 OSS */
  uploaded: boolean
  /** OSS URL（上传后才有） */
  ossUrl?: string
}

interface Props {
  /** 图片 URL 数组（OSS 地址） */
  modelValue: string[]
  /** 是否多图模式 */
  multiple?: boolean
  /** 最大上传数量 */
  limit?: number
  /** OSS 上传目录 */
  dir?: string
}

const props = withDefaults(defineProps<Props>(), {
  multiple: true,
  limit: 5,
  dir: 'products',
})

const emit = defineEmits<{
  'update:modelValue': [value: string[]]
  'files-change': [files: ImageFile[]] // 新增：通知父组件本地文件变化
}>()

const uploadRef = ref()
const uploading = ref(false)
const uploadProgress = ref(0)

/** 本地图片文件列表（未上传到 OSS） */
const localFiles = ref<ImageFile[]>([])

/** 是否还可以继续上传 */
const canUpload = computed(() => {
  const totalImages = props.modelValue.length + localFiles.value.length
  return totalImages < props.limit
})

/** 上传按钮文字 */
const uploadText = computed(() => {
  if (props.multiple) {
    return props.modelValue.length === 0 ? '点击上传' : '继续添加'
  }
  return '点击上传'
})

/** 显示用的图片列表（合并已上传和未上传的） */
const displayImages = computed(() => {
  // 已上传的 OSS 图片
  const ossImages = props.modelValue.map(url => ({ url, uploaded: true }))
  // 未上传的本地图片
  const localImages = localFiles.value.map(f => ({ url: f.url, uploaded: false }))
  return [...ossImages, ...localImages]
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

/** 处理文件选择 - 只保存本地，不立即上传 */
const handleFileChange = async (uploadFile: UploadFile) => {
  const rawFile = uploadFile.raw
  if (!rawFile) return

  // 校验文件类型
  if (!rawFile.type.startsWith('image/')) {
    ElMessage.error('请上传图片文件')
    return
  }

  try {
    // 压缩图片（如需要）
    const compressedFile = await compressImage(rawFile)
    
    // 生成临时预览 URL
    const tempUrl = URL.createObjectURL(compressedFile)
    
    // 保存到本地文件列表
    const imageFile: ImageFile = {
      url: tempUrl,
      file: compressedFile,
      uploaded: false,
    }
    
    localFiles.value.push(imageFile)
    
    // 通知父组件文件变化
    emit('files-change', localFiles.value)
    
    ElMessage.success('图片已添加，请点击提交按钮上传')
  } catch (error: any) {
    console.error('图片处理失败:', error)
    ElMessage.error(error.message || '图片处理失败')
  }
}

/** 处理超出限制 */
const handleExceed = () => {
  ElMessage.warning(`最多上传${props.limit}张图片`)
}

/** 删除图片 */
const removeImage = (index: number) => {
  // 计算在哪个数组中
  const ossCount = props.modelValue.length
  
  if (index < ossCount) {
    // 删除已上传的 OSS 图片
    const newList = [...props.modelValue]
    newList.splice(index, 1)
    emit('update:modelValue', newList)
  } else {
    // 删除未上传的本地图片
    const localIndex = index - ossCount
    const fileToRemove = localFiles.value[localIndex]
    
    // 释放临时 URL
    if (fileToRemove.url.startsWith('blob:')) {
      URL.revokeObjectURL(fileToRemove.url)
    }
    
    localFiles.value.splice(localIndex, 1)
    
    // 通知父组件文件变化
    emit('files-change', localFiles.value)
  }
}

/** 批量上传所有本地图片到 OSS */
const uploadAllImages = async (): Promise<string[]> => {
  if (localFiles.value.length === 0) {
    // 没有本地文件，直接返回已有的 OSS URL
    return props.modelValue
  }

  uploading.value = true
  uploadProgress.value = 0

  try {
    // 步骤 1: 获取 OSS签名
    uploadProgress.value = 10
    const signature = await getOssSignature()

    // 步骤 2: 批量上传所有图片
    const uploadedUrls: string[] = []
    const totalFiles = localFiles.value.length
    
    for (let i = 0; i < totalFiles; i++) {
      const imageFile = localFiles.value[i]
      
      // 如果已经上传过，跳过
      if (imageFile.uploaded && imageFile.ossUrl) {
        uploadedUrls.push(imageFile.ossUrl)
        continue
      }
      
      // 上传单张图片
      const progressPerFile = 90 / totalFiles
      const startProgress = 10 + (i * progressPerFile)
      uploadProgress.value = startProgress
      
      const ossUrl = await uploadToOss(imageFile.file, signature)
      uploadedUrls.push(ossUrl)
      
      // 标记为已上传
      imageFile.uploaded = true
      imageFile.ossUrl = ossUrl
      
      // 释放临时 URL
      URL.revokeObjectURL(imageFile.url)
    }
    
    // 步骤 3: 更新进度
    uploadProgress.value = 100
    
    // 步骤 4: 合并所有 URL（已有的 + 新上传的）
    const allUrls = [...props.modelValue, ...uploadedUrls]
    emit('update:modelValue', allUrls)
    
    // 步骤 5: 清空本地文件列表
    localFiles.value = []
    
    ElMessage.success(`成功上传${totalFiles}张图片`)
    
    return allUrls
  } catch (error: any) {
    console.error('批量上传失败:', error)
    ElMessage.error(error.message || '上传失败，请重试')
    throw error // 向上传播错误
  } finally {
    uploading.value = false
    uploadProgress.value = 0
    uploadRef.value?.clearFiles?.()
  }
}

// 暴露方法给父组件调用
defineExpose({
  uploadAllImages,
})
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

  &:hover {
    border-color: #c0c4cc;
  }
}

.preview-image {
  width: 100%;
  height: 100%;
  cursor: pointer;
}

.delete-btn-wrapper {
  position: absolute;
  top: 4px;
  right: 4px;
  z-index: 10;
}

.delete-btn {
  width: 24px;
  height: 24px;
  background: rgba(0, 0, 0, 0.6);
  color: #fff;
  border-radius: 50%;
  cursor: pointer;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  transition: all 0.3s;

  &:hover {
    background: rgba(245, 108, 108, 0.8);
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

<template>
  <div class="message-view">
    <div class="page-header">
      <h1>消息中心</h1>
    </div>

    <div class="message-layout">
      <!-- 左侧：会话列表 -->
      <div class="session-list-container">
        <div class="session-list-header">
          <span class="title">会话列表</span>
          <el-badge
            v-if="messageStore.totalUnreadCount.total > 0"
            :value="messageStore.totalUnreadCount.total"
            class="total-badge"
          />
        </div>

        <div ref="sessionListRef" class="session-list" @scroll="handleSessionScroll">
          <!-- 系统通知会话（置顶） -->
          <div
            v-if="messageStore.systemSession"
            class="session-item system-session"
            :class="{ active: messageStore.currentSession?.sessionId === 'system' }"
            @click="selectSession(messageStore.systemSession)"
          >
            <div class="session-avatar system-avatar">
              <el-icon :size="24"><Bell /></el-icon>
            </div>
            <div class="session-info">
              <div class="session-header">
                <span class="session-name">{{ messageStore.systemSession.systemTitle }}</span>
                <span class="session-time">{{ formatTime(messageStore.systemSession.lastMessageTime) }}</span>
              </div>
              <div class="session-preview">
                {{ messageStore.systemSession.lastMessage }}
              </div>
            </div>
            <el-badge
              v-if="messageStore.systemSession.unreadCount > 0"
              :value="messageStore.systemSession.unreadCount"
              class="unread-badge"
            />
          </div>

          <!-- 用户聊天会话 -->
          <div
            v-for="session in messageStore.userSessions"
            :key="session.sessionId"
            class="session-item"
            :class="{ active: messageStore.currentSession?.sessionId === session.sessionId }"
            @click="selectSession(session)"
          >
            <!-- 删除按钮 -->
            <div
              class="delete-btn"
              @click.stop="handleDeleteSession(session)"
              title="删除会话"
            >
              <el-icon><Close /></el-icon>
            </div>
            <el-avatar :size="48" :src="session.otherUserAvatar">
              {{ session.otherUserName?.charAt(0) || 'U' }}
            </el-avatar>
            <div class="session-info">
              <div class="session-header">
                <span class="session-name">{{ session.otherUserName }}</span>
                <span class="session-time">{{ formatTime(session.lastMessageTime) }}</span>
              </div>
              <div class="session-preview">
                <span v-if="session.productTitle" class="product-tag">[{{ session.productTitle }}]</span>
                <span v-if="session.lastMsgType === 1" class="msg-type">[图片]</span>
                {{ session.lastMessage || '暂无消息' }}
              </div>
            </div>
            <el-badge
              v-if="session.unreadCount > 0"
              :value="session.unreadCount"
              class="unread-badge"
            />
          </div>

          <!-- 加载更多 -->
          <div v-if="messageStore.isLoadingSessions" class="loading-more">
            <el-icon class="is-loading"><Loading /></el-icon>
            <span>加载中...</span>
          </div>

          <el-empty v-if="!messageStore.sessions.length && !messageStore.isLoadingSessions" description="暂无会话" />
        </div>
      </div>

      <!-- 右侧：消息内容区 -->
      <div class="message-content-container">
        <template v-if="messageStore.currentSession">
          <!-- 会话头部 -->
          <div class="content-header">
            <template v-if="messageStore.currentSession.sessionType === 'system'">
              <div class="header-info">
                <el-icon :size="20"><Bell /></el-icon>
                <span>{{ messageStore.currentSession.systemTitle }}</span>
              </div>
              <el-button
                v-if="messageStore.currentSession.unreadCount > 0"
                link
                type="primary"
                @click="markAllNoticesRead"
              >
                全部已读
              </el-button>
            </template>
            <template v-else>
              <div class="header-info">
                <el-avatar :size="32" :src="messageStore.currentSession.otherUserAvatar">
                  {{ messageStore.currentSession.otherUserName?.charAt(0) || 'U' }}
                </el-avatar>
                <span>{{ messageStore.currentSession.otherUserName }}</span>
              </div>
              <el-button
                v-if="messageStore.currentSession.productId"
                link
                type="primary"
                @click="viewProduct(messageStore.currentSession.productId!)"
              >
                查看商品
              </el-button>
            </template>
          </div>

          <!-- 消息列表 -->
          <div ref="messageListRef" class="message-list" @scroll="handleMessageScroll">
            <!-- 加载更多 -->
            <div v-if="messageStore.isLoadingMessages" class="loading-more">
              <el-icon class="is-loading"><Loading /></el-icon>
              <span>加载更多...</span>
            </div>

            <!-- 系统通知消息 -->
            <template v-if="messageStore.currentSession.sessionType === 'system'">
              <div
                v-for="notice in messageStore.currentMessages"
                :key="notice.id"
                class="notice-item"
                :class="{ unread: !notice.isRead }"
              >
                <div class="notice-header">
                  <el-tag :type="getNoticeTypeTag(notice.type)" size="small">{{ notice.typeDesc }}</el-tag>
                  <span class="notice-time">{{ formatDate(notice.createTime) }}</span>
                </div>
                <div class="notice-title">{{ notice.title }}</div>
                <div v-if="notice.content" class="notice-content">{{ notice.content }}</div>
              </div>
            </template>

            <!-- 用户聊天消息 -->
            <template v-else>
              <div
                v-for="msg in messageStore.currentMessages"
                :key="msg.id"
                class="chat-message"
                :class="{ self: msg.senderId === userStore.userInfo?.id }"
              >
                <el-avatar
                  :size="36"
                  :src="msg.senderId === userStore.userInfo?.id ? userStore.userInfo?.avatar : messageStore.currentSession.otherUserAvatar"
                >
                  {{ (msg.senderName || 'U').charAt(0) }}
                </el-avatar>
                <div class="message-bubble">
                  <div class="message-content">{{ msg.content }}</div>
                  <div class="message-time">{{ formatTime(msg.createTime) }}</div>
                </div>
              </div>
            </template>

            <el-empty
              v-if="!messageStore.currentMessages.length && !messageStore.isLoadingMessages"
              :description="messageStore.currentSession.sessionType === 'system' ? '暂无通知' : '暂无聊天记录'"
            />
          </div>

          <!-- 输入框（仅用户聊天显示） -->
          <div v-if="messageStore.currentSession.sessionType === 'user'" class="message-input-area">
            <el-input
              v-model="newMessage"
              type="textarea"
              :rows="3"
              placeholder="输入消息..."
              resize="none"
              @keyup.enter.prevent="sendMessage"
            />
            <el-button type="primary" :disabled="!newMessage.trim()" @click="sendMessage">
              发送
            </el-button>
          </div>
        </template>

        <!-- 未选择会话时的占位 -->
        <div v-else class="empty-content">
          <el-empty description="选择一个会话开始聊天">
            <template #image>
              <el-icon :size="64" color="#dcdfe6"><ChatDotRound /></el-icon>
            </template>
          </el-empty>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { useRouter } from 'vue-router'
import { Bell, ChatDotRound, Loading, Close } from '@element-plus/icons-vue'
import { useUserStore } from '@/stores'
import { useMessageStore } from '@/stores/message'
import { useWebSocket } from '@/composables/useWebSocket'
import type { UnifiedSession, Notice, ChatMessage } from '@/types/api'
import { markAllNoticesRead as markAllNoticesReadApi } from '@/api/notice'

const router = useRouter()
const userStore = useUserStore()
const messageStore = useMessageStore()

// Refs
const sessionListRef = ref<HTMLElement>()
const messageListRef = ref<HTMLElement>()
const newMessage = ref('')

// 初始化 WebSocket 连接
const { sendMessage: sendWsMessage } = useWebSocket({
  onMessage: (message: ChatMessage) => {
    // 处理新消息（handleNewMessage 内部会刷新未读数）
    messageStore.handleNewMessage(message, 'chat')
  },
  onConnect: () => {
    console.log('WebSocket 连接成功')
  },
  onError: (error) => {
    console.error('WebSocket 错误:', error)
  },
})

// 初始化
onMounted(() => {
  // 加载会话列表
  messageStore.fetchSessions()
  messageStore.fetchTotalUnreadCount()
})

// 选择会话
async function selectSession(session: UnifiedSession) {
  await messageStore.selectSession(session)

  // 滚动到底部
  setTimeout(() => {
    scrollToBottom()
  }, 100)
}

// 发送消息
async function sendMessage() {
  if (!newMessage.value.trim()) return
  if (!messageStore.currentSession || messageStore.currentSession.sessionType !== 'user') return

  const content = newMessage.value.trim()
  const currentUser = userStore.userInfo

  // 乐观更新：先创建临时消息并显示在列表中
  // 使用负数临时ID，方便后续被真实消息替换
  const tempId = -Date.now()
  const tempMessage: ChatMessage = {
    id: tempId,
    sessionId: messageStore.currentSession.sessionId,
    senderId: Number(currentUser?.id) || 0,
    senderName: currentUser?.nickname,
    senderAvatar: currentUser?.avatar,
    receiverId: messageStore.currentSession.otherUserId!,
    receiverName: messageStore.currentSession.otherUserName,
    productId: messageStore.currentSession.productId,
    productName: messageStore.currentSession.productTitle,
    content: content,
    messageType: 1, // 文字消息
    isRead: false,
    createTime: new Date().toISOString(),
  }

  // 立即清空输入框并添加到消息列表
  newMessage.value = ''
  messageStore.currentMessages.push(tempMessage)

  // 滚动到底部
  setTimeout(() => {
    scrollToBottom()
  }, 0)

  // 通过 WebSocket 发送消息
  const success = sendWsMessage(
    messageStore.currentSession.otherUserId!,
    content,
    messageStore.currentSession.productId
  )

  if (!success) {
    // WebSocket 发送失败，回退到 HTTP API
    try {
      const sentMessage = await messageStore.sendMessage(content)
      // 成功发送后，用真实消息替换临时消息
      if (sentMessage) {
        const index = messageStore.currentMessages.findIndex(m => m.id === tempId)
        if (index > -1) {
          messageStore.currentMessages.splice(index, 1, sentMessage)
        }
      }
    } catch (error) {
      // 发送失败，移除临时消息并提示
      const index = messageStore.currentMessages.findIndex(m => m.id === tempId)
      if (index > -1) {
        messageStore.currentMessages.splice(index, 1)
      }
      ElMessage.error('发送失败，请重试')
      return
    }
  }

  // 更新会话列表的最后消息
  messageStore.currentSession.lastMessage = content
  messageStore.currentSession.lastMsgType = 0
  messageStore.currentSession.lastMessageTime = tempMessage.createTime

  // 再次滚动到底部确保消息可见
  setTimeout(() => {
    scrollToBottom()
  }, 100)
}

// 标记所有通知已读
async function markAllNoticesRead() {
  try {
    await markAllNoticesReadApi()
    messageStore.currentSession!.unreadCount = 0
    messageStore.currentMessages.forEach((msg: any) => {
      msg.isRead = true
    })
    messageStore.fetchTotalUnreadCount()
    ElMessage.success('已全部标记为已读')
  } catch (error) {
    console.error('标记全部已读失败:', error)
  }
}

// 查看商品
function viewProduct(productId: number) {
  router.push(`/product/${productId}`)
}

// 删除会话
async function handleDeleteSession(session: UnifiedSession) {
  try {
    await ElMessageBox.confirm(
      `确定要删除与 "${session.otherUserName}" 的会话吗？此操作不可恢复。`,
      '删除会话',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger',
      }
    )

    await messageStore.deleteSession(session.sessionId)
    ElMessage.success('会话已删除')
  } catch (error: any) {
    if (error !== 'cancel') {
      console.error('删除会话失败:', error)
      ElMessage.error(error?.response?.data?.message || '删除会话失败')
    }
  }
}

// 处理会话列表滚动（加载更多）
function handleSessionScroll(e: Event) {
  const target = e.target as HTMLElement
  const scrollBottom = target.scrollHeight - target.scrollTop - target.clientHeight

  if (scrollBottom < 50 && messageStore.hasMoreSessions && !messageStore.isLoadingSessions) {
    messageStore.loadMoreSessions()
  }
}

// 处理消息列表滚动（加载更多历史消息）
function handleMessageScroll(e: Event) {
  const target = e.target as HTMLElement

  // 滚动到顶部时加载更多
  if (target.scrollTop < 50 && messageStore.hasMoreMessages && !messageStore.isLoadingMessages) {
    // 保存当前滚动位置
    const oldHeight = target.scrollHeight

    messageStore.loadMoreMessages().then(() => {
      // 恢复滚动位置
      setTimeout(() => {
        target.scrollTop = target.scrollHeight - oldHeight
      }, 0)
    })
  }
}

// 滚动到底部
function scrollToBottom() {
  if (messageListRef.value) {
    messageListRef.value.scrollTop = messageListRef.value.scrollHeight
  }
}

// 获取通知类型标签
function getNoticeTypeTag(type: number) {
  const map: Record<number, string> = {
    1: 'warning',
    2: 'success',
    3: 'info',
  }
  return map[type] || 'info'
}

// 格式化日期
function formatDate(dateStr?: string) {
  if (!dateStr) return '-'
  return new Date(dateStr).toLocaleString('zh-CN')
}

// 格式化时间（简短）
function formatTime(dateStr?: string) {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  const now = new Date()
  const diff = now.getTime() - date.getTime()

  // 今天内显示时间
  if (diff < 24 * 60 * 60 * 1000 && date.getDate() === now.getDate()) {
    return date.toLocaleTimeString('zh-CN', { hour: '2-digit', minute: '2-digit' })
  }
  // 昨天显示昨天
  if (diff < 48 * 60 * 60 * 1000 && date.getDate() === now.getDate() - 1) {
    return '昨天'
  }
  // 其他显示日期
  return date.toLocaleDateString('zh-CN', { month: 'short', day: 'numeric' })
}
</script>

<style scoped lang="scss">
.message-view {
  height: calc(100vh - 140px);
  display: flex;
  flex-direction: column;

  .page-header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 20px;

    h1 {
      font-size: 24px;
      color: #303133;
      margin: 0;
    }
  }

  .message-layout {
    display: flex;
    flex: 1;
    gap: 16px;
    overflow: hidden;
  }

  // 左侧会话列表
  .session-list-container {
    width: 320px;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;

    .session-list-header {
      padding: 16px;
      border-bottom: 1px solid #ebeef5;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .title {
        font-weight: 600;
        font-size: 16px;
        color: #303133;
      }
    }

    .session-list {
      flex: 1;
      overflow-y: auto;
      padding: 8px;

      .session-item {
        display: flex;
        align-items: center;
        gap: 12px;
        padding: 12px;
        border-radius: 8px;
        cursor: pointer;
        transition: all 0.2s;
        margin-bottom: 4px;
        position: relative;

        &:hover {
          background: #f5f7fa;
        }

        &.active {
          background: #ecf5ff;
        }

        .delete-btn {
          position: absolute;
          left: 4px;
          top: 50%;
          transform: translateY(-50%);
          width: 20px;
          height: 20px;
          border-radius: 50%;
          background: #f56c6c;
          color: #fff;
          display: flex;
          align-items: center;
          justify-content: center;
          cursor: pointer;
          opacity: 0;
          transition: opacity 0.2s, background 0.2s;
          font-size: 12px;
          z-index: 1;

          &:hover {
            background: #f78989;
          }
        }

        &:hover .delete-btn {
          opacity: 1;
        }

        &.system-session {
          border-bottom: 1px solid #ebeef5;
          margin-bottom: 8px;
          padding-bottom: 16px;

          .system-avatar {
            background: #409eff;
            color: #fff;
            width: 48px;
            height: 48px;
            border-radius: 50%;
            display: flex;
            align-items: center;
            justify-content: center;
          }
        }

        .session-info {
          flex: 1;
          min-width: 0;

          .session-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 4px;

            .session-name {
              font-weight: 500;
              color: #303133;
              overflow: hidden;
              text-overflow: ellipsis;
              white-space: nowrap;
            }

            .session-time {
              font-size: 12px;
              color: #909399;
              flex-shrink: 0;
            }
          }

          .session-preview {
            font-size: 13px;
            color: #606266;
            overflow: hidden;
            text-overflow: ellipsis;
            white-space: nowrap;

            .product-tag {
              color: #409eff;
              margin-right: 4px;
            }

            .msg-type {
              color: #909399;
              margin-right: 4px;
            }
          }
        }

        .unread-badge {
          flex-shrink: 0;
        }
      }
    }
  }

  // 右侧消息内容区
  .message-content-container {
    flex: 1;
    background: #fff;
    border-radius: 8px;
    box-shadow: 0 2px 12px rgba(0, 0, 0, 0.1);
    display: flex;
    flex-direction: column;
    overflow: hidden;

    .content-header {
      padding: 16px 20px;
      border-bottom: 1px solid #ebeef5;
      display: flex;
      justify-content: space-between;
      align-items: center;

      .header-info {
        display: flex;
        align-items: center;
        gap: 12px;
        font-weight: 500;
        font-size: 16px;
        color: #303133;
      }
    }

    .message-list {
      flex: 1;
      overflow-y: auto;
      padding: 20px;
      background: #f5f5f5;

      .loading-more {
        text-align: center;
        padding: 12px;
        color: #909399;
        font-size: 13px;
        display: flex;
        align-items: center;
        justify-content: center;
        gap: 8px;
      }

      // 通知样式
      .notice-item {
        background: #fff;
        border-radius: 8px;
        padding: 16px;
        margin-bottom: 12px;
        box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);

        &.unread {
          background: #ecf5ff;
          border-left: 3px solid #409eff;
        }

        .notice-header {
          display: flex;
          justify-content: space-between;
          align-items: center;
          margin-bottom: 8px;
        }

        .notice-title {
          font-weight: 500;
          color: #303133;
          margin-bottom: 8px;
        }

        .notice-content {
          color: #606266;
          font-size: 14px;
          line-height: 1.6;
        }

        .notice-time {
          font-size: 12px;
          color: #909399;
        }
      }

      // 聊天消息样式
      .chat-message {
        display: flex;
        gap: 12px;
        margin-bottom: 16px;

        &.self {
          flex-direction: row-reverse;

          .message-bubble {
            align-items: flex-end;

            .message-content {
              background: #95ec69;
              color: #000;
            }
          }
        }

        .message-bubble {
          display: flex;
          flex-direction: column;
          max-width: 60%;

          .message-content {
            background: #fff;
            padding: 10px 14px;
            border-radius: 8px;
            word-break: break-word;
            box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
            line-height: 1.5;
          }

          .message-time {
            font-size: 12px;
            color: #999;
            margin-top: 4px;
          }
        }
      }
    }

    .message-input-area {
      padding: 16px 20px;
      border-top: 1px solid #ebeef5;
      display: flex;
      gap: 12px;
      align-items: flex-end;

      .el-textarea {
        flex: 1;
      }

      .el-button {
        margin-bottom: 4px;
      }
    }

    .empty-content {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
    }
  }

  .loading-more {
    text-align: center;
    padding: 16px;
    color: #909399;
    font-size: 13px;
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 8px;
  }
}
</style>

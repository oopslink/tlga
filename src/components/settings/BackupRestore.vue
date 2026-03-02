<template>
  <div class="backup-restore">
    <div class="section">
      <h3>💾 导出备份</h3>
      <p class="description">将所有数据导出到本地文件，可用于数据迁移或备份</p>
      <button class="btn btn-primary" @click="handleExport" :disabled="exporting">
        {{ exporting ? '导出中...' : '📥 下载备份文件' }}
      </button>
    </div>

    <div class="section-divider"></div>

    <div class="section">
      <h3>📤 导入备份</h3>
      <p class="description">从备份文件恢复数据，支持合并或完全替换</p>
      
      <div class="import-options">
        <label class="file-input-label">
          <input
            type="file"
            accept=".json"
            @change="handleFileSelect"
            ref="fileInput"
            style="display: none"
          />
          <span class="btn btn-secondary">
            {{ selectedFile ? selectedFile.name : '📂 选择备份文件' }}
          </span>
        </label>
        
        <span v-if="selectedFile" class="file-info">
          {{ formatFileSize(selectedFile.size) }}
        </span>
      </div>

      <div v-if="selectedFile && previewData" class="preview">
        <div class="preview-header">
          <span class="preview-title">备份信息</span>
          <span class="preview-date">{{ new Date(previewData.exportedAt).toLocaleString() }}</span>
        </div>
        <div class="preview-stats">
          <span>共 {{ Object.keys(previewData.data).length }} 个文件</span>
        </div>
      </div>

      <div v-if="selectedFile" class="import-actions">
        <button class="btn btn-success" @click="handleImportMerge" :disabled="importing">
          ➕ 合并导入 (跳过已有)
        </button>
        <button class="btn btn-danger" @click="handleImportReplace" :disabled="importing">
          🔄 完全替换 (会丢失现有数据)
        </button>
      </div>
    </div>

    <div v-if="message" :class="['message', messageType]">
      {{ message }}
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref } from 'vue'
import { useModal } from '@/composables/useModal'
import {
  exportAllData,
  importAllData,
  replaceAllData,
  downloadBackup,
  validateBackupFile,
  type BackupData,
} from '@/services/backup'

const { showConfirm, showAlert } = useModal()

const fileInput = ref<HTMLInputElement>()
const selectedFile = ref<File | null>(null)
const previewData = ref<BackupData | null>(null)
const exporting = ref(false)
const importing = ref(false)
const message = ref('')
const messageType = ref<'success' | 'error'>('success')

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' B'
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB'
  return (bytes / (1024 * 1024)).toFixed(1) + ' MB'
}

async function handleExport() {
  exporting.value = true
  message.value = ''
  
  try {
    const data = await exportAllData()
    downloadBackup(data)
    message.value = '备份文件已下载！'
    messageType.value = 'success'
  } catch (e) {
    message.value = '导出失败: ' + (e as Error).message
    messageType.value = 'error'
  } finally {
    exporting.value = false
  }
}

async function handleFileSelect(event: Event) {
  const target = event.target as HTMLInputElement
  const file = target.files?.[0]
  
  if (!file) {
    selectedFile.value = null
    previewData.value = null
    return
  }
  
  selectedFile.value = file
  message.value = ''
  
  try {
    previewData.value = await validateBackupFile(file)
  } catch (e) {
    message.value = '文件验证失败: ' + (e as Error).message
    messageType.value = 'error'
    selectedFile.value = null
    previewData.value = null
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  }
}

async function handleImportMerge() {
  if (!previewData.value) return
  
  const confirmed = await showConfirm(
    `确定要合并导入吗？\n\n将导入 ${Object.keys(previewData.value.data).length} 条数据（已有数据不会被覆盖）`
  )
  
  if (!confirmed) return
  
  importing.value = true
  message.value = ''
  
  try {
    const result = await importAllData(previewData.value)
    message.value = `导入成功！新增 ${result.imported} 条数据，跳过 ${result.skipped} 条已有数据`
    messageType.value = 'success'
    selectedFile.value = null
    previewData.value = null
    
    if (fileInput.value) {
      fileInput.value.value = ''
    }
  } catch (e) {
    message.value = '导入失败: ' + (e as Error).message
    messageType.value = 'error'
  } finally {
    importing.value = false
  }
}

async function handleImportReplace() {
  if (!previewData.value) return

  const confirmed = await showConfirm(
    '此操作将完全替换所有现有数据，且无法撤销！\n\n请确保已导出当前数据的备份，再继续操作。',
    '⚠️ 危险操作 - 无法撤销'
  )

  if (!confirmed) return

  importing.value = true
  message.value = ''

  try {
    replaceAllData(previewData.value)
    message.value = '数据已完全替换！正在重新加载页面...'
    messageType.value = 'success'
    selectedFile.value = null
    previewData.value = null

    if (fileInput.value) {
      fileInput.value.value = ''
    }

    setTimeout(() => {
      window.location.reload()
    }, 1500)
  } catch (e) {
    message.value = '导入失败: ' + (e as Error).message
    messageType.value = 'error'
  } finally {
    importing.value = false
  }
}
</script>

<style scoped>
.backup-restore {
  max-width: 600px;
}

.section {
  margin-bottom: 24px;
}

.section h3 {
  font-family: 'Fredoka', sans-serif;
  font-size: 1.25rem;
  color: var(--color-text);
  margin-bottom: 8px;
}

.description {
  color: var(--color-text-dim);
  font-size: 0.9rem;
  margin-bottom: 16px;
}

.btn {
  padding: 10px 20px;
  border: none;
  border-radius: 8px;
  font-family: 'Fredoka', sans-serif;
  font-size: 1rem;
  cursor: pointer;
  transition: all 0.2s ease;
}

.btn:disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.btn-primary {
  background: var(--color-primary);
  color: white;
}

.btn-primary:hover:not(:disabled) {
  background: var(--color-primary-dark, #e0558a);
}

.btn-secondary {
  background: var(--color-secondary);
  color: white;
}

.btn-success {
  background: #4caf50;
  color: white;
}

.btn-success:hover:not(:disabled) {
  background: #43a047;
}

.btn-danger {
  background: #f44336;
  color: white;
}

.btn-danger:hover:not(:disabled) {
  background: #e53935;
}

.file-input-label {
  cursor: pointer;
}

.import-options {
  display: flex;
  align-items: center;
  gap: 16px;
  margin-bottom: 16px;
}

.file-info {
  color: var(--color-text-dim);
  font-size: 0.9rem;
}

.preview {
  background: var(--color-bg-secondary, #f5f5f5);
  border-radius: 8px;
  padding: 16px;
  margin-bottom: 16px;
}

.preview-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 8px;
}

.preview-title {
  font-weight: 600;
}

.preview-date {
  color: var(--color-text-dim);
  font-size: 0.85rem;
}

.preview-stats {
  color: var(--color-text-dim);
  font-size: 0.9rem;
}

.import-actions {
  display: flex;
  gap: 12px;
  flex-wrap: wrap;
}

.message {
  margin-top: 16px;
  padding: 12px 16px;
  border-radius: 8px;
  font-size: 0.95rem;
}

.message.success {
  background: #e8f5e9;
  color: #2e7d32;
}

.message.error {
  background: #ffebee;
  color: #c62828;
}

.section-divider {
  border: none;
  border-top: 2px dashed rgba(255, 107, 157, 0.12);
  margin: 28px 0;
}
</style>

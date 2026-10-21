<script setup lang="ts">
import { onBeforeUnmount, ref } from 'vue'
import { MAX_PHOTOS, validatePhoto } from '../features/photos/files'

defineProps<{ title?: string }>()
const emit = defineEmits<{ change: [photos: Array<{ name: string; url: string }> ] }>()
const photos = ref<Array<{ id: number; name: string; url: string }>>([])
const input = ref<HTMLInputElement>()
const error = ref('')
const busy = ref(false)
const dragging = ref(false)
let nextId = 0
let disposed = false

function notify() { emit('change', photos.value.map(({ name, url }) => ({ name, url }))) }
async function addFiles(files: FileList | null) {
  if (!files || busy.value) return
  error.value = ''
  busy.value = true
  try {
    for (const file of Array.from(files)) {
      if (photos.value.length >= MAX_PHOTOS) { error.value = '最多添加 4 张照片，请先移除已有照片。'; break }
      const problem = validatePhoto(file)
      if (problem) { error.value = `${file.name}：${problem}`; continue }
      const url = URL.createObjectURL(file)
      try {
        const image = new Image()
        image.src = url
        await image.decode()
        if (disposed) { URL.revokeObjectURL(url); break }
        photos.value.push({ id: ++nextId, name: file.name, url })
      } catch {
        URL.revokeObjectURL(url)
        if (!disposed) error.value = '无法读取这张图片，请检查文件是否损坏。'
      }
    }
    if (!disposed) notify()
  } finally {
    busy.value = false
    if (input.value) input.value.value = ''
  }
}
function remove(id: number) {
  const photo = photos.value.find(photo => photo.id === id)
  if (photo) URL.revokeObjectURL(photo.url)
  photos.value = photos.value.filter(photo => photo.id !== id)
  error.value = ''
  notify()
}
function drop(event: DragEvent) { dragging.value = false; void addFiles(event.dataTransfer?.files ?? null) }
onBeforeUnmount(() => { disposed = true; photos.value.forEach(photo => URL.revokeObjectURL(photo.url)) })
</script>

<template>
  <section class="photo-upload" aria-label="作物照片">
    <div class="photo-section-heading"><strong>{{ title || '作物照片' }}</strong><span>{{ photos.length }} / 4 张</span></div>
    <input ref="input" class="photo-file-input" type="file" accept="image/jpeg,image/png,image/webp" multiple aria-label="选择作物照片" @change="addFiles(($event.target as HTMLInputElement).files)" />
    <button class="photo-dropzone" :class="{ 'is-dragging': dragging }" type="button" :disabled="busy || photos.length >= 4" @click="input?.click()" @dragover.prevent="dragging = true" @dragleave.prevent="dragging = false" @drop.prevent="drop">
      <svg viewBox="0 0 48 40" fill="none" aria-hidden="true"><path d="M7 8h10l3-5h9l3 5h9v28H7V8Z" stroke="currentColor" stroke-width="1.6"/><circle cx="24" cy="22" r="8" stroke="currentColor" stroke-width="1.6"/><path d="M36 13h2" stroke="currentColor" stroke-width="2"/></svg>
      <strong>{{ busy ? '正在读取照片…' : photos.length >= 4 ? '已添加 4 张照片' : '添加叶片或田间照片' }}</strong>
      <span>点击选择或拖入 · JPG / PNG / WebP · 每张 ≤ 8 MB</span>
    </button>
    <div v-if="photos.length" class="photo-previews">
      <figure v-for="photo in photos" :key="photo.id"><img :src="photo.url" :alt="photo.name" /><button type="button" :aria-label="`移除照片 ${photo.name}`" @click="remove(photo.id)">×</button><figcaption :title="photo.name">{{ photo.name }}</figcaption></figure>
    </div>
    <p v-if="error" class="photo-error" role="alert">{{ error }}</p>
    <p class="photo-local-note">照片仅在本页预览，尚未发送至识别服务。请结合照片补充症状描述。</p>
  </section>
</template>

<style scoped>
.photo-upload{margin:22px 0}.photo-section-heading{display:flex;justify-content:space-between;gap:12px;margin-bottom:10px;font-size:15px}.photo-section-heading span{color:#717f71;font-size:13px}.photo-file-input{position:absolute;width:1px;height:1px;opacity:0;overflow:hidden;pointer-events:none}.photo-dropzone{display:flex;flex-direction:column;align-items:center;justify-content:center;gap:8px;width:100%;min-height:150px;padding:20px 12px;border:1px dashed #aabfa4;border-radius:10px;background:#f5f8f2;color:#496a48;cursor:pointer;transition:background .15s}.photo-dropzone:hover,.photo-dropzone.is-dragging{background:#e8f0e2;border-color:#587d51}.photo-dropzone:disabled{cursor:default;opacity:.65}.photo-dropzone svg{width:44px;height:37px}.photo-dropzone strong{font-size:15px}.photo-dropzone span{font-size:12px;line-height:1.6;color:#71816d;text-align:center}.photo-previews{display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px;margin-top:12px}.photo-previews figure{position:relative;margin:0;min-width:0}.photo-previews img{width:100%;height:115px;object-fit:cover;border-radius:7px;background:#e4e9e0}.photo-previews figure>button{position:absolute;right:5px;top:5px;width:27px;height:27px;border:1px solid #ffffff80;border-radius:50%;background:#203424dd;color:#fff;cursor:pointer;font-size:20px;line-height:1}.photo-previews figcaption{font-size:12px;color:#71816d;white-space:nowrap;overflow:hidden;text-overflow:ellipsis;margin-top:4px}.photo-local-note{margin:10px 0 0;color:#717f71;font-size:12px;line-height:1.75}.photo-error{font-size:13px;color:#ad4b3c;margin:8px 0}
</style>

<script setup lang="ts">
import { useId } from 'vue'

withDefaults(defineProps<{
  state?: 'idle' | 'thinking' | 'happy'
  size?: number
  decorative?: boolean
}>(), {
  state: 'idle',
  size: 40,
  decorative: false,
})

// 同一页面会同时出现多个实例，渐变/裁剪的 id 必须唯一，
// 否则先挂载的那个被移除后，其余实例会失去填充。
const uid = useId()
</script>

<template>
  <svg
    class="mascot"
    :class="`is-${state}`"
    :width="size"
    :height="size"
    viewBox="0 0 120 120"
    :role="decorative ? undefined : 'img'"
    :aria-hidden="decorative ? 'true' : undefined"
    :aria-label="decorative ? undefined : '禾禾，作物营养助手'"
  >
    <defs>
      <radialGradient :id="`body-${uid}`" cx="36%" cy="28%" r="82%">
        <stop offset="0%" stop-color="#fffdf2" />
        <stop offset="48%" stop-color="#eef5de" />
        <stop offset="100%" stop-color="#c7dcaa" />
      </radialGradient>
      <linearGradient :id="`leaf-${uid}`" x1="12%" y1="88%" x2="82%" y2="10%">
        <stop offset="0%" stop-color="#4d7c3d" />
        <stop offset="58%" stop-color="#77a75c" />
        <stop offset="100%" stop-color="#b7d78c" />
      </linearGradient>
      <radialGradient :id="`cheek-${uid}`" cx="50%" cy="50%" r="50%">
        <stop offset="0%" stop-color="#e9a48f" stop-opacity=".62" />
        <stop offset="100%" stop-color="#e9a48f" stop-opacity="0" />
      </radialGradient>
      <filter :id="`blur-${uid}`" x="-60%" y="-80%" width="220%" height="260%">
        <feGaussianBlur stdDeviation="3.2" />
      </filter>
      <filter :id="`soft-${uid}`" x="-25%" y="-25%" width="150%" height="150%">
        <feDropShadow dx="0" dy="3.2" stdDeviation="2.6" flood-color="#33502f" flood-opacity=".18" />
      </filter>
      <clipPath :id="`bodyClip-${uid}`">
        <path d="M60 38c20.5 0 35 15.4 35 35.5C95 93.3 79.6 104 60 104S25 93.3 25 73.5C25 53.4 39.5 38 60 38Z" />
      </clipPath>
    </defs>

    <!-- 落地阴影：让角色离开纸面 -->
    <ellipse class="ground" cx="60" cy="108" rx="25" ry="5" fill="#33502f" opacity=".16" :filter="`url(#blur-${uid})`" />

    <g class="sprout">
      <!-- 叶片在身体后面 -->
      <g class="leaf leaf-left">
        <path d="M58 45C48 34 36 29 24 32c2 12 14 20 32 20Z" :fill="`url(#leaf-${uid})`" />
        <path d="M56 47c-8-5-16-9-24-11" fill="none" stroke="#dcebc4" stroke-width="1.7" stroke-linecap="round" opacity=".62" />
      </g>
      <g class="leaf leaf-right">
        <path d="M62 45c10-13 24-17 35-13-3 12-16 18-34 18Z" :fill="`url(#leaf-${uid})`" />
        <path d="M64 47c8-5 16-8 24-9" fill="none" stroke="#dcebc4" stroke-width="1.7" stroke-linecap="round" opacity=".62" />
      </g>
      <path d="M60 52V42" fill="none" stroke="#5f8a4c" stroke-width="4.4" stroke-linecap="round" />

      <!-- 身体：径向渐变 + 底部内阴影 + 左上高光，做出体积感 -->
      <g :filter="`url(#soft-${uid})`">
        <path
          d="M60 38c20.5 0 35 15.4 35 35.5C95 93.3 79.6 104 60 104S25 93.3 25 73.5C25 53.4 39.5 38 60 38Z"
          :fill="`url(#body-${uid})`"
          stroke="#f8f7ea"
          stroke-width="1.1"
        />
        <g :clip-path="`url(#bodyClip-${uid})`">
          <ellipse cx="62" cy="101" rx="36" ry="16" fill="#7e9c62" opacity=".3" :filter="`url(#blur-${uid})`" />
          <ellipse cx="42" cy="55" rx="13" ry="8.5" fill="#ffffff" opacity=".42" transform="rotate(-22 42 55)" :filter="`url(#blur-${uid})`" />
        </g>
      </g>

      <!-- 表情 -->
      <g class="eyes">
        <ellipse class="eye" cx="49" cy="72" rx="4.8" ry="6.2" fill="#2b3826" />
        <ellipse class="eye" cx="71" cy="72" rx="4.8" ry="6.2" fill="#2b3826" />
        <circle cx="47.3" cy="69.6" r="1.6" fill="#fff" opacity=".92" />
        <circle cx="69.3" cy="69.6" r="1.6" fill="#fff" opacity=".92" />
      </g>

      <g class="eye-happy" fill="none" stroke="#2b3826" stroke-width="2.6" stroke-linecap="round">
        <path d="M44 73c2-5 8-5 10 0" />
        <path d="M66 73c2-5 8-5 10 0" />
      </g>

      <circle cx="37" cy="82" r="7" :fill="`url(#cheek-${uid})`" />
      <circle cx="83" cy="82" r="7" :fill="`url(#cheek-${uid})`" />

      <path class="mouth-idle" d="M55 84c1.8 2.7 8.2 2.7 10 0" fill="none" stroke="#3a4a35" stroke-width="2.2" stroke-linecap="round" />
      <g class="mouth-happy">
        <path d="M53 82c1.8 7 12.2 7 14 0Z" fill="#4a332c" />
        <ellipse cx="60" cy="87" rx="3.4" ry="2" fill="#e9a48f" />
      </g>

      <!-- 思考：头顶偏右的三颗浮点 -->
      <g class="thoughts" fill="#7fa66b">
        <circle class="thought" cx="84" cy="31" r="3.1" />
        <circle class="thought" cx="93" cy="23" r="2.6" />
        <circle class="thought" cx="101" cy="16" r="2.1" />
      </g>

      <!-- 开心：星芒 -->
      <g class="sparkles" fill="#d9b26f">
        <path d="M21 27l2 5 5 2-5 2-2 5-2-5-5-2 5-2Z" />
        <path d="M101 61l1.6 4 4 1.6-4 1.6-1.6 4-1.6-4-4-1.6 4-1.6Z" />
      </g>
    </g>
  </svg>
</template>

<style scoped>
.mascot {
  display: block;
  overflow: visible;
}

.sprout {
  transform-box: fill-box;
  transform-origin: center;
  animation: mascot-float 4.8s ease-in-out infinite;
}

.leaf {
  transform-box: fill-box;
}
.leaf-left {
  transform-origin: 92% 86%;
  animation: leaf-left 5.4s ease-in-out infinite;
}
.leaf-right {
  transform-origin: 8% 86%;
  animation: leaf-right 6.2s ease-in-out infinite;
}

.eye {
  transform-box: fill-box;
  transform-origin: center;
  animation: mascot-blink 6.8s infinite;
}

.eye-happy,
.mouth-happy,
.sparkles {
  opacity: 0;
}

.is-happy .eye,
.is-happy .mouth-idle {
  opacity: 0;
}
.is-happy .eye-happy,
.is-happy .mouth-happy,
.is-happy .sparkles {
  opacity: 1;
}
.is-happy .sparkles {
  animation: mascot-sparkle 1.9s ease-in-out infinite;
}

.thoughts {
  opacity: 0;
}
.is-thinking .thoughts {
  opacity: 1;
}
.is-thinking .thought {
  animation: mascot-thought 1.3s ease-in-out infinite;
}
.is-thinking .thought:nth-child(2) {
  animation-delay: 0.16s;
}
.is-thinking .thought:nth-child(3) {
  animation-delay: 0.32s;
}
.is-thinking .eyes {
  animation: mascot-look-up 1.8s ease-in-out infinite;
  transform-box: fill-box;
  transform-origin: center;
}

@keyframes mascot-float {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-3px); }
}

@keyframes leaf-left {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(-4deg); }
}

@keyframes leaf-right {
  0%, 100% { transform: rotate(0deg); }
  50% { transform: rotate(4deg); }
}

@keyframes mascot-blink {
  0%, 91%, 97%, 100% { transform: scaleY(1); }
  94% { transform: scaleY(0.08); }
}

@keyframes mascot-thought {
  0%, 100% { opacity: 0.25; transform: translateY(1px); }
  45% { opacity: 1; transform: translateY(-2px); }
}

@keyframes mascot-look-up {
  0%, 100% { transform: translateY(0); }
  50% { transform: translateY(-2px); }
}

@keyframes mascot-sparkle {
  0%, 100% { opacity: 0.35; transform: scale(0.9); transform-origin: center; }
  50% { opacity: 1; transform: scale(1.08); transform-origin: center; }
}

@media (prefers-reduced-motion: reduce) {
  .sprout,
  .leaf,
  .eye,
  .thought,
  .sparkles,
  .eyes {
    animation: none !important;
  }
}
</style>

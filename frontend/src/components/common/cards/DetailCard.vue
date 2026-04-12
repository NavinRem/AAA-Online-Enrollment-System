<script setup>
defineProps({
  title: String,
  avatarUrl: String,
  loading: Boolean,
  hasAvatar: {
    type: Boolean,
    default: true,
  },
})
</script>

<template>
  <div
    class="ui-detail-card flex flex-col h-full bg-white rounded-std shadow-sm border border-outline-std p-6 transition-all duration-300"
  >
    <h3
      v-if="title"
      class="text-xl font-black text-content-dark tracking-tighter mb-6 text-center lg:text-left"
    >
      {{ title }}
    </h3>

    <div
      v-if="hasAvatar"
      class="w-24 h-24 mx-auto mb-6 rounded-full border-2 border-primary-soft bg-surface-subtle p-1 shadow-sm"
    >
      <img
        :src="avatarUrl"
        :alt="title"
        class="w-full h-full rounded-full object-cover block"
        @error="
          (e) =>
            (e.target.src =
              'data:image/svg+xml;utf8,<svg xmlns=\'http://www.w3.org/2000/svg\' viewBox=\'0 0 24 24\' fill=\'%2300aeef\'><path d=\'M12 12c2.21 0 4-1.79 4-4s-1.79-4-4-4-4 1.79-4 4 1.79 4 4 4zm0 2c-2.67 0-8 1.34-8 4v2h16v-2c0-2.66-5.33-4-8-4z\'/></svg>')
        "
      />
    </div>

    <div class="bg-primary-soft rounded-lg p-5 flex-grow border border-outline-std/10">
      <div v-if="!loading" class="flex flex-col gap-3">
        <slot></slot>
      </div>
      <div
        v-else
        class="text-content-muted italic text-center animate-pulse py-4 font-bold uppercase text-2xs tracking-widest"
      >
        Hydrating Profile...
      </div>
    </div>
  </div>
</template>

<template>
  <label
    class="flex flex-row items-center justify-start rounded-md border border-native-blue-200 p-2 [transition:all_var(--hs-transition-time)_ease] hover:cursor-pointer hover:bg-[rgba(116,214,255,0.2)]"
  >
    <input
      class="mx-4 appearance-none rounded-[50%] border-8 border-[#454545] [transition:all_var(--hs-transition-time)_ease] checked:border-native-blue-200"
      type="radio"
      :id="value"
      name="input"
      :value="value"
      @change="action"
    />
    <div class="grid grid-cols-[50px_1fr] items-center gap-3">
      <img :src="media" width="50" height="50" :alt="mediaAlt" />
      <div class="flex flex-col items-start">
        <span class="font-subtitle font-bold">{{ label }}</span>
        <span class="content-center justify-between text-xs"
          >{{ helper }}
        </span>
      </div>
    </div>
  </label>
</template>

<script>
export default {
  name: 'JoinRadio',
  props: ['action', 'value', 'label', 'helper', 'media', 'mediaAlt'],
  data() {
    return {
      isRadioSelected: false,
    }
  },
}
</script>

<style lang="scss" scoped></style>

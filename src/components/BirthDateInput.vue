<template>
  <input
    type="text"
    inputmode="numeric"
    placeholder="DD/MM/AAAA"
    autocomplete="bday"
    :value="displayValue"
    @input="updateDate"
  />
</template>

<script setup>
import { ref, watch } from "vue";

const props = defineProps({
  modelValue: { type: String, default: "" },
  max: { type: String, default: "" },
});
const emit = defineEmits(["update:modelValue"]);
const displayValue = ref("");

function toIso(value) {
  if (!/^\d{2}\/\d{2}\/\d{4}$/.test(value)) return "";
  const [day, month, year] = value.split("/");
  const iso = `${year}-${month}-${day}`;
  const date = new Date(`${iso}T00:00:00Z`);
  if (
    year === "0000" ||
    Number.isNaN(date.getTime()) ||
    date.toISOString().slice(0, 10) !== iso ||
    (props.max && iso > props.max)
  ) return "";
  return iso;
}

watch(
  () => props.modelValue,
  (value) => {
    // Preserve unfinished typing; also reflect restored drafts and form resets.
    if (value !== toIso(displayValue.value)) {
      displayValue.value = value ? value.split("-").reverse().join("/") : "";
    }
  },
  { immediate: true }
);

function updateDate(event) {
  const input = event.target;
  const digitsBeforeCursor = input.value
    .slice(0, input.selectionStart ?? input.value.length)
    .replace(/\D/g, "").length;
  const digits = input.value.replace(/\D/g, "").slice(0, 8);
  displayValue.value = digits
    .replace(/^(\d{2})(\d)/, "$1/$2")
    .replace(/^(\d{2}\/\d{2})(\d)/, "$1/$2");
  input.value = displayValue.value;
  // Keep the caret near the edited digits when correcting or deleting a date.
  let cursor = 0, count = 0;
  while (cursor < input.value.length && count < digitsBeforeCursor) {
    if (/\d/.test(input.value[cursor])) count++;
    cursor++;
  }
  input.setSelectionRange(cursor, cursor);
  emit("update:modelValue", toIso(displayValue.value));
}
</script>

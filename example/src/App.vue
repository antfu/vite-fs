<script setup lang="ts">
import style from './index.css.ref'
import data from './data.json.ref'
</script>

<template>
  <h3>index.css</h3>
  <textarea v-model="style" />
  <h3>data.json</h3>
  <p>{{ data }}</p>
  <input v-model="data.hello">
</template>

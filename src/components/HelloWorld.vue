<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <button @click="print('utils')">utils</button>
    <button @click="print('latestNews')">latestNews</button>
    <button @click="print('weiWuRi')">weiWuRi</button>
    <button @click="print('yiYuanGou')">yiYuanGou</button>
    <button @click="print('scss')">scss</button>
    <div class="code">{{code}}</div>
  </div>
</template>

<script>
  import utils from '@/es5/utils'
  import latestNews from '@/es5/latestNews'
  import weiWuRi from '@/es5/weiWuRi'
  import yiYuanGou from '@/es5/yiYuanGou'
  import scss from '@/es5/sass/a'
  export default {
  name: 'HelloWorld',
  data () {
    return {
      msg: 'Welcome to Your Vue.js App',
      code: ''
    }
  },
  methods: {
    print(key) {
      const s = {utils, latestNews, weiWuRi, yiYuanGou}
      this.code = s[key]
    }
  }
}
</script>

<!-- Add "scoped" attribute to limit CSS to this component only -->
<style scoped>
h1, h2 {
  font-weight: normal;
}

.hello {
  background: #eee;
}

  .code {
    margin-top: 50px;
    padding: 30px;
    border-radius: 6px;
    box-shadow: 0 0 rgba(0, 0, 0, .35);
    background: #fff;
    text-align: left;
  }
</style>

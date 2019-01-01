<template>
  <div class="hello">
    <h1>{{ msg }}</h1>
    <button @click="print('utils')">utils</button>
    <button @click="print('latestNews')">latestNews</button>
    <button @click="print('weiWuRi')">weiWuRi</button>
    <button @click="print('yiYuanGou')">yiYuanGou</button>
    <button @click="print('style')">style</button>
    <button @click="print('diy')">DIY</button>
    <div class="code">{{code}}</div>
  </div>
</template>

<script>
  import utils from '@/rawfiles/js/utils'
  // import latestNews from '@/rawfiles/js/latestNews'
  // import weiWuRi from '@/rawfiles/js/weiWuRi'
  // import yiYuanGou from '@/rawfiles/js/yiYuanGou'
  // import style from '@/rawfiles/css/style.scss'
  // import UglifyJS from 'uglify-js'
  console.log(utils)
  export default {
    name: 'HelloWorld',
    data() {
      return {
        msg: 'Welcome to Your Vue.js App',
        code: ''
      }
    },
    methods: {
      print(key) {
        const s = {
          utils,
          latestNews: '',
          weiWuRi: '',
          yiYuanGou: '',
          style: '',
          diy: ''
        }
        this.code = s[key]
      },
      diy() {
        const code = `
      var a = 123;
      var b = 2;
      var obj = {
        key1: 1,
        key2: 2,
        key3: 3,
      }
      var arr = Object.keys[obj];
      var sum = arr.reduce(function(acc, item) {
        return acc + item;
      }, 0);
      console.log(sum);
      `
        return this.createScript(null, code)
      },
      is(value, type) {
        const t = {}.toString.call(value).replace(/^\[object\s(\w+)\]$/, '$1')
        return type ? t.toLowerCase() === type.toLowerCase() : t
      },
      createStyle(code) {
        const style = document.createElement('style')
        style.type = 'text/css'
        if (this.is(code, 'string')) {
          style.innerHTML = code;
        } else if(this.is(code, 'array')) {
          const arr = code[0]
          if(this.is(arr, 'array')) {
            style.innerHTML = arr[1]
          }
        }
        return style.outerHTML
      },
      createScript(src, code) {
        let js = document.createElement('script')
        if (src) {
          js.src = src
          return js.outerHTML
        }
        js.innerHTML = '\n' + code + '\n'
        return js.outerHTML;
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

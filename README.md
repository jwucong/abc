# abc

# rawfiles

### 1. js文件
  > 文件夹中的js文件会先后经过以下loader的处理，直接import即可获得压缩后的源码：
  1. babel-loader  
  2. uglify-loader  
  3. raw-loader
   
  ```javascript
    import utils from '@/rawfiles/js/utils'
    console.log(utils) // ==> '!function...'
  ```  
  
### 2. css/sass/scss/less/stylus/styl文件

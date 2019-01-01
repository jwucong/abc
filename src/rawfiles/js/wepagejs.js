// 微页面相关组件
var Common = {
  formatTime: function (sec) {
    var sec = Math.ceil(sec)
    return Math.floor(sec/60) + ':' + String.prototype.padStart.call(sec%60, 2, 0)
  },
  hasClass: function (ele, str) {
    var reg = new RegExp('\\b' + str + '\\b')
    return !!ele.className.match(reg)
  },
  addClass: function (ele, str) {
    if(!this.hasClass(ele, str)) {
      ele.className = ele.className + ' ' + str
    }
  },
  removeClass: function (ele, str) {
    var reg = new RegExp('\\b' + str + '\\b')
    ele.className = ele.className.replace(reg, '').trim()
  }
}
// 音频播放器
;(function () {
  var $players = document.querySelectorAll('.audio_player');
  $players.forEach(function($player){
    var $icon = $player.querySelector('.player_icon'),
        $progress = $player.querySelector('.progress'),
        $control = $player.querySelector('.progress_inner'),
        $curTime = $player.querySelector('.curTime'),
        $time = $player.querySelector('.time'),
        $audio = $player.querySelector('audio');
    var loop = setInterval(function () {
      $curTime.innerHTML = Common.formatTime($audio.currentTime)
      var percent = $audio.currentTime/$audio.duration
      $control.style.transform = 'translateX(' + percent*100 + '%)'
    }, 1000)
    $icon.addEventListener('touchstart', function () {
      if ($audio.paused) {
        $audio.play()
      } else {
        $audio.pause()
      }
    })
    $audio.addEventListener('loadedmetadata', function () {
      $time.innerHTML = Common.formatTime($audio.duration)
    })
    $audio.addEventListener('play', function () {
      Common.addClass($player, 'play')
    })
    $audio.addEventListener('ended', function () {
      Common.removeClass($player, 'play')
    })
    $audio.addEventListener('pause', function () {
      Common.removeClass($player, 'play')
    })
    $progress.addEventListener('touchstart', function (e) {
      var $target = e.target;
      var curLength = e.touches[0].pageX - $progress.offsetLeft
      var percent = curLength/$progress.offsetWidth
      $audio.currentTime = $audio.duration * percent
    })

  })
})()
// banner轮播图
;(function () {
  if (document.querySelector('.swiper-container')) {
    new Swiper('.swiper-container', {
      autoplay: true,//可选选项，自动滑动
      pagination: {
        el: '.swiper-pagination'
      }
    })
  }
})()
// 名片
;(function () {
  var $cards = document.querySelectorAll('.we_card')
  if ($cards.length) {
    $cards.forEach(function ($card) {
      var $id = document.querySelector('.card_uid'),
          /* $avatar = $card.querySelector('.avatar'), */
          $map = $card.querySelector('.mappic'),
          $name = $card.querySelector('.name'),
          $store = $card.querySelector('.store'),
          /* $amap = $card.querySelector('#amapContainer'), */
          /* $addr = $card.querySelector('.addr'), */
          $phone = $card.querySelector('.phone');
      fetch('/cloud/online/architecture/card/user?userId=' + $id.value)
        .then(function (res) {
          return res.json()
        })
        .then(function (json) {
          var data = json.data
          if(json.code === 1) {
            var addList = data.addressList
            var posObj = {}
            /* $avatar.src = data.avatar; */
            $name.innerHTML = '您的家电顾问: ' + data.username;
            /* $addr.innerHTML = data.address; */
            $phone.innerHTML = '联系方式: <a href="tel:' + data.mobile +'">' + data.mobile + '</a>';
            //创建地图实例
            if(addList.length){
              $map.style.display = 'none';
              var lis = ''
              addList.map((item, index) => {
                if(index === 0){
                  posObj.lat = item.latitude
                  posObj.lon = item.longitude
                }
                let shopLocation = item.shoplocation ? item.shoplocation : '暂无门店地址'
                lis += '<li data-lat="' + item.latitude + '" data-long="' + item.longitude + '"><h3>门店名称: ' + item.shopName + '</h3><p><span class="icon-location"></span>门店地址: ' + shopLocation +'</p></li>'
              })
              $store.innerHTML = '<span class="icon-down J_expand"></span><ul>'+ lis +'</ul>'
              if (addList[0].longitude && addList[0].latitude){
                createMap([addList[0].longitude, addList[0].latitude])
              }
              var flag = false
              $('.store li').on('click', function(e) {
                if ($(this).data('lat') && $(this).data('long')) {
                  let curLat = $(this).data('lat')
                  let curLong = $(this).data('long')
                  let curCenter = [curLong, curLat]
                  posObj.lat = $(this).data('lat')
                  posObj.lon = $(this).data('long')
                  createMap(curCenter)
                  $(this).insertBefore($('.store li').eq(0))
                  flag = false
                  $('.store ul').css({
                    'height': '52px',
                    'overflow': 'hidden'
                  })
                  $('.we_card').css('min-height', $('.user_info').height())
                  $('#amapContainer').show()
                } else {
                  $('#amapContainer').hide()
                }
              })
              $('.store .J_expand').on('click', function(){
                if(flag){
                  flag = false
                  $('.store ul').css({
                    'height': '52px',
                    'overflow': 'hidden'
                  })
                  $('.we_card').css('min-height', $('.user_info').height())
                }else{
                  flag = true
                  $('.store ul').css({
                    'height': 'auto',
                    'overflow': 'visible'
                  })
                  $('.we_card').css('min-height', $('.user_info').height())
                }
              })
              function createMap(center){
                var amap = new AMap.Map('amapContainer', {
                  resizeEnable: true,
                  center: center,
                  zoom: 13
                });
                // amap.remove(marker);
                var marker = new AMap.Marker({
                  position: center   // 经纬度对象，也可以是经纬度构成的一维数组[116.39, 39.9]
                });
                amap.add(marker);
                marker.on('click', function(){
                  window.location = 'https://uri.amap.com/navigation?from=&to=' + posObj.lon + ',' + posObj.lat;
                })
              }
            }
          }
        })
    })
  }
})()
// 获取微页面高度
;(function () {
  var minHeight = window.innerHeight + 'px';
  var pages = [].slice.call(document.querySelectorAll('.we_page'));
  pages.forEach(function(page) {
    page.style.minHeight = minHeight;
  })
})()

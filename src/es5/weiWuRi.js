;(function (window, document, JSON, $) {

  var utils = window.utils;
  var _isPreview = function() {
    var maker = '/content/micro/preview';
    return window.location.href.indexOf(maker) >= 0;
  }

  if (_isPreview() || !utils.isWeiXin()) {
    return false;
  }

  $(function () {
    var container = $('.is-wei-wu-ri')
    var loading = $('.weiwuri-loading-box')
    var loadingDuration = 2000
    if (!container.length) {
      return
    }

    window._UM_WEI_WU_RI_ = {}

    var sdk = window._um_weixin_sdk || {
      getPayOpenId: function () {
        return ''
      },
      getActivityIds: function () {
        return ''
      }
    }

    var reqQueryData = {
      activityId: sdk.getActivityIds(),
      openId: sdk.getPayOpenId()
    }

    var pages = $('.we_page')
    var firstPage = pages.first()
    var formStyle = firstPage.find('style')
    var formScript = firstPage.find('script')
    formScript.appendTo(document.head)

    pages.each(function (index, item) {
      $(item).attr('data-index', index)
    })

    // 监听页面表单提交事件
    $(document.body).on('weiWuRiPageSubmit', getUserCommitProgress)

    $(document).on('touchstart', function(e) {
      if($(document.body).hasClass('unscroll')) {
        e.preventDefault()
      }
    })

    $(document).on('touchstart', '.weiwuri-popup-close', function(e) {
      e.stopPropagation()
      closePopup()
    })

    getUserCommitProgress()


    function showPageAndReInit(index) {
      var page = pages.eq(index)
      var form = page.find('.unsave-form')
      form.prepend(formStyle)
      page.show()
      container.html(page.prop('outerHTML'))
      if(index === 2) {
        getLotteryCode()
      }
      // The run instance is instantiated in the createFormHTML method in the newFormEditor.vue file
      if (typeof run === 'object') {
        typeof run.init === 'function' && run.init()
      }
      // The latestNews instance is instantiated in the @/es5/latestNews.js file
      if(typeof latestNews === 'object') {
        latestNews.init();
      }
    }

    function popup(code) {
      var popup = $('.weiwuri-popup')
      if (popup.length) {
        popup.find('.weiwuri-popup-code').text(code)
        popup.show()
        return
      }
      var popupHTML = [
        '<div class="weiwuri-popup">',
        '<div class="weiwuri-popup-content">',
        '<div class="weiwuri-popup-transparent"></div>',
        '<div class="weiwuri-popup-star"></div>',
        '<div class="weiwuri-popup-whitebg">',
        '<div class="weiwuri-popup-inner">',
        '<div class="weiwuri-popup-title">您已成功参与报名活动</div>',
        '<div class="weiwuri-popup-graybox">',
        '<div class="weiwuri-popup-subtitle">兑奖码</div>',
        '<div class="weiwuri-popup-code">' + code + '</div>',
        '</div>',
        '</div>',
        '<div class="weiwuri-popup-close"></div>',
        '</div>',
        '</div>',
        '</div>'
      ].join('')
      $(document.body).addClass('unscroll').append($(popupHTML))
    }

    function closePopup() {
      $(document.body).removeClass('unscroll')
      $('.weiwuri-popup').hide()
    }

    function getUserCommitProgress() {
      loading.show()
      var t1 = Date.now()
      var url = '/cloud/marketing/prizedraw/getUserCommitProgress'
      var successHandler = function (res) {
        if (res.code !== 1) {
          alert(res.msgZ)
          return
        }
        var data = res.data
        var step = data.currentProgress
        window._UM_WEI_WU_RI_.completedProgress = step
        showPageAndReInit(step)
      }
      var errorHandler = function (err) {
        console.error('err: %o', err)
      }
      var completeHandler = function() {

        var t2 = Date.now()
        var delta = t2 - t1
        if(delta < loadingDuration) {
          setTimeout(function () {
            loading.hide()
          }, loadingDuration - delta)
        } else {
          loading.hide()
        }
      }
      $.ajax({
        url: url,
        type: 'POST',
        data: reqQueryData,
        dataType: 'json',
        success: successHandler,
        error: errorHandler,
        complete: completeHandler
      })
    }

    function getLotteryCode() {
      var url = '/cloud/marketing/prizedraw/generateActivityPrizedrawCode'
      var successHandler = function (res) {
        if (res.code !== 1) {
          alert(res.msgZ)
          return
        }
        popup(res.data)
      }
      var errorHandler = function (err) {
        console.error('err: %o', err)
      }
      $.ajax({
        url: url,
        type: 'POST',
        data: reqQueryData,
        dataType: 'json',
        success: successHandler,
        error: errorHandler
      })
    }


  });

})(window, document, JSON, typeof $ === 'undefined' ? void 0 : $);

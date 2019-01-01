;(function (window, document, $) {

  var utils = window.utils;

  var _isPreview = function () {
    var marker = '/content/micro/preview';
    return window.location.href.indexOf(marker) >= 0;
  }

  if (_isPreview() || !utils.isWeiXin()) {
    return false;
  }

  var LatestNews = function (options) {
    var listItemTemplate = [
      '<li class="participator">',
      '<div class="avatar" style="background-image: url({{avatar}});"></div>',
      '<div class="info">',
      '<div class="nickname">{{nickname}}</div>',
      '<div class="date">{{submitTime}}</div>',
      '</div>',
      '<div class="tag">{{tag}}</div>',
      '</li>'
    ].join('');
    this.options = utils.extend({}, {
      minShowRows: 3,
      maxShowRows: 3,
      container: '.latest-news',
      listContainer: '.participators',
      swiperContainer: '.participator-swiper',
      userNumContainer: '.participator-num',
      countdownContainer: '.count-down',
      listItemTemplate: listItemTemplate
    }, options);
    this.init();
  }

  LatestNews.prototype.init = function () {
    this.clearInterval()
    this.container = null;
    this.cache = {
      userNum: 0,
      endTime: '',
      uids: []
    }
    this.xhr = null;
    this.besterScroll = null;
    var container = this.findNode(this.options.container);
    if (!container) {
      return
    }
    this.container = container;
    this.besterScroll = this.createBesterScroll();
    var listBox = this.findNode(this.options.listContainer);
    if (listBox) {
      listBox.innerHTML = ''
    }
    this.getDetails();
    var pollingInterval = 5; // second
    this.polling(pollingInterval);
  }

  LatestNews.prototype.createList = function (template, data) {
    var tags = ['', '已报名活动', '已上传发票']
    var div = document.createElement('div')
    var fragment = document.createDocumentFragment();
    data.forEach(function (item) {
      var data = {
        avatar: item.headImage,
        nickname: item.nickName,
        submitTime: item.time || '',
        tag: tags[item.currentStep] || ''
      }
      div.innerHTML = utils.replace(template, data);
      fragment.appendChild(div.firstElementChild);
    });
    div = null;
    return fragment;
  }

  LatestNews.prototype.createCountdown = function (options) {
    var tm = this.timerMap;
    tm.countdown && clearInterval(tm.countdown);
    tm.countdown = utils.countdown(options)
    return tm.countdown;
  }

  LatestNews.prototype.createBesterScroll = function (options) {
    var setting = utils.extend({}, {
      scrollY: true,
      click: false,
      tap: false,
      /*bounce: {
        top: false,
        bottom: false,
        left: false,
        right: false
      }*/
    }, options);
    return new BScroll(this.options.swiperContainer, setting);
  }

  LatestNews.prototype.render = function (data) {
    var cache = this.cache;
    var endTime = data.endTime;
    var userNum = data.userNum;

    if (endTime !== cache.endTime) {
      var now = Date.now();
      var end = utils.isNumber(endTime) ? new Date(endTime * 1000).getTime() : timeNow;
      var delta = Math.floor((end - now) / 1000);
      this.countdown({duration: delta});
      cache.endTime = endTime;
    }

    if (userNum !== cache.userNum) {
      this.renderUsersCounter(userNum);
      cache.userNum = userNum;
    }

    this.renderList(this.options.listItemTemplate, data.users);
  }

  LatestNews.prototype.renderList = function (template, data) {
    var ops = this.options;
    var listBox = this.findNode(ops.listContainer)
    var swiperBox = this.findNode(ops.swiperContainer)
    var list = this.createList(template, data)
    var reference = listBox.firstChild;
    listBox.innerHTML = ''
    // listBox.insertBefore(list, reference);
    listBox.appendChild(list);
    var minRows = ops.minShowRows;
    var maxRows = ops.maxShowRows;
    var items = utils.toArray(listBox.children).slice(0, maxRows);
    var min = 0;
    var max = items.reduce(function (acc, item, index) {
      var sum = acc + item.offsetHeight;
      if (index < minRows) {
        min = sum;
      }
      return sum;
    }, 0);
    if (items.length < minRows) {
      min = 150;
      max = min;
    }
    swiperBox.style.minHeight = min + 'px';
    swiperBox.style.maxHeight = max + 'px';
    this.besterScroll.refresh();
  }

  LatestNews.prototype.renderUsersCounter = function (n) {
    n = (!+n || n < 0) ? 0 : +n;
    var num = n.toString();
    var size = num.length;
    var minSize = 6;
    var maxSize = 8;
    var pads = '00000000';
    var over = '99999999+';
    var counterBox = this.findNode(this.options.userNumContainer)
    if (size < minSize) {
      num = pads.slice(0, minSize - size) + num;
    } else if (size > maxSize) {
      num = over;
    }
    var html = num.split('').map(function (item) {
      return '<span>' + item + '</span>';
    }).join('');
    counterBox.innerHTML = html;
  }

  LatestNews.prototype.countdown = function (optioins) {
    var countdownBox = this.findNode(this.options.countdownContainer)
    var handler = function (s) {
      var text = utils.S2DHMS(s);
      var template = '<span class="{{className}}">{{text}}</span>'
      var html = text.split('').map(function (item) {
        return utils.replace(template, {
          text: item,
          className: /\d/.test(item) ? 'time' : ''
        })
      }).join('');
      countdownBox.innerHTML = html;
    }
    var setting = utils.extend({}, {
      duration: 60,
      interval: 1,
      beforeCountdown: handler,
      onCountdown: handler,
      afterCountdown: handler
    }, optioins)
    return this.createCountdown(setting)
  }

  LatestNews.prototype.clearInterval = function (timer) {
    if(timer) {
      return clearInterval(timer);
    }
    var tm = this.timerMap;
    if(tm) {
      for (var key in tm) {
        if (tm.hasOwnProperty(key)) {
          clearInterval(tm[key]);
        }
      }
    }
    this.timerMap = {};
  }

  LatestNews.prototype.getDetails = function (ajaxOptions) {
    if (typeof $ === 'undefined') {
      return
    }
    var that = this;
    var input = document.getElementById('activity_ids');
    var activityId = input ? input.value : '';
    var defaults = {
      url: '/cloud/marketing/prizedraw/getActivityJoinInfo',
      type: 'POST',
      data: {
        activityId: activityId
      },
      success: function (res) {
        if (res.code !== 1) {
          alert(res.msgZ)
          return
        }
        var data = res.data;
        var users = data.topList;
        var options = {
          endTime: data.endTime,
          userNum: data.totalJoinNumber,
          users: utils.isArray(users) ? users : [],
        }
        that.render(options)
      }
    }
    this.xhr && this.xhr.abort();
    this.xhr = $.ajax(utils.extend({}, defaults, ajaxOptions));
  }

  LatestNews.prototype.polling = function (interval) {
    var that = this;
    var tm = that.timerMap;
    tm.polling && clearInterval(tm.polling);
    tm.polling = setInterval(function () {
      that.getDetails();
    }, (interval || 1) * 1000);
    return tm.polling;
  }

  LatestNews.prototype.isNode = function (value) {
    return /^HTML(\w+)Element$/.test(utils.is(value))
  }

  LatestNews.prototype.findNode = function (selector) {
    var container = this.container || document
    return this.isNode(selector) ? selector : container.querySelector(selector)
  }

  $(function () {
    window.latestNews = new LatestNews();
  })

})(window, document, typeof $ === 'undefined' ? void 0 : $);

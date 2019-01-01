;(function (window, document, JSON, $) {

  if (!isWeiXin() || is($, 'Undefined')) {
    return false;
  }

  /**
   * 判断是不是微信浏览器
   * @return {boolean}
   */
  function isWeiXin() {
    var ua = window.navigator.userAgent.toLowerCase();
    return /micromessenger/.test(ua);
  }

  /**
   * 判断是否ios系统
   * @return {boolean}
   */
  function isIOS() {
    var iosReg = /\(i[^;]+;( U;)? CPU.+Mac OS X/i
    var ua = navigator.userAgent
    return iosReg.test(ua)
  }

  /**
   * 类型判断
   * @param value
   * @param type
   * @return {boolean}
   */
  function is(value, type) {
    return {}.toString.call(value).replace(/^\[object\s(\w+)\]$/, '$1') === type;
  }

  /**
   * 判断是否为0元购
   */
  function isFreeGou() {
    return $('.yi-yuan-gou').hasClass('freeGou');
  }

  /**
   * 获取url查询参数
   * @param key
   * @return {key ? (string | void) : object}
   */
  function getUrlQuery(key) {
    var queryStr = window.location.search.substr(1);
    var queryArr = queryStr.split('&');
    var query = {};
    queryArr.forEach(function (item) {
      var kv = item.split('=');
      var k = kv[0];
      var v = kv[1];
      if (k) {
        query[k] = v === void 0 ? void 0 : decodeURIComponent(v);
      }
    });
    return key ? query[key] : query;
  }

  /**
   * 页面重定向
   * @param queryStr
   */
  function redirect(query) {
    if (!query || invalidAct || unstartAct) {
      return
    }
    var params = $.extend({}, getUrlQuery(), query);
    var search = [];
    for (var key in params) {
      if (params.hasOwnProperty(key)) {
        var param = key + '=' + encodeURIComponent(params[key]);
        search.push(param);
      }
    }
    var currentUrl = window.location.href;
    var endIndex = currentUrl.indexOf('?');
    var path = endIndex === -1 ? currentUrl : currentUrl.slice(0, endIndex);
    var targetUrl = path + '?' + search.join('&');
    // 判断的时候去掉date参数，不然会不停刷新
    // var filterDateReg = /([\s\S]*)(&queryDate=\d{4}-\d{2}-\d{2})/ ;
    if (currentUrl !== targetUrl) {
      window.location.href = targetUrl;
    }
  }

  /**
   * 从响应中获取查询参数
   * @param res
   * @return {{joinId: number, joinCardOpenId: (string), activityId: (number|*|string), date: Date}}
   */
  function getUrlQueryByResponse(res) {
    var data = res.data;
    if (!data) {
      return {};
    }
    return {
      joinId: data.id,
      joinCardOpenId: data.cardOpenId,
      activityId: data.activityId,
      queryDate: window.utils.formatDate(Date.now(), 'yyyy-MM-dd')
    }
  }

  /**
   * 秒转换为dd天hh时mm分ss秒
   * @param s 秒数
   * @return {string}
   */
  function secondToHms(s) {
    if (s <= 0) {
      return '00天00时00分00秒';
    }
    var f = function (v) {
      return v < 10 ? '0' + v : v;
    }
    var dd = f(Math.floor(s / 3600 / 24));
    var hh = f(Math.floor(s / 3600) % 24);
    var mm = f(Math.floor(s / 60) % 60);
    var ss = f(Math.floor(s % 60));
    var array = [dd, '天', hh, '时', mm, '分', ss, '秒'];
    return array.join('');
  }

  var WX_SDK = window._um_weixin_sdk;


  var JOIN_DATA = {
    minimumMember: MIN_HELP_PERSON_NUMBER,
    goodsNumber: PRODUCT_NUMBER,
    purchasePrice: ORIGINAL_PRICE
  };

  var PAY_AMOUNT = 1;  // 单位元

  var ICON_JOIN_SUCCESS = 'http://i0.um.tcl.com/icon-wepage-ok.png';
  var ICON_SUBMIT_SUCCESS = 'http://i0.um.tcl.com/icon-wepage-ok2.png';
  var ICON_ACTIVITE_END = 'http://i0.um.tcl.com/icon-wepage-time.png';
  var ICON_NO_GOODS = 'http://i0.um.tcl.com/icon-wepage-none.png';
  var ICON_AUTHORIZE = 'http://i0.um.tcl.com/icon-wepage-default-avatar.png';
  var DEFAULT_AVATAR = 'http://i0.um.tcl.com/icon-wepage-no-avatar.png';
  var NO_MOREUSER = 'http://i0.um.tcl.com/icon-wepage-wenhao.png';
  var FOLLOW_QRCODE = 'http://i0.um.tcl.com/icon-wepage-ok.png';
  var paying = false;
  var joining = false;
  var activiteStep = 1;  // 1-未参与; 2-进行中; 3-达到助力人数; 4-已支付
  var helperHasJoin = false;
  var urlQuery = null;
  var invalidAct = false;
  var unstartAct = false;
  var curTime = '';


  $(function () {

    var
      body = $(document.body),
      wrap = $('.yi-yuan-gou'),
      countDoneNode = wrap.find('.count-down'),
      progreesCurrent = wrap.find('.progrees .current'),
      progreesDot = wrap.find('.progrees .dot'),
      avatarNode = wrap.find('.avatar img'),
      productNumNode = wrap.find('.price .others .num'),
      helperCountNode = wrap.find('.product .person'),
      remainHelperCountNode = wrap.find('.product .J_remainedPerson'),
      moneyCountNode = wrap.find('.product .money'),
      reamainMoneyCountNode = wrap.find('.product .J_remainedMoney'),
      reamainProductNode = wrap.find('.product .remain-product'),
      joinedPerson = wrap.find('.product .joined-person span'),
      days = wrap.find('.days'),
      popup = wrap.find('.popup'),
      popupMask = popup.find('.mask'),
      loading = popup.find('.loading'),
      popupContent = popup.find('.content'),
      popupShare = popup.find('.share'),
      popupIcon = popup.find('.icon img'),
      popupTitle = popup.find('h3'),
      popupSubTitle = popup.find('p'),
      popupClose = popup.find('.close'),
      getVerifyBtn = popup.find('.getvalidate-tbn'),
      submitBtn = wrap.find('.submit'),
      payFormItems = popup.find('.input-box');
      invalidWatermark = wrap.find('.watermark-invalid');
      unstartWatermark = wrap.find('.watermark-unstart');

    initPage();

    function initPage() {

      // 支付成功回调, 更新一次页面
      WX_SDK.onPaySuccess = function () {
        getActiviteDetails();
      }

      // 分享成功之后弹出扫码关注 暂时取消
      // WX_SDK.onShareCircleFriendsSuccess = function () {
      //   alertScanQRcodeFollow();
      // }
      // WX_SDK.onShareFriendsSuccess = function () {
      //   alertScanQRcodeFollow();
      // }

      // 隐藏弹出层
      popupClose.add(popupMask).add(popupShare).on('click', closePopup);

      // 获取验证码
      getVerifyBtn.on('click', getVerifyCode);

      if(isFreeGou()){
        //显示活动期间
        getPeriodTime(WX_SDK.getActivityStartTime()*1000, WX_SDK.getActivityEndTime()*1000)
      }else{
        // 活动倒计时
        activiteCountDown(WX_SDK.getActivityEndTime());
      }

      // 添加支付表单校验器
      addVerifiers();

      // 获取页面详情
      getActiviteDetails();

      // 助力者助力
      if (isHelper()) {
        help();
        updateHelperSubmitBtn();
      }

      // 活动结束提示
      if (isActivityEnd()) {
        alertActiviteEnd();
      }

      isWeiXin() && isIOS() && fixPullDownBug()

    }

    // Fix bugs that cannot be automatically recovered when the IOS12+ keyboard is popped up and the page is moved up.
    function fixPullDownBug() {
      var scrollTop = 0
      var timerId
      document.body.addEventListener('focusin', () => {
        scrollTop = document.documentElement.scrollTop || window.pageYOffset || document.body.scrollTop;
        clearTimeout(timerId)
      }, false)
      document.body.addEventListener('focusout', () => {
        clearTimeout(timerId)
        timerId = setTimeout(function() {
          window.scrollTo({
            top: scrollTop,
            behavior: 'smooth'
          })
        }, 300)
      }, false)
    }

    // 判断是否是助力者
    function isHelper() {
      var query = getUrlQuery();
      var count = 0;
      var params = ['joinId', 'joinCardOpenId', 'activityId'];
      for (var key in query) {
        if (query.hasOwnProperty(key)) {
          if (params.indexOf(key) > -1) {
            count++;
          }
        }
      }
      if (count < params.length) {
        return false;
      }
      return query.joinCardOpenId !== WX_SDK.getCardOpenid();
    }

    // 弹窗禁止页面滚动
    function disabledScroll(event) {
      event.preventDefault();
    }

    // 显示弹窗
    function showPopup() {
      body.addClass('disabled-scroll');
      popup.on('touchmove', disabledScroll);
      popup.show();
    }

    // 关闭弹窗
    function closePopup() {
      body.removeClass('disabled-scroll')
      popup.off('touchmove', disabledScroll);
      popup.hide();
      popupShare.hide();
      clearPayForm();
      wrap.find('.payment .wechat-pay').remove();
      if (urlQuery) {
        redirect(urlQuery);
        urlQuery = null;
      }
    }

    // 显示更多助力者
    function showMoreHelpers(data) {
      /*if(!data.length){
        return;
      }*/
      var avatarList = '';
      var assistantAvatarList = '';
      //更多用户默认展示
      for(var i = 0; i < 5; i++){
        var aheadImgUrl = data[i] === undefined ? NO_MOREUSER : data[i].headImgUrl
        var aNickname = data[i] === undefined ? '' : data[i].nickname
        assistantAvatarList += `<div class="avatar-item"><img src="${aheadImgUrl}"><span>${aNickname}</span></div>`
      }
      var disableClass = data.length < 5 ? 'disabled' : ''
      wrap.find('.more-avatar').html(assistantAvatarList).append(`<div class="avatar-item J_showMore ${disableClass}"><img src="http://i0.um.tcl.com/icon-wepage-gengduo.png"></div>`);

      //更多用户弹窗数据
      data.map(function(item, index){
        avatarList += `<div class="avatar-item"><img src="${item.headImgUrl}" /><span>${item.nickname}</span></div>`
      })
      popup.find('.avatar-box').html(avatarList)

      wrap.find('.J_showMore').on('click', function () {
        closePopup();
        loading.hide();
        popup.find('.tips').hide();
        popup.find('.payment').hide();
        if (!$(this).hasClass('disabled')) {
          wrap.find('.more-helpers').show();
          popupContent.show();
          popup.show();
        }
      })
    }

    // 参与活动
    function joinActivite() {
      if(joining) {
        return;
      }
      joining = true;
      submitBtn.addClass('disabled');
      function successHandle(res) {
        joining = false;
        submitBtn.removeClass('disabled');
        closePopup();
        if (res.code === 1) {
          alertJoinSuccess();
          urlQuery = getUrlQueryByResponse(res)
        } else {
          alert(res.msgZ);
        }
      }
      function errorHandle(err) {
        joining = false;
        submitBtn.removeClass('disabled');
        // alert('网络错误！');
      }
      WX_SDK.joinActivity(JOIN_DATA, successHandle, errorHandle);
    }

    // 助力
    function help() {
      var data = getUrlQuery();

      function helpSuccessHandle(res) {
        if (res.code == 1) {
          getActiviteDetails();
          !helperHasJoin && updateSubmitBtn({
            text: '助力成功，我也要参与',
            handler: joinActivite
          }, res);
        } else {
          alert(res.msgZ);
        }
      }

      function helpErrorHandle(err) {
        // alert('网络错误！');
      }

      WX_SDK.assistanceActivity(data, helpSuccessHandle, helpErrorHandle);
    }

    function updateHelperSubmitBtn() {
      var data = {
        joinId: 0,
        activityId: WX_SDK.getActivityIds(),
        joinCardOpenId: WX_SDK.getCardOpenid(),
        queryDate: window.utils.formatDate(curTime, 'yyyy-MM-dd')
      }
      var successHandle = function (res) {
        var joinStatus = res.data.joinStatus;
        if (joinStatus > 1) {
          helperHasJoin = true;
          updateSubmitBtn({
            text: '查看我的参与',
            handler: function () {
              redirect(getUrlQueryByResponse(res));
            }
          });
        } else {
          updateSubmitBtn({
            text: '助力成功，我也要参与',
            handler: joinActivite
          }, res);
        }
        updateWtarmarkStatus()
      }
      var errorHandle = function () {
        updateWtarmarkStatus()
        // alert('网络错误！');
      }

      WX_SDK.getJoinActivity(data, successHandle, errorHandle);
    }

    // 获取活动页面详情
    function getActiviteDetails() {
      alertLoading()
      var query = getUrlQuery();
      var data = {
        joinId: query.joinId || 0,
        activityId: query.activityId || WX_SDK.getActivityIds(),
        joinCardOpenId: query.joinCardOpenId || WX_SDK.getCardOpenid(),
        queryDate: window.utils.formatDate(curTime, 'yyyy-MM-dd')
      };

      function successHandle(res) {
        var data = res.data;
        activiteStep = data.joinStatus;
        if (activiteStep > 1) {
          redirect(getUrlQueryByResponse(res));
        }
        renderPage(data);
        if (!isHelper()) {
          updateSubmitBtn(activiteStep, res);
        } else {
          updateHelperSubmitBtn();
        }
        updateWtarmarkStatus();
        closePopup();

      }

      function errorHandle(err) {
        // alert('网络错误！');
      }

      WX_SDK.getJoinActivity(data, successHandle, errorHandle);
    }

    // 更新水影和底部按钮
    function updateWtarmarkStatus(){
      if(invalidAct){
        submitBtn.off('click').text('活动已失效').addClass('disabled');
        invalidWatermark.show();
        unstartWatermark.hide();
      }else if(unstartAct){
        submitBtn.off('click').text('活动未开始').addClass('disabled');
        unstartWatermark.show();
        invalidWatermark.hide();
      }else{
        invalidWatermark.hide();
        unstartWatermark.hide();
      }
    }

    // 更新页面数据
    function renderPage(data) {
      var moneyCount = (data.accumulativeMoney || 0);
      var goodsNum = data.countSurplus === null ? PRODUCT_NUMBER : data.countSurplus;
      var assistanceHeadImgList = data.assistanceHeadImgList === null ? [] : data.assistanceHeadImgList
      activiteStep = data.joinStatus || 1;
      productNumNode.text('数量: ' + goodsNum);
      helperCountNode.text(data.accumulativeMember || 0);
      moneyCountNode.text(moneyCount);
      avatarNode.attr('src', data.headImgUrl || DEFAULT_AVATAR);
      showMoreHelpers(assistanceHeadImgList);
      if(isFreeGou()){
        var remainHelper = data.progressData === null ? 0 : data.progressData.surplusAssistanceNumber;
        var remainMoneyCount = data.progressData === null ? 0 : data.progressData.surplusAssistanceMoney;
        var joinedPersonNum = data.progressData === null ? 0 : data.progressData.totalJoinNumber;
        var remainProductNum = data.progressData === null ? 0 : data.progressData.surplusGoodsNumber;
        remainHelperCountNode.text(remainHelper);
        reamainMoneyCountNode.text(remainMoneyCount);
        joinedPerson.text(joinedPersonNum);
        reamainProductNode.text(remainProductNum);
        setProgress((PRODUCT_NUMBER - remainProductNum) * 100);
      }else{
        setProgress(moneyCount / (ORIGINAL_PRICE - 1) * 100);
      }
    }

    /***
     * 根据开始时间和结束时间显示中间时间段日期
     * @param {Number} start 开始时间，单位秒
     * @param {Number} end 结束时间，单位秒
     */
    function getPeriodTime(start, end){
      var daysLength = Math.round((end - start)/(1000*60*60*24)) + 1,
        daysList = '',
        curMonth = new Date().getMonth() + 1,
        curDay = new Date().getDate();
      
      for (var i = 0; i<daysLength; i++) {
        var iDate = start + i*24*60*60*1000,
          iMonth = Math.round(new Date(iDate).getMonth()) + 1,
          iDay = Math.round(new Date(iDate).getDate());

        if(iMonth > curMonth){
          daysList += `<div class="day-item J_invalid" data-date="${iDate}">${iMonth}月${iDay}日 <br /><span>已失效</span> </div>`
        } else if(iMonth === curMonth){
          if (iDay > curDay){
            daysList += `<div class="day-item J_unstart" data-date="${iDate}">${iMonth}月${iDay}日 <br /><span>00:00开启</span> </div>`
          } else if(iDay === curDay) {
            daysList += `<div class="day-item cur-day" data-date="${iDate}">${iMonth}月${iDay}日 <br /><span>正在抢购</span> </div>`
          } else {
            daysList += `<div class="day-item J_invalid" data-date="${iDate}">${iMonth}月${iDay}日 <br /><span>已失效</span> </div>`
          }
          
        } else if(iMonth < curMonth){
          daysList += `<div class="day-item J_unstart" data-date="${iDate}">${iMonth}月${iDay}日 <br /><span>00:00开启</span> </div>`
        }
      }

      days.html(daysList)
      var curDayOLeft = days.find('.cur-day')
      if(curDayOLeft.offset().left){
        days.scrollLeft(curDayOLeft.offset().left - 10)
      }

      days.find('.day-item').on('click', function(){
        $(this).addClass('cur-day').siblings('.day-item').removeClass('cur-day')
        if($(this).hasClass('J_unstart')){
          invalidAct = false
          unstartAct = true
        }else if($(this).hasClass('J_invalid')){
          unstartAct = false
          invalidAct = true
          if(activiteStep < 3){
            wrap.find('.fail-tips').show()
          }
        }else{
          unstartAct = false
          invalidAct = false
          wrap.find('.fail-tips').hide()
        }
        curTime = $(this).data('date');
        getActiviteDetails();

      })
    }

    // 设置进度条
    function setProgress(value) {
      if (value <= 0) {
        value = 0;
      }
      if (value >= 100) {
        value = 100;
      }
      var percent = value + '%';
      progreesCurrent.width(percent);
      progreesDot.css('left', percent);
    }

    // 更新底部提交按钮文案和事件
    function updateSubmitBtn(value, response) {
      var rd = is(response, 'Object') ? response.data || {} : {};
      var goodsNum = is(rd.countSurplus, 'Null') ? PRODUCT_NUMBER : rd.countSurplus;
      var isNoGoods = PRODUCT_NUMBER <= 0 || goodsNum <= 0;
      
      var text = '我要参与';
      var handler = null;

      if (is(value, 'Object')) {
        text = value.text;
        handler = value.handler;
      } else {
        if (value == 1) {
          text = isFreeGou() ? '立即参与' : '我要参与';
          handler = joinActivite;
        } else if (value == 2) {
          text = '邀请好友助力';
          handler = alertShare;
        } else if (value == 3) {
          text = isFreeGou() ? '提交表单' : '1元购买';
          handler = checkWechatPay;
        }
      }

      if (isNoGoods) {
        handler = alertNoGoods;
      }

      if (isActivityEnd()) {
        handler = alertActiviteEnd;
      }

      if (value == 4 || value == 5) {
        text = isFreeGou() ? '参与成功' : '已购买';
        handler = null;
      }

      submitBtn.text(text).removeClass('disabled');
      submitBtn.off('click');
      if (is(handler, 'Function')) {
        submitBtn.on('click', handler);
      }
    }

    // 添加支付表单验证器
    function addVerifiers() {
      payFormItems.each(function (index, item) {
        var
          that = $(item),
          input = that.find('input'),
          verifiers = [validatePayFormName, validatePayFormTel, validatePayFormVerifyCode];
        input.on('focus', function () {
          that.removeClass('check-fail');
        });
        input.on('blur', function () {
          verifiers[index](that);
        });
      });
    }

    // 提示参与成功
    function alertJoinSuccess() {
      closePopup();
      var title = isFreeGou() ? '' : '恭喜您，参与成功';
      var subTitle = isFreeGou() ? '参与成功，请邀请好友为您助力，<br />获得0元秒杀机会' : '邀请好友为您助力，1元抢购商品';
      setPopupContent(ICON_JOIN_SUCCESS, title, subTitle);
      loading.hide();
      popupContent.find('.authorize').hide();
      popupContent.find('.more-helpers').hide();
      popupContent.find('.general').show();
      popupContent.find('.tips').show();
      popupContent.find('.payment').hide();
      popupContent.show();
      showPopup();
    }

    // 提示分享助力
    function alertShare() {
      closePopup();
      loading.hide();
      popupContent.hide();
      popupShare.show();
      showPopup();
    }

    // loadingShow
    function alertLoading() {
      closePopup();
      popupContent.hide();
      loading.show();
      showPopup();
    }

    // 提示活动时间结束
    function alertActiviteEnd() {
      closePopup();
      setPopupContent(ICON_ACTIVITE_END, '亲，活动已经结束哦', '持续关注TCL，可参与更多活动');
      popupIcon.attr('src', ICON_ACTIVITE_END);
      loading.hide();
      popupContent.find('.authorize').hide();
      popupContent.find('.more-helpers').hide();
      popupContent.find('.general').show();
      popupContent.find('.tips').show();
      popupContent.find('.payment').hide();
      popupContent.show();
      showPopup();
    }

    // 提示无货
    function alertNoGoods() {
      closePopup();
      var subTitle = isFreeGou() ? '您可以在次日0点持续参与活动' : '持续关注TCL，可参与更多活动'
      setPopupContent(ICON_NO_GOODS, '十分遗憾，商品已抢完', subTitle);
      popupIcon.attr('src', ICON_NO_GOODS);
      loading.hide();
      popupContent.find('.authorize').hide();
      popupContent.find('.more-helpers').hide();
      popupContent.find('.general').show();
      popupContent.find('.tips').show();
      popupContent.find('.payment').hide();
      popupContent.show();
      showPopup();
    }

    // 提示支付
    function alertPay() {
      closePopup();
      var payBtn = isFreeGou() ? $('<div class="wechat-pay">提交</div>') : $('<div class="wechat-pay">微信支付</div>');
      payBtn.off('click').on('click', handleWechatPay);
      wrap.find('.payment').append(payBtn);
      loading.hide();
      popupShare.hide();
      popupContent.find('.tips').hide();
      popupContent.find('.more-helpers').hide();
      popupContent.find('.payment').show();
      popupContent.show();
      showPopup();
    }

    // 提交表单成功提示
    function alertSubmitSuccess() {
      closePopup();
      setPopupContent(ICON_SUBMIT_SUCCESS, '', '提交成功，内容卡的账号密码将通过<br />短信方式发送到您的手机');
      popupIcon.attr('src', ICON_SUBMIT_SUCCESS);
      loading.hide();
      popupContent.find('.authorize').hide();
      popupContent.find('.more-helpers').hide();
      popupContent.find('.general').show();
      popupContent.find('.tips').show();
      popupContent.find('.payment').hide();
      popupContent.show();
      showPopup();
    }

    // 提示扫码关注公众号
    function alertScanQRcodeFollow() {
      closePopup();
      setPopupContent(FOLLOW_QRCODE, '关注公众号', '暂缺二维码，待更新');
      loading.hide();
      popupContent.find('.authorize').hide();
      popupContent.find('.more-helpers').hide();
      popupContent.find('.general').show();
      popupContent.find('.tips').show();
      popupContent.find('.payment').hide();
      popupContent.show();
      showPopup();
    }

    // 设置弹窗内容
    function setPopupContent(iconSrc, title, subTitle) {
      popupIcon.attr('src', iconSrc);
      popupTitle.text(title);
      popupSubTitle.html(subTitle);
    }

    // 清空表单并移除校验结果
    function clearPayForm() {
      payFormItems.each(function (index, item) {
        $(item).removeClass('check-fail').find('input').val('');
      });
    }

    // 判断活动是否结束
    function isActivityEnd() {
      var endTime = WX_SDK.getActivityEndTime();
      var nowTime = Math.floor(new Date().getTime() / 1000);
      return nowTime >= endTime;
    }

    // 微信支付前校验
    function checkWechatPay() {
      if (isActivityEnd()) {
        alertActiviteEnd();
        return;
      }
      var data = getUrlQuery();
      var successHandler = function (res) {
        var rd = res.data || {};
        var remainGoodsNum = isFreeGou() ? rd.progressData.surplusGoodsNumber : rd.countSurplus
        if (res.code == 1) {
          remainGoodsNum > 0 ? alertPay() : alertNoGoods();
        } else {
          alert(res.msgZ);
        }
      }
      var errorHandler = function () {
        // alert('网络错误');
      }
      WX_SDK.getJoinActivity(data, successHandler, errorHandler);
    }

    // 微信支付
    function handleWechatPay() {
      var payBtn = wrap.find('.payment .wechat-pay');
      var disabled = paying || payBtn.hasClass('disabled') || !validatePayForm();
      if (disabled) {
        return;
      }
      paying = true;
      payBtn.addClass('disabled');
      var validateUrl = isFreeGou() ? $('#formSubmitUrl').val() : $('#paySubmitUrl').val();
      var name = getFormValue(payFormItems.eq(0));
      var tel = getFormValue(payFormItems.eq(1));
      var vcode = getFormValue(payFormItems.eq(2));
      var data = {
        pageId: null,
        formId: 10,
        data: [
          {name: '姓名', type: 'text', value: name},
          {name: '手机号码', type: 'text', tip: 'tel', value: tel},
          {name: '手机验证码', type: 'text', tip: 'vCode', value: vcode}
        ]
      };

      var successHandler = function (res) {
        if (res.code == 1) {
          if(isFreeGou()){
            getActiviteDetails();
            alertSubmitSuccess();
          } else {
            var money = PAY_AMOUNT * 100;  // 单位：分
            var cardTitle = '一元抢好物';
            var channel = WX_SDK.getChannel();
            var mobile = getFormValue(payFormItems.eq(1));
            WX_SDK.pay(money, cardTitle, channel, mobile);
          }
        } else {
          alert(res.msgZ);
        }
      }

      var errorHandler = function (err) {
        // alert('网络错误');
      }

      var completeHandler = function () {
        paying = false;
        payBtn.removeClass('disabled');
        if(!isFreeGou()){
          closePopup();
          getActiviteDetails();
        }
      }

      $.ajax({
        url: validateUrl,
        type: 'POST',
        data: JSON.stringify(data),
        contentType: 'application/json',
        dataType: 'json',
        cache: false,
        success: successHandler,
        error: errorHandler,
        complete: completeHandler
      });

    }

    // 获取表单值
    function getFormValue($node) {
      return $node.find('input').val();
    }

    // 校验表单项
    function validatePayForm() {
      var v1 = validatePayFormName(payFormItems.eq(0));
      var v2 = validatePayFormTel(payFormItems.eq(1));
      var v3 = validatePayFormVerifyCode(payFormItems.eq(2));
      return v1 && v2 && v3;
    }

    // 校验名字
    function validatePayFormName($node) {
      var value = getFormValue($node)
      if (value) {
        return true;
      }
      $node.addClass('check-fail').find('.check-form').text('请输入名字');
      return false;
    }

    // 校验电话
    function validatePayFormTel($node) {
      var value = getFormValue($node);
      var tips = $node.find('.check-form');
      if (!value) {
        tips.text('请输入手机号码');
        $node.addClass('check-fail');
        return false;
      }
      var isTel = /^1[0-9]{10}$/.test(value);
      if (!isTel) {
        tips.text('请输入正确的手机号码');
        $node.addClass('check-fail');
        return false;
      }
      return true;
    }

    // 校验验证码
    function validatePayFormVerifyCode($node) {
      var value = getFormValue($node)
      if (value) {
        return true;
      }
      $node.addClass('check-fail').find('.check-form').text('请输入验证码');
      return false;
    }

    // 获取验证码
    function getVerifyCode() {
      var disabled = $(this).hasClass('disabled');
      var mobileForm = payFormItems.eq(1);
      var isTel = validatePayFormTel(mobileForm);
      if (disabled || !isTel) {
        return;
      }
      var data = {
        mobile: getFormValue(mobileForm),
        captcheCode: '',
        captchaKey: ''
      }
      $.ajax({
        url: '/cloud/sms/sms/validCodeSend',
        type: 'GET',
        dataType: 'json',
        data: data,
        timeout: 6000,
        success: function (res) {
          alert(res.code == 1 ? '验证码发送成功' : res.msgZ);
        },
        error: function () {
          // alert('网络错误！');
        }
      })
      verifyCodeCountDown(59);
    }

    // 重新获取验证码倒计时
    function verifyCodeCountDown(second) {
      getVerifyBtn.addClass('disabled');
      getVerifyBtn.text('重新获取(' + second + 's)');
      var timer = setInterval(function () {
        if (--second < 0) {
          clearInterval(timer);
          getVerifyBtn.text('获取验证码');
          getVerifyBtn.removeClass('disabled');
        } else {
          getVerifyBtn.text('重新获取(' + second + 's)');
        }
      }, 1000);
    }

    // 活动倒计时
    function activiteCountDown(endTime) {
      if (!endTime) {
        return
      }
      var timer = setInterval(function () {
        var nowTime = Math.floor(new Date().getTime() / 1000);
        var delta = endTime - nowTime;
        if (delta < 0) {
          clearInterval(timer);
          return;
        }
        var times = secondToHms(delta).split('');
        var innerHTML = times.map(function (item) {
          var isNumber = /\d/.test(item);
          if (isNumber) {
            return '<span class="time">' + item + '</span>';
          }
          return '<span>' + item + '</span>';
        }).join('');
        countDoneNode.html(innerHTML);
      }, 1000);
    }

  });

})(window, document, JSON, typeof $ === 'undefined' ? void 0 : $);

;(function(window, document, JSON) {

  var utils = {
    is: _is,
    isNumber: _isNumber,
    isString: _isString,
    isBoolean: _isBoolean,
    isArray: _isArray,
    isObject: _isObject,
    isFunction: _isFunction,
    isRegExp: _isRegExp,
    isDate: _isDate,
    isSymbol: _isSymbol,
    isNull: _isNull,
    isUndefined: _isUndefined,
    isNaN: _isNaN,
    isWeiXin: _isWeiXin,
    isIOS: _isIOS,
    isAndroid: _isAndroid,
    toArray: _toArray,
    toBytes: _toBytes,
    extend: _extend,
    S2DHMS: _S2DHMS,
    formatDate: _formatDate,
    countdown: _countdown,
    replace: _replace,
  };

  window.utils = utils

  /**
   * 获取或者判断值类型
   * @param value
   * @param type
   * @return {type ? boolean : string}
   * @private
   */
  function _is(value, type) {
    var className = {}.toString.call(value).replace(/^\[object\s(\w+)\]$/, '$1')
    return type ? className.toLowerCase() === type.toLowerCase() : className
  }

  /**
   * 判断是否为 Number
   * @param value
   * @return {boolean}
   * @private
   */
  function _isNumber(value) {
    return _is(value, 'Number')
  }

  /**
   * 判断是否为 String
   * @param value
   * @return {boolean}
   * @private
   */
  function _isString(value) {
    return _is(value, 'String')
  }

  /**
   * 判断是否为 Array
   * @param value
   * @return {boolean}
   * @private
   */
  function _isArray(value) {
    return _is(value, 'Array')
  }

  /**
   * 判断是否为 Object
   * @param value
   * @return {boolean}
   * @private
   */
  function _isObject(value) {
    return _is(value, 'Object')
  }

  /**
   * 判断是否为 Boolean
   * @param value
   * @return {boolean}
   * @private
   */
  function _isBoolean(value) {
    return _is(value, 'Boolean')
  }

  /**
   * 判断是否为 Function
   * @param value
   * @return {boolean}
   * @private
   */
  function _isFunction(value) {
    return _is(value, 'Function')
  }

  /**
   * 判断是否为 RegExp
   * @param value
   * @return {boolean}
   * @private
   */
  function _isRegExp(value) {
    return _is(value, 'RegExp')
  }

  /**
   * 判断是否为 Date
   * @param value
   * @return {boolean}
   * @private
   */
  function _isDate(value) {
    return _is(value, 'Date')
  }

  /**
   * 判断是否为 Symbol
   * @param value
   * @return {boolean}
   * @private
   */
  function _isSymbol(value) {
    return _is(value, 'Symbol')
  }

  /**
   * 判断是否为 null
   * @param value
   * @return {boolean}
   * @private
   */
  function _isNull(value) {
    return _is(value, 'Null')
  }

  /**
   * 判断是否为 undefined
   * @param value
   * @return {boolean}
   * @private
   */
  function _isUndefined(value) {
    return _is(value, 'Undefined')
  }

  /**
   * 判断是否为 NaN
   * @param value
   * @return {boolean}
   * @private
   */
  function _isNaN(value) {
    return _isNumber(value) && value !== value
  }

  /**
   * 判断是不是微信浏览器
   * @return {boolean}
   * @private
   */
  function _isWeiXin() {
    var ua = window.navigator.userAgent.toLowerCase();
    return /micromessenger/.test(ua);
  }

  /**
   * 判断是否ios系统
   * @return {boolean}
   * @private
   */
  function _isIOS() {
    var iosReg = /\(i[^;]+;( U;)? CPU.+Mac OS X/i
    var ua = navigator.userAgent
    return iosReg.test(ua)
  }

  /**
   * 判断是否Android系统
   * @return {boolean}
   * @private
   */
  function _isAndroid() {
    var androidReg = /Android/i
    var ua = navigator.userAgent
    return androidReg.test(ua)
  }

  /**
   * 合并对象
   * @return {object}
   * @private
   */
  function _extend() {
    var items = _toArray(arguments).filter(function(item) {
      return _isObject(item)
    })
    var size = items.length
    if(size <= 0) {
      return {}
    }
    var target = items[0]
    for (var i = 1; i < size; i++) {
      var obj = items[i]
      for (var key in obj) {
        if(obj.hasOwnProperty(key)) {
          if(target[key] !== obj[key]) {
            target[key] = obj[key]
          }
        }
      }
    }
    return target
  }

  /**
   * 类数组对象转为数组
   * @param arrayLike
   * @return {array}
   * @private
   */
  function _toArray(arrayLike) {
      return [].slice.call(arrayLike)
  }

  /**
   * 带单位的文件大小转为不带单位的bytes字节数
   * @param size
   * @param base
   * @return {number}
   * @private
   */
  function _toBytes(size, base) {
    base = base || 1024
    var valueReg = /^(\d+(?:\.\d+)?)/;
    if(!valueReg.test(size)) {
      throw new Error('Unresolved: ' + size)
    }
    var units = ['B', 'K', 'M', 'G', 'T', 'P', 'E', 'Z', 'Y', 'B', 'N', 'D'];
    var value = RegExp.$1
    var unit = size.toString().replace(valueReg, '').trim() || 'B'
    var index = units.findIndex(function(item, i) {
      var str = '^' + item + (i === 0 ? '(?:yte)' : 'b') + '?$'
      var reg = new RegExp(str, 'i')
      return reg.test(unit)
    })
    if(index === -1) {
      throw new Error('Unrecognized unit: ' + unit)
    }
    var bytes = Math.ceil(value * Math.pow(base, index))
    return bytes
  }

  /**
   * 秒转换为dd天hh时mm分ss秒
   * @param s 秒数
   * @return {string}
   */
  function _S2DHMS(s) {
    if (s <= 0) {
      return '00天00时00分00秒';
    }
    var f = function (v) {
      return v < 10 ? '0' + v : v + '';
    }
    var dd = f(Math.floor(s / 3600 / 24));
    var hh = f(Math.floor(s / 3600) % 24);
    var mm = f(Math.floor(s / 60) % 60);
    var ss = f(Math.floor(s % 60));
    var str = [dd, '天', hh, '时', mm, '分', ss, '秒'].join('');
    return str
  }

  /**
   * 日期格式化
   * @param date
   * @param formatter
   * @return {string}
   */
  function _formatDate(date, formatter) {
    if(/yyyy|MM|dd|hh|mm|ss/g.test(date)) {
      formatter = date
      date = void 0
    }
    var f = function(n) {
      return n < 10 ? '0' + n : n + '';
    }
    var d = new Date(date || Date.now())
    var map = {
      'yyyy': d.getFullYear(),
      'MM': f(d.getMonth() + 1),
      'dd': f(d.getDate()),
      'hh': f(d.getHours()),
      'mm': f(d.getMinutes()),
      'ss': f(d.getSeconds())
    }
    formatter = _isString(formatter) ? formatter : 'yyyy-MM-dd hh:mm:ss'
    Object.keys(map).forEach(function(key) {
      formatter = formatter.replace(new RegExp(key, 'g'), map[key])
    })
    return formatter
  }

  /**
   * 字节格式化
   * @param bytes
   * @param digits
   * @param base
   * @return {string}
   * @private
   */
  function _formatBytes(bytes, digits, base) {
    digits = (digits || digits == 0) ? (digits < 0 ? 0 : digits > 20 ? 20 : digits) : 2
    base = base || 1024
    if(bytes <= 0) {
      return (0).toFixed(digits)
    }
    var units = ['B', 'KB', 'MB', 'GB', 'TB', 'PB', 'EB', 'ZB', 'YB', 'BB', 'NB', 'DB']
    var exponent = Math.floor(Math.log(bytes) / Math.log(base))
    var size = (bytes / Math.pow(base, exponent)).toFixed(digits)
    return exponent < units.length ? [size, units[exponent]].join('') : 'bytes too large'
  }

  /**
   * 倒计时
   * @param options
   * @return {void 0}
   */
  function _countdown(options) {
    var setting = _extend({
      duration: 60,
      interval: 1,
      beforeCountdown: null,
      onCountdown: null,
      afterCountdown: null
    }, options)
    var duration = setting.duration
    var beforeFn = setting.beforeCountdown
    var onFn = setting.onCountdown
    var afterFn = setting.afterCountdown
    var interval = setting.interval * 1000
    _isFunction(beforeFn) && beforeFn(duration)
    var timerId = setInterval(function() {
      if(--duration <= 0) {
        clearInterval(timerId)
        _isFunction(afterFn) && afterFn(duration, timerId)
      } else {
        _isFunction(onFn) && onFn(duration, timerId)
      }
    }, interval)
    return timerId;
  }

  /**
   * 字符串模板替换
   * @param template {string}
   * @param data {object}
   * @param [markers] {array}
   * @return {string}
   * @private
   */
  function _replace(template, data, markers) {
    markers = markers || ['{{', '}}'];
    for (var key in data) {
      if(data.hasOwnProperty(key)) {
        var reg = new RegExp(markers[0] + '\\s*' + key + '\\s*' + markers[1], 'g');
        template = template.replace(reg, function() {
          return data[key];
        });
      }
    }
    return template;
  }


})(window, document, JSON);

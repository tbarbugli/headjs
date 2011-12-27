/**
    Head JS     The only script in your <HEAD>
    Copyright   Tero Piirainen (tipiirai)
    License     MIT / http://bit.ly/mit-license
    Version     0.96

    http://headjs.com
*/
(function (doc) {

  var html = doc.documentElement,
      conf = {
        screens: [320, 480, 640, 768, 1024, 1280, 1440, 1680, 1920],
        section: "-section",
        page: "-page",
        head: "head"
      },
      klass = [];


  if (window.head_conf) {
    for (var key in head_conf) {
      if (head_conf[key] !== undefined) {
        conf[key] = head_conf[key];
      }
    }
  }

  function pushClass(name) {
    klass[klass.length] = name;
  }

  function removeClass(name) {
    var re = new RegExp("\\b" + name + "\\b");
    html.className = html.className.replace(re, '');
  }

  // TODO: Replace with ECMA-262 equivalent
  function each(arr, fn) {
    for (var i = 0, arr_length = arr.length; i < arr_length; i++) {
      fn.call(arr, arr[i], i);
    }
  }

  if (!Array.prototype.forEach) {

    Array.prototype.forEach = function (fn, thisArg) {

      var T, k;

      if (this == null) {
        throw new TypeError("this is null or not defined");
      }

      // 1. Let O be the result of calling ToObject passing the |this| value as the argument.
      var O = Object(this);

      // 2. Let lenValue be the result of calling the Get internal method of O with the argument "length".
      // 3. Let len be ToUint32(lenValue).
      var len = O.length >>> 0; // Hack to convert O.length to a UInt32

      // 4. If IsCallable(fn) is false, throw a TypeError exception.
      // See: http://es5.github.com/#x9.11
      if ({}.toString.call(fn) != "[object Function]") {
        throw new TypeError(fn + " is not a function");
      }

      // 5. If thisArg was supplied, let T be thisArg; else let T be undefined.
      if (thisArg) {
        T = thisArg;
      }

      // 6. Let k be 0
      k = 0;

      // 7. Repeat, while k < len
      while (k < len) {

        var kValue;

        // a. Let Pk be ToString(k).
        //   This is implicit for LHS operands of the in operator
        // b. Let kPresent be the result of calling the HasProperty internal method of O with argument Pk.
        //   This step can be combined with c
        // c. If kPresent is true, then
        if (k in O) {

          // i. Let kValue be the result of calling the Get internal method of O with argument Pk.
          kValue = O[k];

          // ii. Call the Call internal method of fn with T as the this value and
          // argument list containing kValue, k, and O.
          fn.call(T, kValue, k, O);
        }
        // d. Increase k by 1.
        k++;
      }
      // 8. return undefined
    };
  }

  // API
  var api = window[conf.head] = function () {
    api.ready.apply(null, arguments);
  };

  api.feature = function(key, enabled, queue) {

    // internal: apply all classes
    if (!key) {
      html.className += ' ' + klass.join( ' ' );
      klass = [];
      return;
    }

    if (Object.prototype.toString.call(enabled) == '[object Function]') {
      enabled = enabled.call();
    }

    pushClass((enabled ? '' : 'no-') + key);
    api[key] = !!enabled;

    // apply class to HTML element
    if (!queue) {
      removeClass('no-' + key);
      removeClass(key);
      api.feature();
    }

    return api;
  };

  // browser type & version
  var ua = navigator.userAgent.toLowerCase();

  ua = /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
       /(opera)(?:.*version)?[ \/]([\w.]+)/.exec( ua ) ||
       /(msie) ([\w.]+)/.exec( ua ) ||
       !/compatible/.test( ua ) && /(mozilla)(?:.*? rv:([\w.]+))?/.exec( ua ) || [];


  if (ua[1] == 'msie') {
    ua[1] = 'ie';
    ua[2] = document.documentMode || ua[2];
  }

  pushClass(ua[1]);

  api.browser = { version: ua[2] };
  api.browser[ua[1]] = true;

  // IE specific
  if (api.browser.ie) {

    pushClass("ie" + parseFloat(ua[2]));

    // IE versions
    for (var ver = 3; ver < 11; ver++) {
      if (parseFloat(ua[2]) < ver) { pushClass("lt-ie" + ver); }
    }

    // HTML5 support
    each("abbr|article|aside|audio|canvas|details|figcaption|figure|footer|header|hgroup|mark|meter|nav|output|progress|section|summary|time|video".split("|"), function(el) {
      doc.createElement(el);
    });
  }

  // CSS "router"
  each(location.pathname.split("/"), function(el, i) {

    if (this.length > 2 && this[i + 1] !== undefined) {
      if (i) {
        pushClass(this.slice(1, i+1).join("-") + conf.section);
      }
    } else {

      // pageId
      var id = el || "index", index = id.indexOf(".");
      if (index > 0) {
        id = id.substring(0, index);
      }
      html.id = id + conf.page;

            // on root?
      if (!i) {
        pushClass("root" + conf.section);
      }
    }
  });


  // screen resolution: w-100, lt-480, lt-1024 ...
  function screenSize() {
    var w = window.outerWidth || html.clientWidth;

    // remove earlier widths
    html.className = html.className.replace(/ (w|lt)-\d+/g, "");

    // add new ones
    pushClass("w-" + Math.round(w / 100) * 100);

    each(conf.screens, function(width) {
      if (w <= width) {
        pushClass("lt-" + width);
      }
    });

    api.feature();
  }

  screenSize();
  window.onresize = screenSize;

  api.feature("js", true).feature();

})(document);

/**
    Head JS     The only script in your <HEAD>
    Copyright   Tero Piirainen (tipiirai)
    License     MIT / http://bit.ly/mit-license
    Version     0.96

    http://headjs.com
*/
;(function (doc) {

  var html = doc.documentElement,
      conf = {
        screens: [320, 480, 640, 768, 1024, 1280, 1440, 1680, 1920],
        section: '-section',
        page: '-page',
        head: 'head'
      },
      klass = []


  if (window.head_conf) {
    for (var key in head_conf) {
      if (head_conf[key] !== undefined) {
        conf[key] = head_conf[key]
      }
    }
  }

  function pushClass(name) {
    klass[klass.length] = name
  }

  function removeClass(name) {
    var re = new RegExp('\\b' + name + '\\b')
    html.className = html.className.replace(re, '')
  }

  Array.prototype.forEach = Array.prototype.each = function (fn, thisArg) {
    var T,
        k = 0,
        O = Object(this),
        len = O.length >>> 0; // Hack to convert O.length to a UInt32

    if (thisArg) {
      T = thisArg
    }

    if (this == null) {
      throw new TypeError('this is null or not defined')
    }

    if ({}.toString.call(fn) != '[object Function]') {
      throw new TypeError(fn + ' is not a function')
    }

    while (k < len) {
      var kValue

      if (k in O) {
        kValue = O[k]
        fn.call(T, kValue, k, O)
      }
      k++
    }
  }

  // API
  var api = window[conf.head] = function () {
    api.ready.apply(null, arguments)
  }

  api.feature = function (key, enabled, queue) {

    // internal: apply all classes
    if (!key) {
      html.className += ' ' + klass.join( ' ' )
      klass = []
      return
    }

    if (Object.prototype.toString.call(enabled) == '[object Function]') {
      enabled = enabled.call()
    }

    pushClass((enabled ? '' : 'no-') + key)
    api[key] = !!enabled

    // apply class to HTML element
    if (!queue) {
      removeClass('no-' + key)
      removeClass(key)
      api.feature()
    }

    return api
  }

  // browser type & version
  var ua = navigator.userAgent.toLowerCase()

  ua = /(webkit)[ \/]([\w.]+)/.exec( ua ) ||
       /(opera)(?:.*version)?[ \/]([\w.]+)/.exec( ua ) ||
       /(msie) ([\w.]+)/.exec( ua ) ||
       !/compatible/.test( ua ) && /(mozilla)(?:.*? rv:([\w.]+))?/.exec( ua ) || []


  if (ua[1] == 'msie') {
    ua[1] = 'ie'
    ua[2] = document.documentMode || ua[2]
  }

  pushClass(ua[1])

  api.browser = { version: ua[2] }
  api.browser[ua[1]] = true

  // IE specific
  if (api.browser.ie) {

    pushClass('ie' + parseFloat(ua[2]))

    // IE versions
    for (var ver = 3; ver < 11; ver++) {
      if (parseFloat(ua[2]) < ver) { pushClass('lt-ie' + ver); }
    }

    // HTML5 support
    [ 'abbr'
    , 'article'
    , 'aside'
    , 'audio'
    , 'canvas'
    , 'details'
    , 'figcaption'
    , 'figure'
    , 'footer'
    , 'header'
    , 'hgroup'
    , 'mark'
    , 'meter'
    , 'nav'
    , 'output'
    , 'progress'
    , 'section'
    , 'summary'
    , 'time'
    , 'video'
    ]. each(function (el) {
      doc.createElement(el)
    })

  }

  // CSS 'router'
  location.pathname.split('/').each(function (el, i) {

    if (this.length > 2 && this[i + 1] !== undefined) {
      if (i) {
        pushClass(this.slice(1, i+1).join('-') + conf.section)
      }
    } else {

      // pageId
      var id = el || 'index', index = id.indexOf('.')
      if (index > 0) {
        id = id.substring(0, index)
      }
      html.id = id + conf.page

            // on root?
      if (!i) {
        pushClass('root' + conf.section)
      }
    }
  })


  // screen resolution: w-100, lt-480, lt-1024 ...
  function screenSize() {
    var w = window.outerWidth || html.clientWidth

    // remove earlier widths
    html.className = html.className.replace(/ (w|lt)-\d+/g, '')

    // add new ones
    pushClass('w-' + Math.round(w / 100) * 100)

    conf.screens.each(function (width) {
      if (w <= width) {
        pushClass('lt-' + width)
      }
    })

    api.feature()
  }

  screenSize()
  window.onresize = screenSize

  api.feature('js', true).feature()

})(document)
/**
    Head JS     The only script in your <HEAD>
    Copyright   Tero Piirainen (tipiirai)
    License     MIT / http://bit.ly/mit-license
    Version     0.96

    http://headjs.com
*/
;(function () {
  /*
      To add a new test:

      head.feature("video", function() {
        var tag = document.createElement('video');
        return !!tag.canPlayType;
      });

      Good place to grab more tests

      https://github.com/Modernizr/Modernizr/blob/master/modernizr.js
  */


  /* CSS modernizer */
  var el = document.createElement("i"),
      style = el.style,
      prefs = ' -o- -moz- -ms- -webkit- -khtml- '.split(' '),
      domPrefs = 'Webkit Moz O ms Khtml'.split(' '),
      head_var = window.head_conf && head_conf.head || "head",
      api = window[head_var];


  // Thanks Paul Irish!
  function testProps(props) {
    for (var i in props) {
      if (style[props[i]] !== undefined) {
        return true;
      }
    }
  }

  function testAll(prop) {
    var camel = prop.charAt(0).toUpperCase() + prop.substr(1),
        props   = (prop + ' ' + domPrefs.join(camel + ' ') + camel).split(' ');

    return !!testProps(props);
  }

  var tests = {

        gradient: function() {
          var s1 = 'background-image:',
              s2 = 'gradient(linear,left top,right bottom,from(#9f9),to(#fff));',
              s3 = 'linear-gradient(left top,#eee,#fff);';

          style.cssText = (s1 + prefs.join(s2 + s1) + prefs.join(s3 + s1)).slice(0,-s1.length);
          return !!style.backgroundImage;
        },

        rgba: function() {
          style.cssText = "background-color:rgba(0,0,0,0.5)";
          return !!style.backgroundColor;
        },

        opacity: function() {
          return el.style.opacity === "";
        },

        textshadow: function() {
          return style.textShadow === '';
        },

        multiplebgs: function() {
          style.cssText = "background:url(//:),url(//:),red url(//:)";
          return new RegExp("(url\\s*\\(.*?){3}").test(style.background);
        },

        boxshadow: function() {
          return testAll("boxShadow");
        },

        borderimage: function() {
          return testAll("borderImage");
        },

        borderradius: function() {
          return testAll("borderRadius");
        },

        cssreflections: function() {
          return testAll("boxReflect");
        },

        csstransforms: function() {
          return testAll("transform");
        },

        csstransitions: function() {
          return testAll("transition");
        },

        /*
          font-face support. Uses browser sniffing but is synchronous.

          http://paulirish.com/2009/font-face-feature-detection/
        */
        fontface: function() {
          var ua = navigator.userAgent,
              parsed;

          if (/*@cc_on@if(@_jscript_version>=5)!@end@*/0)
            return true;

            if (parsed = ua.match(/Chrome\/(\d+\.\d+\.\d+\.\d+)/))
                return parsed[1] >= '4.0.249.4' || 1 * parsed[1].split(".")[0] > 5;
            if ((parsed = ua.match(/Safari\/(\d+\.\d+)/)) && !/iPhone/.test(ua))
                return parsed[1] >= '525.13';
            if (/Opera/.test({}.toString.call(window.opera)))
                return opera.version() >= '10.00';
            if (parsed = ua.match(/rv:(\d+\.\d+\.\d+)[^b].*Gecko\//))
                return parsed[1] >= '1.9.1';

            return false;
        }
    };

    // queue features
    for (var key in tests) {
      if (tests[key]) {
        api.feature(key, tests[key].call(), true);
      }
    }

    // enable features at once
    api.feature();

})();
/**
    Head JS     The only script in your <HEAD>
    Copyright   Tero Piirainen (tipiirai)
    License     MIT / http://bit.ly/mit-license
    Version     0.96

    http://headjs.com
*/
;(function (doc) {

  var head = doc.documentElement,
      isHeadReady,
      isDomReady,
      domWaiters = [],
      queue = [],        // waiters for the 'head ready' event
      handlers = {},     // user functions waiting for events
      scripts = {},      // loadable scripts in different states
      isAsync = doc.createElement('script').async === true || 'MozAppearance' in doc.documentElement.style || window.opera

  /*** public API ***/
  var head_var = window.head_conf && head_conf.head || 'head',
      api = window[head_var] = (window[head_var] || function() { api.ready.apply(null, arguments); })

  // states
  var PRELOADED = 1,
      PRELOADING = 2,
      LOADING = 3,
      LOADED = 4

  // Method 1: simply load and let browser take care of ordering
  if (isAsync) {

    api.js = function () {

      var args = [].slice.apply(arguments),
          fn = args[args.length - 1],
          els = {}

      if (!isFunc(fn)) {
        fn = null
      }

      each(args,function (el, i) {

        if (el != fn) {
          el = getScript(el)
          els[el.name] = el

          load(el, fn && i == args.length - 2 ? function () {
            if (allLoaded(els)) {
              one(fn)
            }

          } : null)
        }
      })

      return api
    }


    // Method 2: preload with text/cache hack
  } else {

    api.js = function () {

      var args = arguments,
          rest = [].slice.call(args, 1),
          next = rest[0]

      // wait for a while. immediate execution causes some browsers to ignore caching
      if (!isHeadReady) {
        queue.push(function () {
          api.js.apply(null, args)
        })
        return api
      }

      // multiple arguments
      if (next) {

        // load
        each(rest, function (el) {
          if (!isFunc(el)) {
            preload(getScript(el))
          }
        })

        // execute
        load(getScript(args[0]), isFunc(next) ? next : function () {
          api.js.apply(null, rest)
        })


      // single script
      } else {
        load(getScript(args[0]))
      }

      return api
    }
  }


  api.ready = function (key, fn) {

    // DOM ready check: head.ready(document, function() { })
    if (key == doc) {
      if (isDomReady) {
        one(fn)
      } else {
        domWaiters.push(fn)
      }
      return api
    }

    // shift arguments
    if (isFunc(key)) {
      fn = key
      key = 'ALL'
    }

    // make sure arguments are sane
    if (typeof key != 'string' || !isFunc(fn)) {
      return api
    }

    key = key.replace(/\s/g, "");
    var keys = key.split(",");
    if (typeof keys == 'string') {
      keys = [key];
    }

    // everything is loaded and waiting for it
    if (key == 'ALL' && allLoaded() && isDomReady) {
      one(fn)
      return api
    }

    for (var i=0; i<keys.length;i++){
      if (keys.length == 0){
        one(fn);
        return api;
      }
      var script = scripts[keys[i]];
      if (script && script.state == LOADED) {
        removeByValue(keys, keys[i]);
      }
    }

    var arr = handlers[keys];
    if (arr) {
      arr.push(fn)
    } else {
      arr = handlers[keys] = [fn];
    }
    return api
  };


  // perform this when DOM is ready
  api.ready(doc, function () {

    if (allLoaded()) {
      each(handlers.ALL, function (fn) {
        one(fn)
      })
    }

    if (api.feature) {
      api.feature('domloaded', true)
    }
  });


  /*** private functions ***/

  // call function once
  function one(fn) {
    if (fn._done) {
      return
    }
    fn()
    fn._done = 1
  }


  function toLabel(url) {
    var els = url.split('/'),
        name = els[els.length -1],
        i = name.indexOf('?')

    return i != -1 ? name.substring(0, i) : name
  }


  function getScript(url) {

    var script

    if (typeof url == 'object') {
      for (var key in url) {
        if (url[key]) {
          script = { name: key, url: url[key] }
        }
      }
    } else {
      script = { name: toLabel(url),  url: url }
    }

    var existing = scripts[script.name]
    if (existing && existing.url === script.url) {
      return existing
    }

    scripts[script.name] = script
    return script
  }


  function each(arr, fn) {
    if (!arr) { return }

    // arguments special type
    if (typeof arr == 'object')
      arr = [].slice.call(arr)

    // do the job
    for (var i = 0; i < arr.length; i++) {
      fn.call(arr, arr[i], i)
    }
  }

  function isFunc(el) {
    return Object.prototype.toString.call(el) == '[object Function]'
  }

  function removeByValue(arr, val) {
    for(var i=0; i<arr.length; i++) {
      if(arr[i] == val) {
        arr.splice(i, 1);
        break;
      }
    }
  }

  function allLoaded(els) {

    els = els || scripts

    var loaded;

    for (var name in els) {
      if (els.hasOwnProperty(name) && els[name].state != LOADED) {
        return false
      }
      loaded = true
    }

    return loaded
  }


  function onPreload(script) {

    script.state = PRELOADED

    each(script.onpreload, function (el) {
      el.call()
    })
  }


  function preload(script, callback) {

    if (script.state === undefined) {
      script.state = PRELOADING
      script.onpreload = []

      scriptTag({ src: script.url, type: 'cache'}, function () {
        onPreload(script)
      })
    }
  }


  function load(script, callback) {

    if (script.state == LOADED) {
      return callback && callback()
    }

    if (script.state == LOADING) {
      return api.ready(script.name, callback)
    }

    if (script.state == PRELOADING) {
      return script.onpreload.push(function () {
        load(script, callback)
      });
    }

    script.state = LOADING;
    scriptTag(script.url, function () {
    script.state = LOADED;
    if (callback) {
      callback()
    }

    // handlers for this script
    for (keys in handlers) {
      var keys = keys.split(",");
      if (keys == script.name) {
        each(handlers[keys], function(fn) {
          one(fn);
        });
      }
      var fn = handlers[keys];
      delete handlers[keys];
      removeByValue(keys, script.name);
      handlers[keys] = fn;
    }

    // everything ready
    if (allLoaded() && isDomReady) {
      each(handlers.ALL, function (fn) {
        one(fn);
      });
    }
  });
}

  function scriptTag(src, callback) {

    var s = doc.createElement('script')

    s.type = 'text/' + (src.type || 'javascript')
    s.src = src.src || src
    s.async = false

    s.onreadystatechange = s.onload = function () {

      var state = s.readyState

      if (!callback.done && (!state || /loaded|complete/.test(state))) {
        callback.done = true
        callback()
      }
    }

    // use body if available. more safe in IE
    ;(doc.body || head).appendChild(s)
  }

  /*
      The much desired DOM ready check
      Thanks to jQuery and http://javascript.nwbox.com/IEContentLoaded/
  */

  function fireReady() {
    if (!isDomReady) {
      isDomReady = true
      each(domWaiters, function (fn) {
        one(fn)
      })
    }
  }

  // W3C
  if (window.addEventListener) {
    doc.addEventListener('DOMContentLoaded', fireReady, false)

    // fallback. this is always called
    window.addEventListener('load', fireReady, false)

  // IE
  } else if (window.attachEvent) {

    // for iframes
    doc.attachEvent('onreadystatechange', function ()  {
      if (doc.readyState === 'complete' ) {
        fireReady()
      }
    });

    // avoid frames with different domains issue
    var frameElement = 1

    try {
        frameElement = window.frameElement

    } catch (e) {
      //
    }

    if (!frameElement && head.doScroll) {

      (function () {
        try {
          head.doScroll('left');
          fireReady()

        } catch (e) {
          setTimeout(arguments.callee, 1)
          return
        }
      })()
    }

    // fallback
    window.attachEvent('onload', fireReady)
  }

  // enable document.readyState for Firefox <= 3.5
  if (!doc.readyState && doc.addEventListener) {
    doc.readyState = 'loading'
    doc.addEventListener('DOMContentLoaded', handler = function () {
      doc.removeEventListener('DOMContentLoaded', handler, false)
      doc.readyState = 'complete'
    }, false)
  }

  /*
      We wait for 300 ms before script loading starts. for some reason this is needed
      to make sure scripts are cached. Not sure why this happens yet. A case study:

      https://github.com/headjs/headjs/issues/closed#issue/83
  */
  setTimeout(function () {
    isHeadReady = true
    each(queue, function (fn) {
      fn()
    })
  }, 300)

})(document)
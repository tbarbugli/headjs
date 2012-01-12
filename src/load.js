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
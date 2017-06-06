;(function (customConfig) {
    window.__scrollMemory = {};

    // 配置信息初始化
    if ( typeof customConfig === 'undefined' ) { customConfig = {}; }
    var config = {
        keyName: 'scrollTop', // 存储在localStorage中的key值
        isLog: false, // 是否打log
        delay: null, // 是否延迟执行
        autoListen: true,
        autoScroll: true,
        waitAllFile: false, // 是否等待所有文件加载完成 即用onload事件
        iframeOk: true, // 如果在iframe是否还运行
        throttleTime: 20, // 写入localStorage函数节流的时间
        uniqueMark: location.href, // 页面的唯一标识
        maxAge: 1000 * 60 * 60 * 24 * 90, // 旧页面过期时间从当前时间节点向前算
        maxCount: 100 // 最多存储的page数量
    };
    for ( var key in customConfig ) {
        config[key] = customConfig[key];
    }

    // log函数
    function log() {
        config.isLog === true && console.log.apply(window, arguments);
    }

    // iframe处理
    if ( config.iframeOk === false && top !== this ) {
        log('in iframe so not auto scroll');
        return null;
    }

    var isLoad = false;
    var canListen = config.autoListen;

    // 读取localStorage内容
    function readLocalStorage () {
        var positionStr = localStorage.getItem(config.keyName);
        var positionObj = {};

        try {
            positionObj = JSON.parse(positionStr);

            // 还有可能是null
            if ( typeof positionObj !== 'object' || positionObj === null ) {
                localStorage.removeItem(config.keyName);
                return void 0;
            } else {
                return positionObj;
            }
        } catch (e) {
            localStorage.removeItem(config.keyName);
            return void 0;
        }
    }

    // 写入localStorage
    function writeLocalStorage (scrollTop) {
        var data = readLocalStorage();
        if ( typeof data === 'undefined' ) { data = {}; }

        data[config.uniqueMark] = {
            scrollTop: scrollTop,
            time: new Date().getTime()
        };

        localStorage.setItem(config.keyName, JSON.stringify(data));
    }

    // 会根据配置信息被 DOMContentLoaded 或者 onload 事件触发，默认采用DOMContentLoaded方式
    function infactLoaded () {
        function inrealityLoaded() {
            log('page loaded');
            scrollToHistory();
            isLoad = true;
        }

        if ( typeof config.delay === 'number' ) {
            setTimeout(inrealityLoaded, config.delay);
        } else {
            inrealityLoaded();
        }
    }

    if ( config.autoScroll === true ) {
        if ( !config.waitAllFile ) {
            contentLoaded(window, infactLoaded);
        } else {
            allPageOnload(infactLoaded);
        }
    }

    __scrollMemory.scrollToLast = function () {
        infactLoaded();
    };
    __scrollMemory.updateConfig = function (customConfig) {
        if ( typeof customConfig === 'undefined' ) { customConfig = {}; }
        for ( var key in customConfig ) {
            config[key] = customConfig[key];
        }
    };
    // 开始监听
    __scrollMemory.start = function (key) {
        config.uniqueMark = key;
        canListen = true;
    };
    // 停止监听
    __scrollMemory.end = function () {
        canListen = false;
    };

    // 滚动监听
    var throttleTimer = null;
    document.addEventListener('scroll', function (e) {
        // if ( isLoad === false && config.autoScroll === true ) { return null; }
        // 是否允许监听
        if ( !canListen ) { return null; }

        clearTimeout(throttleTimer);
        throttleTimer = setTimeout(function () {
            var docScrollTop = document.documentElement.scrollTop;
            var bodyScrollTop = document.body.scrollTop;
            var scrollTop = Math.max(docScrollTop, bodyScrollTop); // 有时候有兼容新问题 需要取最大
            writeLocalStorage(scrollTop);
            log('on scroll:', scrollTop);
        }, config.throttleTime);
    });

    // 滚动到记忆位置的操作
    function scrollToHistory () {
        var lsData = readLocalStorage();

        if ( lsData && lsData[config.uniqueMark] && lsData[config.uniqueMark].scrollTop ) {
            // 针对金丝雀的hack
            var scrollTop = lsData[config.uniqueMark].scrollTop;
            var scrollLeft = document.documentElement.scrollLeft;

            log('scroll to:', scrollTop);
            if (document.documentElement.scrollTo) {
                document.documentElement.scrollTo(scrollLeft, scrollTop);
            } else if (document.body.scrollTo) {
                document.body.scrollTo(scrollLeft, scrollTop);
            } else if (window.scrollTo) {
                window.scrollTo(scrollLeft, scrollTop);
            }

            // 这种方式会有this绑定问题
            // var scrollTo = document.documentElement.scrollTo || document.body.scrollTo || window.scrollTo;
            // scrollTo(scrollLeft, scrollTop);
        }
    }

    /*!
     * https://github.com/dperini/ContentLoaded
     * contentloaded.js
     *
     * Author: Diego Perini (diego.perini at gmail.com)
     * Summary: cross-browser wrapper for DOMContentLoaded
     * Updated: 20101020
     * License: MIT
     * Version: 1.2
     *
     * URL:
     * http://javascript.nwbox.com/ContentLoaded/
     * http://javascript.nwbox.com/ContentLoaded/MIT-LICENSE
     *
     */

    // @win window reference
    // @fn function reference
    // DOMContentLoaded
    function contentLoaded(win, fn) {

        var done = false, top = true,

            doc = win.document,
            root = doc.documentElement,
            modern = doc.addEventListener,

            add = modern ? 'addEventListener' : 'attachEvent',
            rem = modern ? 'removeEventListener' : 'detachEvent',
            pre = modern ? '' : 'on',

            init = function(e) {
                if (e.type === 'readystatechange' && doc.readyState !== 'complete') return;
                (e.type === 'load' ? win : doc)[rem](pre + e.type, init, false);
                if (!done && (done = true)) fn.call(win, e.type || e);
            },

            poll = function() {
                try { root.doScroll('left'); } catch(e) { setTimeout(poll, 50); return; }
                init('poll');
            };

        if (doc.readyState === 'complete') fn.call(win, 'lazy');
        else {
            if (!modern && root.doScroll) {
                try { top = !win.frameElement; } catch(e) { }
                if (top) poll();
            }
            doc[add](pre + 'DOMContentLoaded', init, false);
            doc[add](pre + 'readystatechange', init, false);
            win[add](pre + 'load', init, false);
        }

    }

    // onload
    function allPageOnload(callback) {
        if (document.readyState === 'complete') {
            callback.call(window, 'lazy');
        }
        if ( window.addEventListener ) {
            window.addEventListener('load', function (e) {
                callback(e);
            }, false)
        } else {
            window.attachEvent('onload', function (e) {
                e = e || window.e;
                callback(e);
            })
        }
    }


    // 清除老的历史
    function clearOldLocalStorage() {
        var data = readLocalStorage();

        if ( typeof data !== 'undefined' ) {
            var dataArr = [];
            var newData = {};
            var nowTime = new Date().getTime();

            for ( var key in data ) {
                dataArr.push({
                    id: key,
                    time: data[key].time,
                    scrollTop: data[key].scrollTop
                })
            }

            // 将序排列，时间新的在前面
            dataArr.sort(function (a, b) { return b.time - a.time; });

            dataArr.splice(config.maxAge);

            var expIndex = -1;
            for ( var i = 0, len = dataArr.length; i < len; i++ ) {
                if ( nowTime - dataArr[i].id > config.maxAge ) {
                    expIndex = i;
                    break;
                }
            }

            if (expIndex !== -1) { dataArr.splice(expIndex); }

            for ( var i = 0, len = dataArr.length; i < len; i++ ) {
                var item = dataArr[i];
                newData[item.id] = {
                    time: item.time,
                    scrollTop: item.scrollTop
                }
            }
        }
    }

    clearOldLocalStorage();

})({
    keyName: 'scrollTop', // 存储在localStorage中的key值
    autoListen: false, // 自动监听滚动
    autoScroll: false, // 自动滚动到上次位置
    isLog: true, // 是否打log
    waitAllFile: false, // 是否等待所有文件加载完成 即用onload事件 autoScroll 为true才有效
    uniqueMark: location.href // 页面的唯一标识
});
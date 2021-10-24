var mkPlayer = {
    api: 'api.php', // api地址
    loadcount: 20,  // 搜索结果一次加载多少条
    method: 'GET',     // 数据传输方式(POST/GET)
    defaultlist: 3,    // 默认要显示的播放列表编号
    autoplay: false,    // 是否自动播放(true/false) *此选项在移动端可能无效
    coverbg: true,      // 是否开启封面背景(true/false) *开启后会有些卡
    mcoverbg: true,     // 是否开启[移动端]封面背景(true/false)
    dotshine: true,    // 是否开启播放进度条的小点闪动效果[不支持IE](true/false) *开启后会有些卡
    mdotshine: false,   // 是否开启[移动端]播放进度条的小点闪动效果[不支持IE](true/false)
    volume: 0.6,        // 默认音量值(0~1之间)
    version: 'v2.41',    // 播放器当前版本号(仅供调试)
    debug: true   // 是否开启调试模式(true/false)
}

function DataSaver() {

}

DataSaver.prototype = {
    // 播放器本地存储信息
    // 参数：键值、数据
    savedata: function (key, data) {
        key = 'mkPlayer2_' + key;    // 添加前缀，防止串用
        data = JSON.stringify(data);
        // 存储，IE6~7 不支持HTML5本地存储
        if (window.localStorage) {
            localStorage.setItem(key, data);
        }
    },
    // 播放器读取本地存储信息
    // 参数：键值
    // 返回：数据
    readdata: function (key) {
        if (!window.localStorage) return '';
        key = 'mkPlayer2_' + key;
        return JSON.parse(localStorage.getItem(key));
    }

}


// 存储全局变量
var rem = [];
rem.dataSaver = new DataSaver();        // 连续播放失败的歌曲数归零

function AudioControl(audioContainer){
    this.audioContainer = audioContainer
}

AudioControl.prototype = {
    getAudio: function(){
        return this.audioContainer;
    },
    init: function () {
        //enable keyboard control , spacebar to play and pause
        var that = this;
        // 播放、暂停按钮的处理
        $(".btn-play").on("click", function () {
            window.dispatchEvent(new Event('player-pause'));
        });
        // 循环顺序的处理
        $(".btn-order").on("click", function () {
            that.orderChange();
        });
        // 上一首歌
        $(".btn-prev").on("click", function () {
            window.dispatchEvent(new Event('audioFinished'));
        });

        // 下一首
        $(".btn-next").on("click", function () {
            window.dispatchEvent(new Event('audioFinished'));
        });

        window.addEventListener('keydown', function(e) {
            if (e.keyCode === 32) {
                if (that.getAudio().paused) {
                    that.getAudio().play();
                } else {
                    that.getAudio().pause();
                }
            }
        }, false);

        window.addEventListener('player-pause', function(e) {
            if (that.getAudio().paused) {
                that.getAudio().play();
            } else {
                that.getAudio().pause();
            }
        }, false);
    },
    // 循环顺序
    orderChange: function () {
        var orderDiv = $(".btn-order");
        orderDiv.removeClass();
        switch (rem.order) {
            case 1:     // 单曲循环 -> 列表循环
                orderDiv.addClass("player-btn btn-order btn-order-list");
                orderDiv.attr("title", "列表循环");
                //layer.msg("列表循环");
                rem.order = 2;
                break;

            case 3:     // 随机播放 -> 单曲循环
                orderDiv.addClass("player-btn btn-order btn-order-single");
                orderDiv.attr("title", "单曲循环");
                //layer.msg("单曲循环");
                rem.order = 1;
                break;

            // case 2:
            default:    // 列表循环(其它) -> 随机播放
                orderDiv.addClass("player-btn btn-order btn-order-random");
                orderDiv.attr("title", "随机播放");
                //layer.msg("随机播放");
                rem.order = 3;
        }
    },
}

function AudioPlayer(audioContainer) {
    this.audioContainer = audioContainer
}

AudioPlayer.prototype = {
    init: function(){
        var that = this
        this.audioContainer.onended = function() {
            window.dispatchEvent(new Event("audioFinished"));
        };
        this.audioContainer.onerror = function(e) {
            that.onPlayerError(e);
        };
        this.audioContainer.addEventListener("timeupdate", function(e) {
            that.onTimeUpdate(e, that.audioContainer.currentTime);
        });
        window.addEventListener("playAudio", function(e){
            that.play(e.audio);
        });
        window.addEventListener("adjusttime", function(e){
            that.playback(e.adjustToTime);
        });
        window.addEventListener("adjusttimeByPercent", function (e) {
            var newTime = (that.audioContainer.duration * e.percent).toFixed(4);
            that.playback(newTime);
        });

        window.addEventListener("vb-adjusttime", function (e) {
            that.vBcallback(that.audioContainer, e.adjustToTime);
        });
    },
    // 音量条变动回调函数
    // 参数：新的值
    vBcallback: function (audioPlayer, newVal) {

        audioPlayer.volume = newVal; // 音频对象已加载则立即改变音量

        if ($(".btn-quiet").is('.btn-state-quiet')) {
            $(".btn-quiet").removeClass("btn-state-quiet");     // 取消静音
        }

        if (newVal === 0) $(".btn-quiet").addClass("btn-state-quiet");

        rem.dataSaver.savedata('volume', newVal); // 存储音量信息
    },
    onPlayerError: function(e){
        var playErrorEvent = new Event("mb-play-error");
        window.dispatchEvent(playErrorEvent)
    },
    onTimeUpdate: function(e){
        var progressUpdateEvent = new Event("mb-progress-update");
        progressUpdateEvent.percent = this.getProgress();
        progressUpdateEvent.currentTime = this.getCurrentTime();
        window.dispatchEvent(progressUpdateEvent)
    },

    getProgress: function() {
        return this.audioContainer.currentTime / this.audioContainer.duration;
    },

    getCurrentTime: function() {
        return this.audioContainer.currentTime;
    },
    
    getAudioContainer: function () {
        return this.audioContainer
    },
    play: function(audioUrl) {
        this.getAudioContainer().addEventListener('canplay', function() {
            this.play();
        });
        this.getAudioContainer().src = audioUrl;
    },

    playback: function (adjustToTime) {
        this.getAudioContainer().currentTime = adjustToTime;
    },

    pause: function () {
        this.getAudioContainer().pause()
    }
}

// mk进度条插件
// 进度条框 id，初始量，回调函数
function ProgressBar(bar, percent, isLocked) {
    this.bar = bar;
    if(percent >1 || percent<0) {
        if (percent < 0) this.percent = 0;    // 范围限定
        if (percent > 1) this.percent = 1;
    } else {
        this.percent = percent;
    }
    this.locked = isLocked;
    this.mdown = false;
    this.init();
}

ProgressBar.prototype = {
    // 进度条初始化
    init: function () {
        var mk = this;
        mk.mdown = false;
        this.barMove.bind(this)
        // 加载进度条html元素
        $(mk.bar).html('<div class="mkpgb-bar"></div><div class="mkpgb-cur"></div><div class="mkpgb-dot"></div>');
        // 获取偏移量
        mk.minLength = $(mk.bar).offset().left;
        mk.maxLength = $(mk.bar).width() + mk.minLength;
        // 窗口大小改变偏移量重置
        $(window).on('resize', function () {
            mk.minLength = $(mk.bar).offset().left;
            mk.maxLength = $(mk.bar).width() + mk.minLength;
        });
        // 监听小点的鼠标按下事件
        $(mk.bar + ' .mkpgb-dot').on('mousedown', function (e) {
            e.preventDefault();    // 取消原有事件的默认动作
        });
        // 监听进度条整体的鼠标按下事件
        $(mk.bar).on('mousedown', function (e) {
            if (!mk.locked) mk.mdown = true;
            mk.barMove(e);
        });
        // 监听鼠标移动事件，用于拖动
        $('html').on('mousemove', function (e) {
            mk.barMove(e);
        });
        // 监听鼠标弹起事件，用于释放拖动
        $('html').on('mouseup', function (e) {
            mk.mdown = false;
        });

        window.addEventListener('mb-progress-update', function(e){
            mk.goto(e.percent);
        });
        
        window.addEventListener('adjusttimeByPercent', function(e){
            mk.goto(e.percent);
        });
        
        window.addEventListener('playAudio', function(e){
            mk.goto(0); // 进度条强制归零
            mk.lock(false); // 取消进度条锁定
        });

        mk.goto(mk.percent);

        return true;
    },

    barMove: function (e) {
        var mk = this;
        if (!mk.mdown) return;
        var percent = 0;
        if (e.clientX < mk.minLength) {
            percent = 0;
        } else if (e.clientX > mk.maxLength) {
            percent = 1;
        } else {
            percent = (e.clientX - mk.minLength) / (mk.maxLength - mk.minLength);
        }
        var adjustTimeEvent = new Event('adjusttimeByPercent');
            adjustTimeEvent.percent = percent
            window.dispatchEvent(adjustTimeEvent)

        mk.goto(percent);
        return true;
    },
    // 跳转至某处
    goto: function (percent) {
        if (percent > 1) percent = 1;
        if (percent < 0) percent = 0;
        this.percent = percent;
        $(this.bar + ' .mkpgb-dot').css('left', (percent * 100) + '%');
        $(this.bar + ' .mkpgb-cur').css('width', (percent * 100) + '%');
        return true;
    },
    // 锁定进度条
    lock: function (islock) {
        if (islock) {
            this.locked = true;
            $(this.bar).addClass('mkpgb-locked');
        } else {
            this.locked = false;
            $(this.bar).removeClass('mkpgb-locked');
        }
        return true;
    }
};


// mk进度条插件
// 进度条框 id，初始量，回调函数
function VolumeBar (bar, isLocked) {
    this.bar = bar;
    // 初始化音量设定
    var tmp_vol = rem.dataSaver.readdata('volume');
    tmp_vol = (tmp_vol != null) ? tmp_vol : (rem.isMobile ? 1 : mkPlayer.volume);
    if (tmp_vol > 1 || tmp_vol < 0) {
        if (tmp_vol < 0) this.percent = 0;    // 范围限定
        if (tmp_vol > 1) this.percent = 1;
    } else {
        this.percent = tmp_vol;
    }
    this.locked = isLocked;
    this.mdown = false;
    this.init();
    if (this.percent == 0) $('.btn-quiet').addClass('btn-state-quiet'); // 添加静音样式
}

VolumeBar.prototype = {
    // 进度条初始化
    init: function () {
        var mk = this;
        mk.mdown = false;
        this.barMove.bind(this)
        // 加载进度条html元素
        $(mk.bar).html('<div class="mkpgb-bar"></div><div class="mkpgb-cur"></div><div class="mkpgb-dot"></div>');
        // 获取偏移量
        mk.minLength = $(mk.bar).offset().left;
        mk.maxLength = $(mk.bar).width() + mk.minLength;
        // 窗口大小改变偏移量重置
        $(window).on('resize', function () {
            mk.minLength = $(mk.bar).offset().left;
            mk.maxLength = $(mk.bar).width() + mk.minLength;
        });
        // 监听小点的鼠标按下事件
        $(mk.bar + ' .mkpgb-dot').on('mousedown', function (e) {
            e.preventDefault();    // 取消原有事件的默认动作
        });
        // 监听进度条整体的鼠标按下事件
        $(mk.bar).on('mousedown', function (e) {
            if (!mk.locked) mk.mdown = true;
            mk.barMove(e);
        });
        // 监听鼠标移动事件，用于拖动
        $('html').on('mousemove', function (e) {
            mk.barMove(e);
        });
        // 监听鼠标弹起事件，用于释放拖动
        $('html').on('mouseup', function (e) {
            mk.mdown = false;
        });

        // 静音按钮点击事件
        $('.btn-quiet').on('click', function () {
            var oldVol;     // 之前的音量值
            if ($(this).is('.btn-state-quiet')) {
                oldVol = $(this).data('volume');
                oldVol = oldVol ? oldVol : (rem.isMobile ? 1 : mkPlayer.volume);  // 没找到记录的音量，则重置为默认音量
                $(this).removeClass('btn-state-quiet');     // 取消静音
            } else {
                oldVol = mk.percent;
                $(this).addClass('btn-state-quiet');        // 开启静音
                $(this).data('volume', oldVol); // 记录当前音量值
                oldVol = 0;
            }
            rem.dataSaver.savedata('volume', oldVol); // 存储音量信息
            mk.goto(oldVol);    // 刷新音量显示
            var adjustTimeEvent = new Event('vb-adjusttime');
            adjustTimeEvent.adjustToTime = oldVol
            window.dispatchEvent(adjustTimeEvent)
        });

        window.addEventListener('query-volume', function (e) {
            var volumeFeedbackEvent = new Event('feedback-current-volume');
            volumeFeedbackEvent.currentVolume = mk.percent;
            window.dispatchEvent(volumeFeedbackEvent)
        });


        mk.goto(mk.percent);

        return true;
    },

    barMove: function (e) {
        var mk = this;
        if (!mk.mdown) return;
        var percent = 0;
        if (e.clientX < mk.minLength) {
            percent = 0;
        } else if (e.clientX > mk.maxLength) {
            percent = 1;
        } else {
            percent = (e.clientX - mk.minLength) / (mk.maxLength - mk.minLength);
        }
        var adjustTimeEvent = new Event('vb-adjusttime');
        adjustTimeEvent.adjustToTime = percent
        window.dispatchEvent(adjustTimeEvent)

        mk.goto(percent);
        return true;
    },
    // 跳转至某处
    goto: function (percent) {
        if (percent > 1) percent = 1;
        if (percent < 0) percent = 0;
        this.percent = percent;
        $(this.bar + ' .mkpgb-dot').css('left', (percent * 100) + '%');
        $(this.bar + ' .mkpgb-cur').css('width', (percent * 100) + '%');
        return true;
    },
    // 锁定进度条
    lock: function (islock) {
        if (islock) {
            this.locked = true;
            $(this.bar).addClass('mkpgb-locked');
        } else {
            this.locked = false;
            $(this.bar).removeClass('mkpgb-locked');
        }
        return true;
    }
}

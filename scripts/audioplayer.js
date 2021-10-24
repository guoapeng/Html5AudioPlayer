
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

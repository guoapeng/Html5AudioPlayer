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

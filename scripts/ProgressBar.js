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

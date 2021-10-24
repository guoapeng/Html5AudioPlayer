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
//rem.order = 1;
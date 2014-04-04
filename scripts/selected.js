/*
 * Selected | a collection of songs that I love
 * v0.1.0
 * also as a showcase that shows how to sync lyric with the HTML5 audio tag
 * Wayou  Apri 5th,2014
 * view on GitHub:
 * see the live site:
 * songs used in this project are only for educational purpose. please don't distribute or sell
 */
window.onload = function() {
    new Selected().init();
};
var Selected = function() {
    this.audio = document.getElementById('audio');
    this.lyricContainer = document.getElementById('lyricContainer');
    this.playlist = document.getElementById('playlist');
};
Selected.prototype = {
    constructor: Selected, //fix the prototype chain
    init: function() {
        var that = this;
        //handle playlist
        this.playlist.addEventListener('click', function(e) {
            if (e.target.nodeName.toLowerCase() !== 'a') {
                return;
            };
            var songName = e.target.getAttribute('data-name');
            that.play(songName);
        }, false);
        this.play('na_ge');
    },
    play: function(songName) {
        var that = this;
        this.audio.src = './content/songs/' + songName + '.mp3';
        this.audio.oncanplay = function() {
            this.play();
        };
        this.getLyric(that.audio.src.replace('.mp3', '.lrc'));
        //sync the lyric
        this.audio.ontimeupdate = function(e) {
            if (!that.lyric) return;
            for (var i = 0, l = that.lyric.length; i < l; i++) {
                if (this.currentTime > that.lyric[i][0]) {
                    //single line display mode
                    // that.lyricContainer.textContent = that.lyric[i][1];
                    //scroll mode
                    var line = document.getElementById('line-' + i),
                        prevLine = document.getElementById('line-' + (i > 0 ? i - 1 : i));
                    prevLine.className = '';
                    line.className = 'current-line';
                    that.lyricContainer.style.top = 130 - line.offsetTop + 'px';
                };
            };
        };
    },
    getLyric: function(url) {
        var that = this,
            request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'text';
        //fix for the messy code problem for Chinese reference: http://xx.time8.org/php/20101218/ajax-xmlhttprequest.html
        //既然无法判断是否乱码，就做个‘修正乱码’的按钮让用户自己点
        //request['overrideMimeType'] && request.overrideMimeType("text/html;charset=gb2312");
        request.onload = function() {
            that.lyric = that.parseLyric(request.response);
            //display lyric to the page
            that.appendLyric(that.lyric);
        };
        request.onerror = function(e) {
            that.lyricContainer.textContent = '!failed to load the lyric :(';
        }
        this.lyricContainer.textContent = 'loading the lyric...';
        request.send();
    },
    parseLyric: function(text) {
        //get each line from the text
        var lines = text.split('\n'),
            //this regex mathes the time [00.12.78]
            pattern = /\[\d{2}:\d{2}.\d{2}\]/g,
            result = [];
        //exclude the description parts or empty parts of the lyric
        while (!pattern.test(lines[0])) {
            lines = lines.slice(1);
        };
        //remove the last empty item
        lines[lines.length - 1].length === 0 && lines.pop();
        //display all content on the page
        lines.forEach(function(v, i, a) {
            var time = v.match(pattern),
                value = v.replace(pattern, '');
            time.forEach(function(v1, i1, a1) {
                //convert the [min:sec] to secs format then store into result
                var t = v1.slice(1, -1).split(':');
                result.push([parseInt(t[0], 10) * 60 + parseFloat(t[1]), value]);
            });
        });
        //sort the result by time
        result.sort(function(a, b) {
            return a[0] - b[0];
        });
        return result;
    },
    appendLyric: function(lyric) {
        var that = this,
            lyricContainer = this.lyricContainer,
            fragment = document.createDocumentFragment();
        //clear the lyric container first
        this.lyricContainer.innerHTML = '';
        lyric.forEach(function(v, i, a) {
            var line = document.createElement('p');
            line.id = 'line-' + i;
            line.textContent = v[1];
            fragment.appendChild(line);
        });
        lyricContainer.appendChild(fragment);
    }
}
//currently not in use
// Selected.formatTime = function(time) {
//     var h, m, s;
//     h = Math.floor(time / 3600);
//     m = time / 60 > 59 ? Math.floor(time / 60 % 60) : Math.floor(time / 60);
//     s = time > 59 ? Math.floor(time % 60) : Math.floor(time);
//     return (h < 10 ? '0' + h : h) + ':' + (m < 10 ? '0' + m : m) + ':' + (s < 10 ? '0' + s : s);
// }
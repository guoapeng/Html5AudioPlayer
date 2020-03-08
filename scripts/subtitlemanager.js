function SubtitleManager(subtitleContainer) {
    this.subtitleContainer = subtitleContainer;
    this.lyric = null;
    this.lyricStyle = 0;  //random num to specify the different class name for lyric
    this.subtitleParser = new SubtitleParser();
}

SubtitleManager.prototype = {
    getSubtitleContainer: function () {
        return this.subtitleContainer;
    },
    init: function () {
        var that = this;
        window.addEventListener("playAudio", function (e) {
            that.loadLyric(e.lyric);
        });
    },
    reset: function () {
        //reset the position of the lyric container
        this.getSubtitleContainer().style.top = '130px';
        this.getSubtitleContainer().textContent = 'loading...';
        //empty the lyric
        this.setLyricText(null)
        this.lyricStyle = Math.floor(Math.random() * 4);
    },
    getLyricText: function () {
        return this.lyric
    },
    setLyricText: function (lyric) {
        this.lyric = lyric
    },
    createPlayerErrorHandler: function () {
        var that = this;
        return function (e) {
            that.getSubtitleContainer().textContent = '!fail to load the song :(';
        }
    },
    createPlayerTimeUpdateHandler: function () {
        var that = this;
        return function (e, currentTime) {
            that.synchronizeLyric(e, currentTime);
        }
    },
    synchronizeLyric: function (e, currentTime) {
        if (!this.getLyricText()) return;
        for (var i = 0, l = this.getLyricText().length; i < l; i++) {
            var line = document.getElementById('line-' + i);
            if (line.className != '') line.className = '';
            if (currentTime >= this.getLyricText()[i].startTime - 0.50 && (
                i == this.getLyricText().length - 1 || currentTime < this.getLyricText()[i + 1].startTime - 0.50 /*preload the lyric by 0.50s*/
            )) {
                //scroll mode
                var prevLine = document.getElementById('line-' + (i > 0 ? i - 1 : i));
                prevLine.className = '';
                //randomize the color of the current line of the lyric
                line.className = 'current-line-' + this.lyricStyle;
                this.getSubtitleContainer().style.top = 130 - line.offsetTop + 'px';
            }
            ;
        }
        ;
    },
    appendLyric: function (lyric) {
        var lyricContainer = this.getSubtitleContainer(),
            fragment = document.createDocumentFragment();
        //clear the lyric container first
        lyricContainer.innerHTML = '';
        lyric.forEach(function (v, i) {
            var line = document.createElement('p');
            line.id = 'line-' + i;
            line.textContent = v.content;
            line.onclick = function (e) {
                var adjustTimeEvent = new Event("adjusttime");
                adjustTimeEvent.adjustToTime = v.startTime
                window.dispatchEvent(adjustTimeEvent)
            }
            fragment.appendChild(line);
        });
        lyricContainer.appendChild(fragment);
    },
    loadLyric: function (url) {
        var that = this,
            request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'text';
        //fix for the messy code problem for Chinese.  reference: http://xx.time8.org/php/20101218/ajax-xmlhttprequest.html
        //request['overrideMimeType'] && request.overrideMimeType("text/html;charset=gb2312");
        request.onload = function () {
            that.setLyricText(that.subtitleParser.parse(request.response));
            //display lyric to the page
            that.appendLyric(that.getLyricText());
        };
        request.onerror = request.onabort = function (e) {
            that.getSubtitleContainer().textContent = '!failed to load the lyric :(';
        };
        that.reset();
        request.send();
    }
}

function SubtitleParser() {
}

SubtitleParser.prototype = {
    parse: function (text) {
        //get each line from the text
        var lines = text.split('\n'),
            //this regex mathes the time [00.12.78]
            pattern = /\[\d{2}:\d{2}.\d{2}\]/g,
            result = [];
        // Get offset from lyrics
        var offset = this.getOffset(text);
        if(lines.length<=0) return result;
        //exclude the description parts or empty parts of the lyric
        while ( lines.length>0 && !pattern.test(lines[0])) {
            lines = lines.slice(1);
        };
        //remove the last empty item
        lines[lines.length - 1].length === 0 && lines.pop();
        //display all content on the page
        lines.forEach(function (v, i, a) {
            var time = v.match(pattern),
                value = v.split(pattern);
            for (i = 0, len = time.length, text = ""; i < len; i++) {
                text = time[i]
                var t = text.slice(1, -1).split(':');
                result.push(new SubtitleItem(parseInt(t[0], 10) * 60 + parseFloat(t[1]) + parseInt(offset) / 1000, value[i+1]));
            }
        });
        //sort the result by time
        result.sort(function (a, b) {
            return a.startTime - b.startTime;
        });
        return result;
    },
    getOffset: function (text) {
        //Returns offset in miliseconds.
        var offset = 0;
        try {
            // Pattern matches [offset:1000]
            var offsetPattern = /\[offset:\-?\+?\d+\]/g,
                // Get only the first match.
                offset_line = text.match(offsetPattern)[0],
                // Get the second part of the offset.
                offset_str = offset_line.split(':')[1];
            // Convert it to Int.
            offset = parseInt(offset_str);
        } catch (err) {
            offset = 0;
        }
        return offset;
    }
}

function SubtitleItem(startTime, content) {
    this.startTime = startTime
    this.content = content
}

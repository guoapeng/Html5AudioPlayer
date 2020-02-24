/*
 * Selected | a collection of songs that I love
 * v0.3.0
 * also as a showcase that shows how to sync lyric with the HTML5 audio tag
 * Wayou  Apr 5th,2014
 * view on GitHub:https://github.com/wayou/selected
 * see the live site:http://wayou.github.io/selected/
 * songs used in this project are only for educational purpose
 * Changelog:
 * By guoapeng from Feb 20th, 2020
 * deeply refactor initializing process
 * decoupled AudioPlayer and PlayList with clear responsibility by applying event-driven model
 * refer to the branch refactore on https://github.com/guoapeng/Html5AudioPlayer.git for details
 */
function Selected(audioId, lyricId, playlistId) {
    this.audioPlayer = new AudioPlayer(document.getElementById(audioId))
    this.subtitleManager = new SubtitleManager(document.getElementById(lyricId));
    this.playlist = new PlayList(document.getElementById(playlistId));
    this.audioControl = new AudioControl(document.getElementById(audioId))
}

Selected.prototype = {
    init: function(playlistUrl) {
        this.subtitleManager.init();
        this.audioPlayer.init(this.subtitleManager.getPlayerTimeUpdateHandler(), this.subtitleManager.getPlayerErrorHandler());
        this.playlist.init(playlistUrl);
        this.audioControl.init();
    }
}

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
        window.addEventListener('keydown', function(e) {
            if (e.keyCode === 32) {
                if (that.getAudio().paused) {
                    that.getAudio().play();
                } else {
                    that.getAudio().pause();
                }
            }
        }, false);
    }
}

function AudioPlayer(audioContainer) {
    this.audioContainer = audioContainer
}

AudioPlayer.prototype = {
    init: function(onTimeUpdate, onPlayerError){
        var that = this
        this.audioContainer.onended = function() {
            window.dispatchEvent(new Event("audioFinished"))
        };
        this.audioContainer.onerror = function(e) {
            onPlayerError(e);
        };
        this.audioContainer.addEventListener("timeupdate", function(e) {
            onTimeUpdate(e, that.audioContainer.currentTime)
        });
        window.addEventListener("playAudio", function(e){
            that.play(e.audio);
        });
        window.addEventListener("adjusttime", function(e){
            that.getAudioContainer().currentTime = e.adjustToTime
           
        });
    },
    getAudioContainer: function () {
        return this.audioContainer
    },
    play: function(audioUrl) {
        this.getAudioContainer().addEventListener('canplay', function() {
            this.play();
        });
        this.getAudioContainer().src = audioUrl;
    }
}

function PlayList(playListContainer){
    this.container = playListContainer;
    this.currentIndex=0
    this.allAudios=[]
}

PlayList.prototype = {
    setCurrentIndex: function(index){
        this.currentIndex = index
    },
    getContainer:function(){
        return this.container;
    },
    getAllAudios: function() {
        return this.allAudios;
    },
    getCurrentAudio: function() {
        return this.getAllAudios()[this.currentIndex];
    },
    init: function(contentUrl) {
        var playList = this
        window.addEventListener("audioFinished", function(){
            playList.moveToNext();
        });
        //get all songs and add to the playlist
        var xhttp = new XMLHttpRequest();
        xhttp.open('GET', contentUrl, false);
        xhttp.onreadystatechange = function() {
            if (xhttp.status == 200 && xhttp.readyState == 4) {
                var data = JSON.parse(xhttp.responseText).data
                playList.allAudios = data
                playList.refreshPlayList()
                playList.autoPlay();
            }
        };
        xhttp.send();
        this.handleClickEvent();
    },
    setClass: function() {
        var allSongs = this.container.children[0].children;
        for (var i = allSongs.length - 1; i >= 0; i--) {
            if(allSongs[i].className) allSongs[i].className = '';
        };
        allSongs[this.currentIndex].className = 'current-song';
    },
    moveToNext: function(){
        //reaches the last song of the playlist?
        if (this.currentIndex === this.getAllAudios().length - 1) {
            //play from start
            this.currentIndex = 0
        } else {
            //play next index
            this.currentIndex = this.currentIndex + 1
        };
        this.play(this.getCurrentAudio())
    },
    play: function(audioDetail){
        this.setClass();
        //set the song name to the hash of the url
        window.location.hash = audioDetail.lrc_name;
        var playAudioEvent = new Event("playAudio");
        playAudioEvent.audioName = audioDetail.lrc_name;
        playAudioEvent.lyric = audioDetail.lyric;
        playAudioEvent.audio = audioDetail.audio;
        window.dispatchEvent(playAudioEvent)
    },

    refreshPlayList: function() {
        var playList = this,
            ol = this.container.getElementsByTagName('ol')[0],
            fragment = document.createDocumentFragment();
        playList.allAudios.forEach(function(v) {
            fragment.appendChild(playList.createPlayListItem(v));
        });
        ol.appendChild(fragment);
    },
    createPlayListItem: function (audioDetail){
        var li = document.createElement('li'),
            a = document.createElement('a');
        a.href = 'javascript:void(0)';
        a.dataset.name = audioDetail.lrc_name;
        a.textContent = audioDetail.song_name + '-' + audioDetail.artist;
        li.appendChild(a);
        return li
    },
    handleClickEvent: function(){
        //handle user click
        var playList  = this
        this.getContainer().addEventListener('click', function(e) {
            if (e.target.nodeName.toLowerCase() !== 'a') {
                return;
            };
            var selectedIndex = playList.getSongIndex(e.target.dataset.name);
            playList.setCurrentIndex(selectedIndex);
            playList.setClass();
            playList.play(playList.getCurrentAudio())
        }, false);
    },
    autoPlay: function() {
        //get the hash from the url if there's any.
        var songName = window.location.hash.substr(1);
        //then get the index of the song from all songs
        var indexOfHashSong = this.getSongIndex(songName);
        this.setCurrentIndex(indexOfHashSong || Math.floor(Math.random() * this.getAllAudios().length));
        this.play(this.getCurrentAudio())
    },
    getSongIndex: function(songName) {
        var index = 0;
        Array.prototype.forEach.call(this.getAllAudios(), function(v, i, a) {
            if (v.lrc_name == songName) {
                index = i;
                return false;
            }
        });
        return index;
    }
}

function SubtitleManager(subtitleContainer){
    this.subtitleContainer = subtitleContainer;
    this.lyric = null;
    this.lyricStyle = 0;  //random num to specify the different class name for lyric
    this.subtitleParser = new SubtitleParser();
}

SubtitleManager.prototype = {
    getSubtitleContainer: function () {
        return this.subtitleContainer;
    },
    init: function(){
        var that = this;
        window.addEventListener("playAudio", function(e){
            that.loadLyric( e.lyric);
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
    getLyricText: function(){
        return this.lyric
    },
    setLyricText: function(lyric){
        this.lyric =  lyric
    },
    getPlayerErrorHandler: function(){
        var that = this;
        return function(e){
            that.getSubtitleContainer().textContent = '!fail to load the song :(';
        }
    },
    getPlayerTimeUpdateHandler: function(){
        var that = this;
        return function (e, currentTime) {
            that.synchronizeLyric(e, currentTime);
        }
    },
    synchronizeLyric: function(e, currentTime) {
        if (!this.getLyricText()) return;
        for (var i = 0, l = this.getLyricText().length; i < l; i++) {
            if (currentTime > this.getLyricText()[i].startTime - 0.50 /*preload the lyric by 0.50s*/ ) {
                //scroll mode
                var line = document.getElementById('line-' + i),
                    prevLine = document.getElementById('line-' + (i > 0 ? i - 1 : i));
                prevLine.className = '';
                //randomize the color of the current line of the lyric
                line.className = 'current-line-' + this.lyricStyle;
                this.getSubtitleContainer().style.top = 130 - line.offsetTop + 'px';
            };
        };
    },
    appendLyric: function(lyric) {
        var lyricContainer = this.getSubtitleContainer(),
            fragment = document.createDocumentFragment();
        //clear the lyric container first
        lyricContainer.innerHTML = '';
        lyric.forEach(function(v, i) {
            var line = document.createElement('p');
            line.id = 'line-' + i;
            line.textContent = v.content;
            line.onclick = function(e){
                var adjustTimeEvent = new Event("adjusttime");
                adjustTimeEvent.adjustToTime = v.startTime
                window.dispatchEvent(adjustTimeEvent)
            }
            fragment.appendChild(line);
        });
        lyricContainer.appendChild(fragment);
    },
    loadLyric: function(url) {
        var that = this,
            request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'text';
        //fix for the messy code problem for Chinese.  reference: http://xx.time8.org/php/20101218/ajax-xmlhttprequest.html
        //request['overrideMimeType'] && request.overrideMimeType("text/html;charset=gb2312");
        request.onload = function() {
            that.setLyricText(that.subtitleParser.parse(request.response));
            //display lyric to the page
            that.appendLyric(that.getLyricText());
        };
        request.onerror = request.onabort = function(e) {
            that.getSubtitleContainer().textContent = '!failed to load the lyric :(';
        };
        that.reset();
        request.send();
    }
}

function SubtitleParser(){
}

SubtitleParser.prototype = {
    parse:function (text) {
        //get each line from the text
        var lines = text.split('\n'),
            //this regex mathes the time [00.12.78]
            pattern = /\[\d{2}:\d{2}.\d{2}\]/g,
            result = [];
        // Get offset from lyrics
        var offset = this.getOffset(text);

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
            time.forEach(function(v1) {
                //convert the [min:sec] to secs format then store into result
                var t = v1.slice(1, -1).split(':');
                result.push(new SubtitleItem(parseInt(t[0], 10) * 60 + parseFloat(t[1]) + parseInt(offset) / 1000, value));
            });
        });
        //sort the result by time
        result.sort(function(a, b) {
            return a.startTime - b.startTime;
        });
        return result;
    },
    getOffset: function(text) {
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


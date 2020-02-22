/*
 * Selected | a collection of songs that I love
 * v0.3.0
 * also as a showcase that shows how to sync lyric with the HTML5 audio tag
 * Wayou  Apr 5th,2014
 * view on GitHub:https://github.com/wayou/selected
 * see the live site:http://wayou.github.io/selected/
 * songs used in this project are only for educational purpose
 */
window.onload = function() {
    new Selected().init();
}
function Selected() {
    this.audioPlayer = new AudioPlayer(document.getElementById('audio'), document.getElementById('lyricContainer'))
    this.playlist = new PlayList(document.getElementById('playlist'), this);
    this.lyricStyle = 0; //random num to specify the different class name for lyric
}
Selected.prototype = {
    getAudio: function() {
        return this.audioPlayer.getAudioContainer()
    },
    getLyricContainer: function(){
        return this.audioPlayer.getLyricContainer()
    },
    init: function() {

        var that = this;
        //get all songs and add to the playlist
        this.playlist.init('./scripts/content.json');
        this.audioPlayer.init();
        window.addEventListener("playnext", function(){
            that.playNext(that);
        })

        //enable keyboard control , spacebar to play and pause
        window.addEventListener('keydown', function(e) {
            if (e.keyCode === 32) {
                if (that.getAudio().paused) {
                    that.getAudio().play();
                } else {
                    that.getAudio().pause();
                }
            }
        }, false);

        //initialize the background setting
        document.getElementById('bg_dark').addEventListener('click', function() {
            document.getElementsByTagName('html')[0].className = 'colorBg';
       });
        document.getElementById('bg_pic').addEventListener('click', function() {
            document.getElementsByTagName('html')[0].className = 'imageBg';
        });

    },
    play: function(songName) {
        var that = this;
        this.audioPlayer.reset()
        this.lyricStyle = Math.floor(Math.random() * 4);
        this.audioPlayer.play('./content/songs/' + songName + '.mp3', './content/songs/' + songName + '.lrc')
        //sync the lyric
        this.getAudio().addEventListener("timeupdate", function(e) {
            if (!that.audioPlayer.getLyricText()) return;
            for (var i = 0, l = that.audioPlayer.getLyricText().length; i < l; i++) {
                if (this.currentTime > that.audioPlayer.getLyricText()[i][0] - 0.50 /*preload the lyric by 0.50s*/ ) {
                    //single line display mode
                    // that.lyricContainer.textContent = that.lyric[i][1];
                    //scroll mode
                    var line = document.getElementById('line-' + i),
                        prevLine = document.getElementById('line-' + (i > 0 ? i - 1 : i));
                    prevLine.className = '';
                    //randomize the color of the current line of the lyric
                    line.className = 'current-line-' + that.lyricStyle;
                    that.getLyricContainer().style.top = 130 - line.offsetTop + 'px';
                };
            };
        });
    },
    playNext: function(that) {
        this.playlist.moveToNext();
        this.playlist.setClass();
        var songName = this.playlist.getCurrentSong().children[0].getAttribute('data-name');
        window.location.hash = songName;
        that.play(songName);
    }
};

function AudioPlayer(audioContainer, lyricContainer) {
    this.audioContainer = audioContainer
    this.lyricContainer = lyricContainer
    this.lyric = null;
}

AudioPlayer.prototype = {
    init: function(){
        this.audioContainer.onended = function() {
            window.dispatchEvent(new Event("playnext"))
        }
        this.audioContainer.onerror = function(e) {
            this.lyricContainer.textContent = '!fail to load the song :(';
        };

    },
    reset: function(){
        //reset the position of the lyric container
        this.lyricContainer.style.top = '130px';
        this.lyricContainer.textContent = 'loading...';
        //empty the lyric
        this.setLyricText(null)
    },
    getAudioContainer: function () {
        return this.audioContainer
    },
    getLyricContainer: function () {
        return this.lyricContainer
    },
    getLyricText: function(){
        return this.lyric
    },
    setLyricText: function(lyric){
        this.lyric =  lyric
    },
    addEventListener: function(event){
        var audioPlayer = this
        this.getAudioContainer().addEventListener(event.eventName, function() {
            audioPlayer.loadLyric('./content/songs/' + event.songName + '.lrc');
            this.play();
        });
    },
    play: function(mediaUrl, lyricUrl) {
        var audioPlayer = this
        this.getAudioContainer().addEventListener('canplay', function() {
            audioPlayer.loadLyric(lyricUrl);
            this.play();
        });
        this.getAudioContainer().src = mediaUrl
    },
    loadLyric: function(url) {
        var audioPlayer = this,
            request = new XMLHttpRequest();
        request.open('GET', url, true);
        request.responseType = 'text';
        //fix for the messy code problem for Chinese.  reference: http://xx.time8.org/php/20101218/ajax-xmlhttprequest.html
        //request['overrideMimeType'] && request.overrideMimeType("text/html;charset=gb2312");
        request.onload = function() {
            audioPlayer.setLyricText(audioPlayer.parseLyric(request.response));
            //display lyric to the page
            audioPlayer.appendLyric(audioPlayer.getLyricText());
        };
        request.onerror = request.onabort = function(e) {
            audioPlayer.getLyricContainer().textContent = '!failed to load the lyric :(';
        }
        this.getLyricContainer().textContent = 'loading lyric...';
        request.send();
    },
    parseLyric: function(text) {
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
                result.push([parseInt(t[0], 10) * 60 + parseFloat(t[1]) + parseInt(offset) / 1000, value]);
            });
        });
        //sort the result by time
        result.sort(function(a, b) {
            return a[0] - b[0];
        });
        return result;
    },
    appendLyric: function(lyric) {
        var lyricContainer = this.getLyricContainer(),
            fragment = document.createDocumentFragment();
        //clear the lyric container first
        lyricContainer.innerHTML = '';
        lyric.forEach(function(v, i) {
            var line = document.createElement('p');
            line.id = 'line-' + i;
            line.textContent = v[1];
            fragment.appendChild(line);
        });
        lyricContainer.appendChild(fragment);
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

function PlayList(playListContainer, player){
    this.container = playListContainer;
    this.player = player
    this.currentIndex=0
}

PlayList.prototype = {
    setCurrentIndex: function(index){
        this.currentIndex = index
    },
    getContainer:function(){
        return this.container;
    },
    getAllSongs: function() {
        return this.container.children[0].children;
    },
    getCurrentSong: function() {
       return this.getAllSongs()[this.currentIndex];
    },
    setClass: function() {
        var allSongs = this.getAllSongs()
        for (var i = allSongs.length - 1; i >= 0; i--) {
            if(allSongs[i].className) allSongs[i].className = '';
        };
        this.getCurrentSong().className = 'current-song';
    },
    moveToNext: function(){
        //reaches the last song of the playlist?
        if (this.currentIndex === this.getAllSongs().length - 1) {
            //play from start
            this.currentIndex = 0
        } else {
            //play next index
            this.currentIndex = this.currentIndex + 1
        };
    },
    init: function(contentUrl) {
        var playList = this
        window.addEventListener("playlistReady", function(){
            playList.autoPlay();
        });
        var xhttp = new XMLHttpRequest();
        xhttp.open('GET', contentUrl, false);
        xhttp.onreadystatechange = function() {
            if (xhttp.status == 200 && xhttp.readyState == 4) {
                var data = JSON.parse(xhttp.responseText).data
                playList.refreshPlayList(data)
                window.dispatchEvent(new Event("playlistReady"))
            }
        };
        xhttp.send();
        this.handleClickEvent();
    },
    autoPlay: function() {

        //get the hash from the url if there's any.
        var songName = window.location.hash.substr(1);
        //then get the index of the song from all songs
        var indexOfHashSong = this.getSongIndex(songName);

        this.setCurrentIndex(indexOfHashSong || Math.floor(Math.random() * this.getAllSongs().length));

        //set the song name to the hash of the url
        window.location.hash = window.location.hash || this.getCurrentSong().children[0].getAttribute('data-name');
        this.setClass()
        this.player.play(this.getCurrentSong().children[0].getAttribute('data-name'));
    },
    refreshPlayList: function(data) {
        var playList = this,
            ol = this.container.getElementsByTagName('ol')[0],
            fragment = document.createDocumentFragment();
        data.forEach(function(v) {
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
        //handle playlist
        var playList  = this
        this.getContainer().addEventListener('click', function(e) {
            if (e.target.nodeName.toLowerCase() !== 'a') {
                return;
            };
            var allSongs = playList.getAllSongs(),
                selectedIndex = Array.prototype.indexOf.call(allSongs, e.target.parentNode);
            playList.setCurrentIndex(selectedIndex);
            playList.setClass();
            var songName = e.target.getAttribute('data-name');
            window.location.hash = songName;
            playList.player.play(songName);
        }, false);
    },
    getSongIndex: function(songName) {
        var index = 0;
        Array.prototype.forEach.call(this.getAllSongs(), function(v, i, a) {
            if (v.children[0].getAttribute('data-name') == songName) {
                index = i;
                return false;
            }
        });
        return index;
    }
}



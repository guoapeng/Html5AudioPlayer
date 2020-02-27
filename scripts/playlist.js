
function PlayList(playListContainer){
    this.container = playListContainer;
    this.currentIndex=0
    this.playStrategy=1 // play orderly
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
    init: function() {
        var playList = this
        window.addEventListener("audioFinished", function(){
            playList.moveToNext();
        });
        window.addEventListener("playListReady", function(){
            playList.autoPlay();
        });
        this.handleClickEvent();
    },
    loadAudioList: function(contentUrl){
        var playList = this
        //get all songs and add to the playlist
        var xhttp = new XMLHttpRequest();
        xhttp.open('GET', contentUrl, false);
        xhttp.onreadystatechange = function() {
            if (xhttp.status == 200 && xhttp.readyState == 4) {
                var data = JSON.parse(xhttp.responseText).data
                playList.allAudios = data;
                playList.refreshPlayList();
                var playListReadyEvent = new Event("playListReady");
                window.dispatchEvent(playListReadyEvent)
            }
        };
        xhttp.send();
    },
    setClass: function() {
        var allSongs = this.container.children[0].children;
        for (var i = allSongs.length - 1; i >= 0; i--) {
            if(allSongs[i].className) allSongs[i].className = '';
        };
        allSongs[this.currentIndex].className = 'current-song';
    },
    moveToNext: function(){
        if(this.playStrategy == 1) { // play orderly
            this.setCurrentIndex(this.currentIndex < this.getAllAudios().length ? this.currentIndex + 1:0);
        } else { // play orderly
            this.setCurrentIndex(Math.floor(Math.random() * this.getAllAudios().length));
        }
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
        a.textContent = this.createTitle(audioDetail);
        li.appendChild(a);
        return li
    },
    createTitle: function(audioDetail){
        return audioDetail.song_name + '-' + audioDetail.artist;
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

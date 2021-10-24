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
window.onload = function() {
    var audio = document.createElement("audio");
    var audioPlayer = new AudioPlayer(audio);
    var subtitleManager = new SubtitleManager(document.getElementById("lyricContainer"));
    var playlist = new PlayList(document.getElementById("playlist"));
    var audioControl = new AudioControl(audio)
    subtitleManager.init();
    audioPlayer.init();
    playlist.init();
    audioControl.init();
    playlist.playStrategy = 2
    playlist.createTitle = function(audioDetail){
        return audioDetail.song_name + '-' + audioDetail.artist;
    };
    new ProgressBar('#music-progress', 0, true); // 未播放时锁定不让拖动
    new VolumeBar('#volume-progress', false);
    //playlist.loadAudioList('http://localhost:9993/content/index_for_local_test.json');
    playlist.loadAudioList('https://guoapeng.github.io/lyrics/content/index.json');
}

function changeBg(bgStyle) {
    document.getElementsByTagName('html')[0].className = bgStyle;
}

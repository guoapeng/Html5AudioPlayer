
window.onload = function() {
    new Selected("audio", "lyricContainer", "playlist").init('./content/index.json');
    //initialize the background setting
    document.getElementById('bg_dark').addEventListener('click', function() {
        document.getElementsByTagName('html')[0].className = 'colorBg';
    });
    document.getElementById('bg_pic').addEventListener('click', function() {
        document.getElementsByTagName('html')[0].className = 'imageBg';
    });
}

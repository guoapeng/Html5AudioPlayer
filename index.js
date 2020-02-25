
window.onload = function() {
    new Selected("audio", "lyricContainer", "playlist").init('https://guoapeng.github.io/lyrics/content/index.json');
}

function changeBg(bgStyle) {
    document.getElementsByTagName('html')[0].className = bgStyle;
}

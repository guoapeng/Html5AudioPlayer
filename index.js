
window.onload = function() {
    new Selected("audio", "lyricContainer", "playlist").init('./content/index.json');
}

function changeBg(bgStyle) {
    document.getElementsByTagName('html')[0].className = bgStyle;
}


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
    init: function(){
        var that = this
        this.audioContainer.onended = function() {
            window.dispatchEvent(new Event("audioFinished"));
        };
        this.audioContainer.onerror = function(e) {
            that.onPlayerError(e);
        };
        this.audioContainer.addEventListener("timeupdate", function(e) {
            that.onTimeUpdate(e, that.audioContainer.currentTime);
        });
        window.addEventListener("playAudio", function(e){
            that.play(e.audio);
        });
        window.addEventListener("adjusttime", function(e){
            that.playback(e.adjustToTime);
        });
    },
    onPlayerError: function(e){
        //the function just a placeholder and default implementation
        //which always overrides by actual method during initialization on runtime
    },
    onTimeUpdate: function(e){
        //the function just a placeholder and default implementation
        //need to replace with actual method during initialization on runtime
    },
    getAudioContainer: function () {
        return this.audioContainer
    },
    play: function(audioUrl) {
        this.getAudioContainer().addEventListener('canplay', function() {
            this.play();
        });
        this.getAudioContainer().src = audioUrl;
    },
    playback: function (adjustToTime) {
        this.getAudioContainer().currentTime = adjustToTime
    },
    pause: function () {
        this.getAudioContainer().pause()
    }
}

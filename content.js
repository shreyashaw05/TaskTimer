let audio = new Audio(chrome.runtime.getURL("alarm.mp3"));

audio.onerror = function() {
    console.error("Failed to load the alarm sound.");
};

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
    if (request.message === "playAlarm") {
        console.log("Playing alarm");
        audio.play().catch((error) => {
            console.error("Error playing the alarm:", error);
        });
    } else if (request.message === "stopAlarm") {
        console.log("Stopping alarm");
        if (audio) {
            audio.pause();
            audio.currentTime = 0; // Reset the audio to the start
        }
    }
});
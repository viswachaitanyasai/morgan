const ffmpeg = require("fluent-ffmpeg");

// Function: Extract audio from video
async function extractAudioFromVideo(videoPath) {
  return new Promise((resolve, reject) => {
    const audioPath = videoPath.replace(/\.\w+$/, ".mp3");
    ffmpeg(videoPath)
      .output(audioPath)
      .audioCodec("libmp3lame")
      .on("end", () => resolve(audioPath))
      .on("error", reject)
      .run();
  });
}

module.exports = {
  extractAudioFromVideo,
};
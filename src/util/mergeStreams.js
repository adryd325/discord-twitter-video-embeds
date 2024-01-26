const fs = require("fs");
const path = require("path");
const { v4: uuidv4 } = require("uuid");
const { TEMP_DIR } = require("./Constants");
const { sh } = require("./Utils");

const tempDir = path.join(TEMP_DIR);

// I really hate reddit.
module.exports = async function mergeStreams(video, audio) {
  // Generate file names
  const id = uuidv4();
  const audioFile = path.join(tempDir, `mergeStreams_${id}_audio.mp4`);
  const videoFile = path.join(tempDir, `mergeStreams_${id}_video.mp4`);
  const outFile = path.join(tempDir, `mergeStreams_${id}.mp4`);

  // Write the files (in parallel)
  await Promise.all([fs.promises.writeFile(videoFile, video), fs.promises.writeFile(audioFile, audio)]);

  // Run ffmpeg
  await sh(`ffmpeg -i "${videoFile}" -i "${audioFile}" -f mp4 "${outFile}"`);

  // Get the file in memory
  const result = await fs.promises.readFile(outFile);

  // Delete the temp files
  await Promise.all([fs.promises.rm(audioFile), fs.promises.rm(videoFile), fs.promises.rm(outFile)]);

  // Return the result
  return result;
};

#!/usr/bin/env bun
/**
 * Extract unique frames from a Slack video using scene detection
 * Usage: bun scripts/extract-video-frames.ts <video-url> [output-dir]
 */

import { $ } from "bun";

const videoUrl = process.argv[2];
const outputDir = process.argv[3] || "/tmp/frames";

if (!videoUrl) {
  console.error("Usage: bun scripts/extract-video-frames.ts <video-url> [output-dir]");
  process.exit(1);
}

const xoxd = process.env.VENTURE_IMPACT_PLATFORM_SLACK_XOXD || process.env.SLACK_XOXD;
if (!xoxd) {
  console.error("Error: VENTURE_IMPACT_PLATFORM_SLACK_XOXD or SLACK_XOXD env var required");
  process.exit(1);
}

try {
  await $`which ffmpeg`.quiet();
} catch {
  console.error("Error: ffmpeg not installed. Run: apt-get install -y ffmpeg");
  process.exit(1);
}

await $`mkdir -p ${outputDir}`.quiet();
try { await $`rm -f ${outputDir}/frame_*.jpg`.quiet(); } catch {}

const tempVideo = "/tmp/slack_video_temp.mp4";

console.log("Downloading video...");
const response = await fetch(videoUrl, {
  headers: { "Cookie": `d=${encodeURIComponent(xoxd)}` }
});

if (!response.ok) {
  console.error(`Failed to download video: ${response.status}`);
  process.exit(1);
}

await Bun.write(tempVideo, await response.arrayBuffer());
console.log("Downloaded:", (await Bun.file(tempVideo).size / 1024 / 1024).toFixed(1), "MB");

console.log("Extracting unique frames (scene detection)...");
await $`ffmpeg -i ${tempVideo} -vf "select='gt(scene,0.3)'" -vsync vfr ${outputDir}/frame_%03d.jpg -y`.quiet();

let frames: string[] = [];
try {
  frames = (await $`ls ${outputDir}/frame_*.jpg`.text()).trim().split("\n").filter(Boolean);
} catch {}
console.log(`Extracted ${frames.length} unique frames to ${outputDir}/`);

await $`rm -f ${tempVideo}`.quiet();
frames.forEach(f => console.log(f));

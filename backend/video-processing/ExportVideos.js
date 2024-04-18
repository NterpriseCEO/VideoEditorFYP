//import ipcmain from 'electron';
const { ipcMain } = require("electron");
const { exec } = require("child_process");
const fs = require("fs");

const { getExportPath, cmdExec } = require("../globals/Globals");
const Main = require("electron/main");
const { Windows } = require("../LoadWindows");
const { merge } = require("rxjs/internal/observable/merge");

let allTracks = [];

let childProcess;

//listen for tracks data
ipcMain.on("export-tracks-data", (_, tracks) => {
	allTracks = tracks;
	
	const exportPath = getExportPath().substring(0, getExportPath().lastIndexOf("\\"));
	// Creates a temp folder to store clips that are being converted to mp4
	if(!fs.existsSync(`${exportPath}\\temp_export`)) {
		fs.mkdirSync(`${exportPath}\\temp_export`);
	}

	convertClipsToMp4(tracks.filter(track => track.type !== "Audio"));
});

outputNumber = 0;

ipcMain.on("frame", (_, frame) => {
	// Converts images to binary data and then stdin it to ffmpeg
	const data = frame.replace(/^data:image\/\w+;base64,/, "");
	const buffer = Buffer.from(data, 'base64');
	const sucess = childProcess.stdin.write(buffer);

	// Only starts the once listener if the write hasn't finished
	// i.e. the buffer isn't full yet
	if(!sucess) {
		// Once the buffer is empty, it will send a message to the main window
		childProcess.stdin.once('drain', () => {
			Windows.sendToMainWindow("frame-processed");
		});
	}else {
		Windows.sendToMainWindow("frame-processed");
	}
});

ipcMain.on("frames-exportation-finished", () => {
	// Closes the ffmpeg stream
	childProcess.stdin.end();
});

function mergeAudio(videoPath) {
	let clipPathCommands = [];
	let adelayCommands = "";

	// Merges all tracks into one array of clips
	const clipsList = allTracks.filter(track => !track.muted).map(track => track.clips).flat(1);
	clipsList.forEach((clip, clipIndex) => {
		// Gets the time and removes the date
		const startTime = new Date(clip.startTime ?? 0).toISOString().substring(11, 22);
		const duration = new Date(clip.duration).toISOString().substring(11, 22);
		// Commands to merge the audio
		clipPathCommands.push(...["-ss", clip.in / 1000, "-t", clip.duration/1000, "-i", clip.location]);
		adelayCommands += `[${clipIndex+1}:a]adelay=delays=${clip.startTime}|${clip.startTime}:all=1[r${clipIndex+1}]; `;
	});
	const amixlist = clipsList.map((_, index) => `[r${index+1}]`).join("");
	// Merges the audio with the exported video
	cmdExec(
		"ffmpeg",
		[
			"-y",
			"-t", 0, "-ss", 0, "-i",
			videoPath,
			...clipPathCommands,
			"-filter_complex",
			`${adelayCommands} ${amixlist}amix=inputs=${clipsList.length}[a]`,
			"-map", "0:v:0",
			"-map", "[a]",
			"-codec:v", "libx264",
			getExportPath().replace(".webm", ".mp4")
		],
		(data) => Windows.sendToMainWindow("export-console-log", data)
	).then(() => {
		fs.unlinkSync(getExportPath().replace(".webm", "_n.mp4"));
		Windows.sendToMainWindow("video-sucessfully-exported");
	});
}

function convertClipsToMp4(tracks, trackIndex = 0, clipIndex = 0) {
	// ffmpeg - y - i f_current.mp4 - vf "setpts=1.25*PTS" - r 15 f_current_.mp4

	let nextTrackIndex = trackIndex;
	const nextClipIndex = clipIndex < tracks[trackIndex].clips.length - 1 ? clipIndex + 1 : 0;

	if(nextClipIndex == 0) {
		nextTrackIndex++;
	}

	const clipPath = tracks[trackIndex].clips[clipIndex].location;
	console.log(clipPath);
	// Removes the path and gets the name of the clip
	const clipName = clipPath.substring(clipPath.lastIndexOf("\\") + 1);
	const clipNameWithoutExtension = clipName.substring(0, clipName.lastIndexOf("."));
	const newClipName = `${clipNameWithoutExtension}.mp4`;//needs something like ${Date().now() to make it unique. Maybe it should be based on unique used imported clips?
	const exportPath = getExportPath().substring(0, getExportPath().lastIndexOf("\\"));
	// Updates the clip location to the new path
	tracks[trackIndex].clips[clipIndex].location = `${exportPath}\\temp_export\\${newClipName}`;

	//Check if {name}.mp4 exists
	//if it does, skips the re-encoding
	if(fs.existsSync(`${exportPath}\\temp_export\\${newClipName}`)) {
		Windows.sendToMainWindow("export-console-log", `skipping "${exportPath}\\temp_export\\${newClipName}" as it already exists\n`);
		console.log(nextTrackIndex, tracks.length - 1, nextClipIndex, tracks[trackIndex].clips.length, "\n\n\n");
		console.log('\n\n\nit exists!\n------------------------\n\n\n');
		if(nextTrackIndex < tracks.length) {
			convertClipsToMp4(tracks, nextTrackIndex, nextClipIndex);
		}else {
			console.log("\n\n\nDONE!\n\n\n");
			// Starts the pipe for streaming frames into the video container
			startPipe();
			Windows.sendToMainWindow("new-clip-paths", tracks);
		}
		return;
	}

	// Converts the clips to mp4 (will change to whatever format a user chooses in the future)
	cmdExec(
		"ffmpeg", ["-i", `${clipPath}`, "-r", "30", "-y", `${exportPath}\\temp_export\\${newClipName}`],
		(data) => Windows.sendToMainWindow("export-console-log", data)
	).then(() => {
		if(nextTrackIndex < tracks.length) {
			convertClipsToMp4(tracks, nextTrackIndex, nextClipIndex);
		}else {
			console.log("\n\n\nDONE!\n\n\n");
			startPipe();
			Windows.sendToMainWindow("new-clip-paths", tracks);	
		}
	});
}

function startPipe() {
	return cmdExec(
		"ffmpeg",
		[
			"-framerate", "30",
			"-f",
			"image2pipe",
			"-i",
			"-",
			getExportPath().replace(".webm", "_n.mp4")
		],
		() => {}, // needed so that the next function can be called
		(process) => {
			childProcess = process;
		}
	).then(() => {
		// Merges the audio once the pipe ahs completed
		mergeAudio(getExportPath().replace(".webm", "_n.mp4"));
	});
}
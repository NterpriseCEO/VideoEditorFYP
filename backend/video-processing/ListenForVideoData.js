const fs = require("fs");
const { ipcMain } = require("electron");

const { getExportPath, getProjectPath } = require("../globals/Globals");
const { extractMetadataFromFile } = require("../file-management/ImportFiles");

let fileStream;

exports.listenForVideoData = function(client) {
	let couldOpenStream = false;
	let recordingToProjectFolder = false;
	let exportPath = "";

	client.on("start-recording", (recordToProjectFolder) => {
		//get the date and time for the file name
		let date = new Date().getTime();
		//Delete webm if it exists before opening a new stream
		exportPath = recordToProjectFolder ? `${getProjectPath()}\\${date}.webm` : getExportPath();
		if (fs.existsSync(exportPath)) {
			fs.unlinkSync(exportPath);
		}
		if(!fileStream) {
			couldOpenStream = true;
			fileStream = fs.createWriteStream(exportPath, { flags: "a" });
		}
		recordingToProjectFolder = recordToProjectFolder;
	});
	client.on("recording-data", data => {
		if(couldOpenStream) {
			fileStream.write(Buffer.from(new Uint8Array(data)));
		}
	});
	client.on("stop-recording", () => {
		fileStream.end();
		fileStream = null;
		couldOpenStream = false;

		if(recordingToProjectFolder) {
			console.log("Saving project");
			recordingToProjectFolder = false;
			extractMetadataFromFile(exportPath);
		}
	});
}
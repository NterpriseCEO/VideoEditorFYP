const fs = require("fs");
const { ipcMain } = require("electron");

const { getExportPath } = require("../globals/Globals");

let fileStream;

exports.listenForVideoData = function(client) {
	let couldOpenStream = false;

	client.on("start-recording", () => {
		//Delete webm if it exists before opening a new stream
		let exportPath = getExportPath();
		if (fs.existsSync(exportPath)) {
			fs.unlinkSync(exportPath);
		}
		if(!fileStream) {
			couldOpenStream = true;
			fileStream = fs.createWriteStream(exportPath, { flags: "a" });
		}
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
	});
}
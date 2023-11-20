const fs = require("fs");
const { ipcMain } = require("electron");
const { exec } = require("child_process");

const { getExportPath, getProjectPath, getMainWindow } = require("../globals/Globals");
const { extractMetadataAndImportFile } = require("../file-management/ImportFiles");

let fileStream;

exports.listenForVideoData = function(client) {
	let couldOpenStream = false;
	let exportPath = "";
	let addToTrack = false;

	client.on("start-recording", (options) => {
		//get the date and time for the file name
		let date = new Date().getTime();
		//Delete webm if it exists before opening a new stream
		addToTrack = options?.addToTrack ?? false;

		exportPath = options?.recordToProjectFolder ? `${getProjectPath()}\\clips\\${date}_n.webm` : getExportPath();

		if (options?.recordToProjectFolder && !fs.existsSync(`${getProjectPath()}\\clips`)) {
			fs.mkdirSync(`${getProjectPath()}\\clips`);
		}

		if(fs.existsSync(exportPath)) {
			fs.unlinkSync(exportPath);
		}
		if(!fileStream) {
			couldOpenStream = true;
			fileStream = fs.createWriteStream(exportPath, { flags: "a" });
		}
	});
	client.on("recording-data", data => {
		if(couldOpenStream) {
			try {
				fileStream.write(Buffer.from(new Uint8Array(data)));
			}catch(e) {
				console.log(e);
			}
		}
	});
	client.on("stop-recording", () => {
		fileStream.end();
		fileStream = null;
		couldOpenStream = false;

		let newFile = exportPath.substring(0, exportPath.lastIndexOf("_n")) + ".webm";
		//Creates a copy of the file. This adds the correct metadata to the file
		exec(`ffmpeg -i "${exportPath}" -vcodec copy -acodec copy "${newFile}"`, (error, stdout, stderr) => {
			if(error) {
				console.log(error);
			}
			if(stderr) {
				console.log(stderr);
			}
			//Delete the origin file
			fs.unlink(exportPath, (error) => {
				if(error) {
					console.log(error);
				}
			});
			if(addToTrack) {
				//Is only called when the user is recording a specific track
				extractMetadataAndImportFile(newFile);
			}else {
				getMainWindow().webContents.send("video-sucessfully-exported");
			}
		});
	});

	//Need to revisit this feature
	ipcMain.on("cancel-recording", () => {
		if(fileStream) {
			fileStream.end();
			fileStream = null;
			couldOpenStream = false;
			//Delete the file
			if(fs.existsSync(exportPath)) {
				fs.unlinkSync(exportPath);
			}
		}
	});
}
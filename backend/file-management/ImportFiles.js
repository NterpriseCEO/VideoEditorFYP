const { dialog, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { exec } = require("child_process");
const { getVideoDurationInSeconds } = require("get-video-duration");
const { getMainWindow } = require("../globals/Globals");

function ImportFiles(window) {
	this.mainWindow = window;
	this.files = [];
}

ImportFiles.prototype.listenForEvents = function() {
	ipcMain.on("import-files", (_, files) => {
		//Electron code to import files
		dialog.showOpenDialog(this.mainWindow, {
			properties: ["openFile", "multiSelections"],
			filters: [
				{ name: "Movies", extensions: ["mp4", "mpeg4", "ogg", "webm"] },
			],
		}).then((result) => {
			if (result.canceled) {
				return;
			}
			this.files = result.filePaths;

			//Deletes all the thumbnails that are already in the folder
			//that have the same name as the video file
			this.files.forEach((file) => {
				if (fs.existsSync(`${path.basename(file, ".mp4")}.png`)) {
					//Deletes the thumbnail
					fs.rmSync(`${path.basename(file, ".mp4")}.png`);
				}
			});

			//Extracts the time metadata from the video files
			this.extractMetadata(0, [...this.files]);
		}).catch((err) => {
			console.log(err);
		});
	});
}

ImportFiles.prototype.extractMetadata = function(counter, files) {
	//Checks if there are still files to extract metadata from
	if(this.files[counter]) {
		let file = this.files[counter];
		//Gets the duration of the video file and continues to the next file
		getVideoDurationInSeconds(file).then((duration) => {
			files[counter] = {name: file, duration: duration};
			this.extractMetadata(++counter, files);
		});
	}else {
		//Sends the files to the renderer process
		this.mainWindow.webContents.send("imported-files", files);
		this.extractThumbnails(0);
	}
}

ImportFiles.prototype.extractThumbnails = function(counter, thumbnails = []) {
	if(this.files[counter]) {
		let file = this.files[counter];
		//Extracts the first frame of the video file and converts it to a a png
		exec(`ffmpeg -i "${file}" -vf "scale=iw*sar:ih,setsar=1" -vframes 1 "${path.basename(file, ".mp4")}.png"`, (error, stdout, stderr) => {
			if (error) {
				console.log(`error: ${error.message}`);
				return;
			}
			if (stderr) {
				console.log(`error?: ${stderr}`);
			}
			let dirname = __dirname.substring(0, __dirname.length-24);
			let thumbnail = `${dirname}/${path.basename(file, ".mp4")}.png`;
			thumbnails.push({
				thumbnail: thumbnail,
				associatedFile: file,
			});
			//Moves to the next thumnail file
			this.extractThumbnails(++counter, thumbnails);
		});
	}else {
		//Sends the thumbnails to the renderer process once all the thumbnails
		//have been extracted
		this.mainWindow.webContents.send("thumbnails", thumbnails);
	}
}

exports.extractMetadataAndImportFile = function(file) {
	getVideoDurationInSeconds(file).then((duration) => {
		//get file name
		let name = path.basename(file);
		let _file = {name: name, location: file, duration: duration, totalDuration: duration};
		getMainWindow().webContents.send("imported-files", [_file]);
		getMainWindow().webContents.send("add-clip-to-track", _file);
	});
}

exports.ImportFiles = ImportFiles;
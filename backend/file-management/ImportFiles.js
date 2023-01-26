const { dialog, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { exec } = require("child_process");
const { getVideoDurationInSeconds } = require("get-video-duration");

function ImportFiles(window) {
	this.mainWindow = window;
	this.files = [];
}

ImportFiles.prototype.listenForEvents = function() {
	ipcMain.on("import-files", (_, files) => {
		//Electron code to import files
		dialog.showOpenDialog({
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
			console.log(`stdout: ${stdout}`);

			file = path.basename(file, ".mp4");
			let thumbnail = fs.readFileSync(`${file}.png`);
			//Compresses the png file
			sharp(thumbnail)
				.webp({ quality: 10 })
				.toFile(`${file}.png`)
				.then(() => {
					//Adds the thumbnail to the array
					thumbnails.push({
						thumbnail: fs.readFileSync(`${file}.png`, { encoding: "base64" }),
						associatedFile: file,
					});
					//Moves to the next thumnail file
					this.extractThumbnails(++counter, thumbnails);
				});
		});
	}else {
		//Sends the thumbnails to the renderer process once all the thumbnails
		//have been extracted
		this.mainWindow.webContents.send("thumbnails", thumbnails);
	}
}

exports.ImportFiles = ImportFiles;
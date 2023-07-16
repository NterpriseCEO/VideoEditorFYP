const { dialog, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { exec } = require("child_process");
const { getVideoDurationInSeconds } = require("get-video-duration");
const { getMainWindow, getProjectPath } = require("../globals/Globals");

function ImportFiles(window) {
	this.mainWindow = window;
	this.files = [];
}

ImportFiles.prototype.listenForEvents = function() {
	ipcMain.on("import-files", (_, files) => {
		this.importFiles();
	});

	ipcMain.on("check-if-clips-need-relinking", (_, clips) => {
		this.mainWindow.webContents.send("clips-that=need-relinking", clips.map(clip => fs.existsSync(clip)));
	});

	ipcMain.on("relink-clip", (_, file) => {
		this.relinkClip(file);
	});
}

ImportFiles.prototype.importFiles = function() {
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
}

ImportFiles.prototype.relinkClip = function(file) {
	//Ask user to choose a new file
	dialog.showOpenDialog(this.mainWindow, {
		properties: ["openFile"],
		title: "Relink Clip previous located at: " + file,
		filters: [
			{ name: "Movies", extensions: ["mp4", "mpeg4", "ogg", "webm"] },
		],
	}).then((result) => {
		if (result.canceled) {
			return;
		}
		const file = result.filePaths[0];
		getVideoDurationInSeconds(file).then((duration) => {
			this.mainWindow.webContents.send("relinked-clip-data", {
				path: result.filePaths[0],
				name: path.basename(result.filePaths[0]),
				duration: duration,
			});
		}).catch((err) => {
			console.log(err);
			this.mainWindow.webContents.send("relinked-clip-data", {
				path: result.filePaths[0],
				name: path.basename(result.filePaths[0]),
				duration: 0,
			});
		});
	});
}

ImportFiles.prototype.extractMetadata = function(counter, files) {
	//Checks if there are still files to extract metadata from
	if(this.files[counter]) {
		let file = this.files[counter];
		//Gets the duration of the video file and continues to the next file
		getVideoDurationInSeconds(file).then((duration) => {
			files[counter] = {name: file, duration: duration, location: this.files[counter]};
			this.extractMetadata(++counter, files);
		}).catch((err) => {
			//Need to figure out how to handle files that don't have duration
			console.log(err);
			files[counter] = {name: file, duration: 0};
			this.extractMetadata(++counter, files);
		});
	}else {
		//Sends the files to the renderer process
		this.extractThumbnails(0, [], files);
	}
}

ImportFiles.prototype.extractThumbnails = function(counter, thumbnails, files) {
	if(this.files[counter]) {
		let file = this.files[counter];
		let png = `${path.basename(this.files[counter], ".mp4")}.png`;
		//Remove the dash from the beginning of the file name if it exists
		if(png.charAt(0) === "-") {
			png = png.substring(1);
		}
		//Extracts the first frame of the video file and converts it to a a png
		exec(`ffmpeg -i "${file}" -vf "scale=iw*sar:ih,setsar=1" -vframes 1 "${png}"`, (error, stdout, stderr) => {
			if(error) {
				console.log(`error: ${error.message}`);
				return;
			}
			if (stderr) {
				console.log(`error?: ${stderr}`);
			}
			const dirname = __dirname.substring(0, __dirname.length-24);
			const thumbnail = `${dirname}\\${png}`;
			const path = `${getProjectPath()}\\project-data\\thumbnails\\`;

			if(!fs.existsSync(path)) {
				fs.mkdirSync(path, { recursive: true });
			}

			//Moves the thumbnail to project_path/project-data/thumbnails
			const newPath = path + png;
			fs.renameSync(thumbnail, newPath);

			files[counter].thumbnail = newPath;

			//Moves to the next thumnail file
			this.extractThumbnails(++counter, thumbnails, files);
		});
	}else {
		//Sends the files to the renderer process once all the thumbnails
		//have been extracted
		this.mainWindow.webContents.send("imported-files", files);
	}
}

exports.extractMetadataAndImportFile = function(file) {
	getVideoDurationInSeconds(file).then((duration) => {
		//The file name
		let name = path.basename(file);
		let _file = {name: name, location: file, duration: duration, totalDuration: duration};
		getMainWindow().webContents.send("imported-files", [_file]);
		getMainWindow().webContents.send("add-clip-to-track", _file);
	});
}

exports.ImportFiles = ImportFiles;
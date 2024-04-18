const { dialog, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const sharp = require("sharp");
const { exec } = require("child_process");
const { getVideoDurationInSeconds } = require("get-video-duration");
const { getProjectPath, cmdExec } = require("../globals/Globals");
const { Windows } = require("../LoadWindows");

const audioExtensions = [".mp3", ".m4a", ".wav", ".flac"];

module.exports.ImportFiles = class ImportFiles {

	#files = [];

	constructor() {
		this.#listenForEvents();
	}

	#listenForEvents() {
		ipcMain.on("import-files", (_, files) => {
			this.#importFiles();
		});

		ipcMain.on("check-if-clips-need-relinking", (_, clips) => {
			Windows.sendToMainWindow("clips-that=need-relinking", clips.map(clip => fs.existsSync(clip)));
		});

		ipcMain.on("relink-clip", (_, file) => {
			this.#relinkClip(file);
		});

		ipcMain.on("reverse-clip", (_, clip) => {
			//Gets all parts of the file name (name, ext, dir, root, base)
			const parse = path.parse(clip.name);
			const clips = `${getProjectPath()}\\clips\\`;
			//epoch time in milliseconds
			const time = new Date().getTime();
			const location = `${clips}${parse.name}-${time}\\`;
			//Create the above directory if it doesn't exist
			if(!fs.existsSync(location)) {
				fs.mkdirSync(location);
			}
			cmdExec("ffmpeg", ["-i", `${clip.location}`, "-map", "0", "-c", "copy", "-f", "segment", "-segment_time", "300", "-reset_timestamps", "1", `${location}\\video_%03d${parse.ext}`]).then(() => {
				return this.#reverseClips(location, parse.ext);
			}).then(() =>
				cmdExec("ffmpeg", ["-f", "concat", "-safe", "0", "-i", `${location}reversed_data\\files.txt`, "-c", "copy", `${clips}${parse.name}-${time}_reversed${parse.ext}`])
			).then(() => {
				fs.rmdirSync(location, { recursive: true })
				//mioght need to change this to a different path
				if(fs.existsSync(`${path.basename(`${clips}${parse.name}-${time}_reversed`, parse.ext)}.png`)) {
					//Deletes the existing thumbnail
					fs.rmSync(`${path.basename(file, parse.ext)}.png`);
				}

				this.#files = [`${clips}${parse.name}-${time}_reversed${parse.ext}`];

				//Extracts the time metadata from the video files
				this.#extractMetadata(0, [...this.#files]);
			})
				.catch((err) => {
					console.log("\n\nerror\n\n");
					console.log(err);
				});
		});
	}

	// for %% A in ("C:\Users\Gaming\Videos\GraphX projects\Test\clips\Bestlightning\*.mp4") do (
	// 	ffmpeg - i "%%A" - vf reverse - af areverse "C:\Users\Gaming\Videos\GraphX projects\Test\clips\Bestlightning\reversed_data\%%~nA_reversed.mp4"
	// )
	#reverseClips(location, extension) {
		//Gets all clips in the clips/Bestlightning folder
		//for each clip, run the ffmpeg command
		//ffmpeg - i "%%A" - vf reverse - af areverse "C:\Users\Gaming\Videos\GraphX projects\Test\clips\Bestlightning\reversed_data\%%~nA_reversed.mp4"

		//Gets all the clips
		const clips = fs.readdirSync(location);
		//Filters out anything that isn't a file
		const files = clips.filter(clip => fs.lstatSync(location+clip).isFile());

		//Checks if location/reversed_data exists
		const reversedData = `${location}\\reversed_data`;
		if(!fs.existsSync(reversedData)) {
			fs.mkdirSync(reversedData);
		}

		const filePromises = [];

		//Opens a file stream in location/reversed_data for fieles.text
		const fileStream = fs.createWriteStream(`${reversedData}\\files.txt`);

		files.forEach((_, i) => filePromises.push(this.#reverseClip(files, i, location, fileStream, extension, filePromises)));

		return Promise.all(filePromises).then(() => {
			fileStream.end();
			return Promise.resolve();
		}).catch((err) => {
			console.log(err);
			return Promise.reject(err);
		});
	}

	#reverseClip(files, index, location, fileStream, extension) {
		const file = files[index];
		//ffmpeg -i "%%A" -vf reverse -af areverse "C:\Users\Gaming\Videos\GraphX projects\Test\clips\Bestlightning\reversed_data\%%~nA_reversed.mp4"
		return cmdExec("ffmpeg", ["-i", `${location}${file}`, "-vf", "reverse", "-af", "areverse", `${location}reversed_data\\${file}-reversed${extension}`]).then(() => {
			//Writes the file name to the files.txt file like this: file "file.mp4"
			fileStream.write(`file '${location}reversed_data\\${file}-reversed${extension}'\n`);
		}).catch((err) => {
			console.log(err);
			return Promise.reject(err);
		});
	}

	#importFiles() {
		//Electron code to import files
		dialog.showOpenDialog(Windows.mainWindow, {
			properties: ["openFile", "multiSelections"],
			filters: [
				{ name: "Movies", extensions: ["mp4", "mpeg4", "ogg", "webm", "mp3", "m4a", "wav", "flac"] },
			],
		}).then((result) => {
			if(result.canceled) {
				return;
			}
			this.#files = result.filePaths;

			//Deletes all the thumbnails that are already in the folder
			//that have the same name as the video file
			this.#files.forEach((file) => {
				const parse = path.parse(file);
				if(fs.existsSync(`${path.basename(file, parse.ext)}.png`)) {
					//Deletes the thumbnail
					fs.rmSync(`${path.basename(file, parse.ext)}.png`);
				}
			});

			//Extracts the time metadata from the video files
			this.#extractMetadata(0, [...this.#files]);
		}).catch((err) => {
			console.log(err);
		});
	}

	#relinkClip(file) {
		//Ask user to choose a new file
		dialog.showOpenDialog(Windows.mainWindow, {
			properties: ["openFile"],
			title: "Relink Clip previous located at: " + file,
			filters: [
				{ name: "Movies", extensions: ["mp4", "mpeg4", "ogg", "webm", "mp3", "m4a", "wav", "flac"] },
			],
		}).then((result) => {
			if(result.canceled) {
				return;
			}
			const file = result.filePaths[0];
			getVideoDurationInSeconds(file).then((duration) => {
				Windows.sendToMainWindow("relinked-clip-data", {
					path: result.filePaths[0],
					name: path.basename(result.filePaths[0]),
					duration: duration * 1000,
				});
			}).catch((err) => {
				console.log(err);
				Windows.sendToMainWindow("relinked-clip-data", {
					path: result.filePaths[0],
					name: path.basename(result.filePaths[0]),
					duration: 0,
				});
			});
		});
	}

	#extractMetadata(counter, files) {
		//Checks if there are still files to extract metadata from
		if(this.#files[counter]) {
			let file = this.#files[counter];
			const type = audioExtensions.includes(path.parse(file).ext) ? "Audio" : "Video";
			//Gets the duration of the video file and continues to the next file
			getVideoDurationInSeconds(file).then((duration) => {
				files[counter] = { name: file, duration: duration * 1000, location: this.#files[counter], type: type };
				this.#extractMetadata(++counter, files);
			}).catch((err) => {
				//Need to figure out how to handle files that don't have duration
				console.log(err);
				files[counter] = { name: file, duration: 0 };
				this.#extractMetadata(++counter, files);
			});
		}else {
			//Sends the files to the renderer process
			this.#extractThumbnails(0, [], files);
		}
	}

	#extractThumbnails(counter, thumbnails, files) {
		if(this.#files[counter]) {
			let file = this.#files[counter];
			const parse = path.parse(file);
			let png = `${path.basename(this.#files[counter], parse.ext)}.png`;
			//Remove the dash from the beginning of the file name if it exists
			if(png.charAt(0) === "-") {
				png = png.substring(1);
			}

			//Checks if the file is an audio file
			if(audioExtensions.includes(parse.ext)) {
				//Returns and moves to the next thumbnail
				this.#extractThumbnails(++counter, thumbnails, files);
				return;
			}

			//Extracts the first frame of the video file and converts it to a a png
			exec(`ffmpeg -i "${file}" -vf "scale=iw*sar:ih,setsar=1" -vframes 1 "${png}"`, (error, stdout, stderr) => {
				if(error) {
					console.log(`error: ${error.message}`);
					return;
				}
				if(stderr) {
					console.log(`error?: ${stderr}`);
				}
				const dirname = __dirname.substring(0, __dirname.length - 24);
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
				this.#extractThumbnails(++counter, thumbnails, files);
			});
		}else {
			//Sends the files to the renderer process once all the thumbnails
			//have been extracted
			Windows.sendToMainWindow("imported-files", files);
		}
	}
}

exports.extractMetadataAndImportFile = function(file) {
	getVideoDurationInSeconds(file).then((duration) => {
		//The file name
		let name = path.basename(file);
		let _file = {name: name, location: file, duration: duration * 1000, totalDuration: duration * 1000};
		getMainWindow().webContents.send("imported-files", [_file]);
		getMainWindow().webContents.send("add-clip-to-track", _file);
	});
}
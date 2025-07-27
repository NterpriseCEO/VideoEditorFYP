const { dialog, ipcMain } = require("electron");
const fs = require("fs");
const path = require("path");
const { getVideoDurationInSeconds } = require("get-video-duration");
const { getProjectPath, cmdExec, audioExtensions, imageExtensions, getProjectFileName } = require("../globals/Globals");
const { Windows } = require("../LoadWindows");
const chokidar = require("chokidar");

module.exports.ImportFiles = class ImportFiles {

	#files = [];

	#watchers = [];

	constructor() {
		this.#listenForEvents();
	}

	#listenForEvents() {
		ipcMain.on("import-files", (_, files) => {
			this.#importFiles();
		});

		ipcMain.on("check-if-clips-need-relinking", (_, clips) => {
			Windows.sendToMainWindow("clips-that-need-relinking", clips.map(clip => fs.existsSync(clip)));
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

		ipcMain.on("listen-for-project-changes", () => {
			this.#watchers.push(chokidar.watch(
				getProjectPath() + "\\clips",
				{
					persistent: true,
					followSymlinks: false,
					usePolling: true,
					depth: undefined,
					interval: 100,
					ignoreInitial: true,
					ignorePermissionErrors: false
				}
			).on("add", path => this.#checkFileCopyComplete(path)
				.then(() => {
					console.log(path, "was copied over");
					this.#files = [path];
					this.#extractMetadata(0, [...this.#files]);
				})
				.catch(error => console.error(error))
			)
			.on("unlink", path => {
				console.log("file was unlinked", path);
				Windows.sendToMainWindow("clips-that-need-relinking", path);
			}));
		});

		ipcMain.on("exit-to-start-view", () => {
			this.#watchers.forEach(watcher => watcher?.close());
		});
	}

	#checkFileCopyComplete(path, previous) {
		return new Promise((resolve, reject) => {
			setTimeout(() => {
				fs.stat(path, (error, stat) => {
					if(error) {
						reject();
						throw error;
					}

					if(previous && stat.mtime.getTime() === previous.mtime.getTime()) {
						resolve();
					} else {
						return this.#checkFileCopyComplete(path, stat)
							.then(() => resolve());
					}
				});
			}, 1000);
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
				{ name: "Import clips", extensions: ["mp4", "mpeg4", "ogg", "webm", "mp3", "m4a", "wav", "flac", "png", "jpg", "jpeg", "webp"] },
			],
		}).then((result) => {
			if(result.canceled) {
				return;
			}
			this.#files = result.filePaths;

			//Deletes all the thumbnails that are already in the folder
			//that have the same name as the video file
			// Likely not needed anymore
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
				{ name: "Relink clips", extensions: ["mp4", "mpeg4", "ogg", "webm", "mp3", "m4a", "wav", "flac", "png", "jpg", "jpeg", "webp"] },
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
			const type = audioExtensions.includes(path.parse(file).ext) ? "Audio"
				: imageExtensions.includes(path.parse(file).ext) ? "Image"
				: "Video";
			//Gets the duration of the video file and continues to the next file
			if(type === "Image") {
				files[counter] = { name: file, duration: 10000, location: this.#files[counter], type: type };
				this.#extractMetadata(++counter, files);
			}else {
				getVideoDurationInSeconds(file).then((duration) => {
					files[counter] = { name: file, duration: duration * 1000, location: this.#files[counter], type: type };
					this.#extractMetadata(++counter, files);
				}).catch((err) => {
					console.log(err);
					files[counter] = { name: file, duration: 0, location: this.#files[counter], type: type};
					this.#extractMetadata(++counter, files);
				});
			}
		}else {
			//Sends the files to the renderer process
			this.#extractThumbnails(0, [], files);
		}
	}

	#extractThumbnails(counter, thumbnails, files) {
		if(this.#files[counter]) {
			let file = this.#files[counter];
			const parse = path.parse(file);
			//Checks if the file is an image file
			if(imageExtensions.includes(parse.ext)) {
				//Returns and moves to the next thumbnail
				files[counter].thumbnail = "local-resource://getMediaFile/" + file;
				this.#extractThumbnails(++counter, thumbnails, files);
				return;
			}

			// Checks if the file is an audio file
			if(audioExtensions.includes(parse.ext)) {
				files[counter].thumbnail = "assets/icon.png";
				this.#extractThumbnails(++counter, thumbnails, files);
				return;
			}

			//Extracts the first frame of the video file and converts it to a a png
			cmdExec(
				"ffmpeg",
				[
					"-i", file,
					"-vf", "select=eq(n\\,0)", // select the first frame
					"-vsync", "vfr",
					"-frames:v", "1", // number of frames to decode I think
					"-q:v", "31", // quality
					"-f", "image2pipe",
					"-"
				],
				() => { },
				(process) => {
					process.stdout.on("data", (data) => {
						// Converts the buffer to a base64 string
						data = `data:image/png;base64,${Buffer.from(data, "base64").toString("base64")}`;
						files[counter].thumbnail = data;
						process.stdout.removeAllListeners("data");
						this.#extractThumbnails(++counter, thumbnails, files);
					});
				}
			);
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
		Windows.sendToMainWindow("imported-files", [_file]);
		Windows.sendToMainWindow("add-clip-to-track", _file);
	});
}
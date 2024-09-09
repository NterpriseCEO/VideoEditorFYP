const { ipcMain, dialog } = require("electron");
const fs = require("fs");
const path = require("path");

const { setProjectPath, cmdExec, audioExtensions, imageExtensions } = require("../globals/Globals");
const { Windows } = require("../LoadWindows");

module.exports.SaveAndLoadProjects = class SaveAndLoadProjects {
	
	constructor() {
		ipcMain.on("create-blank-project", (_, project) => {
			dialog.showSaveDialog(Windows.mainWindow, {
				properties: ["saveFile"],
				filters: [
					{ name: "Video Live Set", extensions: ["vls"] }
				]
			}).then((result) => {
				if(result.canceled) {
					return;
				}

				//Gets the folder name from the file path
				let split = result.filePath.split("\\");
				let name = split.pop();
				let folderName = name.substring(0, name.lastIndexOf("."));
				project.location = split.join("\\") + "\\" + folderName + "\\" + name;

				let projectFolder = split.join("\\") + "\\" + folderName + "\\";

				//Creates a folder for the project
				fs.mkdirSync(projectFolder);
				setProjectPath(projectFolder);

				//Saves the project to a file
				//Formtas the JSON with tabs
				fs.writeFile(project.location, JSON.stringify(project, null, "\t"), (err) => {
					if(err) {
						console.log(err);
					}
					Windows.sendToMainWindow("project-created", project.location);
				});
			});
		});
		ipcMain.on("save-project-as", (_, project) => {
			dialog.showSaveDialog(Windows.mainWindow, {
				properties: ["saveFile"],
				filters: [
					{ name: "Video Live Set", extensions: ["vls"] },
				]
			}).then((result) => {
				if(result.canceled) {
					return;
				}

				let split = result.filePath.split("\\");
				let name = split.pop();
				let folderName = name.substring(0, name.lastIndexOf("."));
				project.location = split.join("\\") + "\\" + folderName + "\\" + name;

				let projectFolder = split.join("\\") + "\\" + folderName + "\\";

				//Creates a folder for the project
				fs.mkdirSync(projectFolder);
				setProjectPath(projectFolder);

				//Loops through the tracks and filters and
				//reduces the filter properties to just their values

				//Saves the project to a file
				fs.writeFile(project.location, JSON.stringify(project, null, "\t"), (err) => {
					if(err) {
						console.log(err);
					}
					Windows.sendToMainWindow("project-saved", project);
				});

			}).catch((err) => {
				console.log(err);
			});
		});

		ipcMain.on("save-project", (_, project) => {
			//remove everything after the last slash
			let folderName = project.location.substring(0, project.location.lastIndexOf("\\"));
			setProjectPath(folderName);
			fs.writeFile(project.location, JSON.stringify(project, null, "\t"), (err) => {
				if(err) {
					console.log(err);
				}
				Windows.sendToMainWindow("project-saved", project);
			});
		});

		ipcMain.on("load-project", (_, __) => {
			dialog.showOpenDialog(Windows.mainWindow, {
				properties: ["openFile"],
				filters: [
					{ name: "Project File", extensions: ["vls"] },
				],
			}).then((result) => {
				if(result.canceled) {
					return;
				}

				//remove everything after the last slash
				let folderName = result.filePaths[0].substring(0, result.filePaths[0].lastIndexOf("\\"));
				setProjectPath(folderName);

				//Load the project from the file
				fs.readFile(result.filePaths[0], (err, data) => {
					if(err) {
						console.log(err);
					}

					this.extractThumbnails(data);
				});

			}).catch((err) => {
				console.log(err);
			});
		});

		ipcMain.on("load-project-from-location", (_, location) => {
			//remove everything after the last slash
			let folderName = location.substring(0, location.lastIndexOf("\\"));
			setProjectPath(folderName);
			fs.readFile(location, (err, data) => {
				if(err) {
					console.log(err);
				}

				this.extractThumbnails(data);
			});
		});
	}

	extractThumbnails(data) {
		const project = JSON.parse(data);
		const allThumbnailPromises = [];
		// Loops through all the clips in the project and extracts the thumbnails
		project?.clips.forEach((clip) => {
			allThumbnailPromises.push(this.#extractThumbnail(clip));
		});

		// If there are no clips in the project, send the project to the main window
		if(allThumbnailPromises.length === 0) {
			Windows.sendToMainWindow("project-loaded", project);
			return;
		}

		// Wait for all the thumbnails to be extracted before
		// sending the project to the main window
		Promise.all(allThumbnailPromises).then(() => {
			Windows.sendToMainWindow("project-loaded", project);
		});
	};

	#extractThumbnail(clip) {
		return new Promise((resolve, reject) => {
			const location = clip.location;
			const parse = path.parse(location);
	
			//Checks if the file is an image file
			if(imageExtensions.includes(parse.ext)) {
				//Returns and moves to the next thumbnail
				clip.thumbnail = "local-resource://getMediaFile/" + location;
				resolve();
				return;
			}

			// Checks if the file is an audio file
			if(audioExtensions.includes(parse.ext)) {
				clip.thumbnail = "assets/icon.png";
				resolve();
				return;
			}
	
			//Extracts the first frame of the video file and converts it to a a png
			cmdExec(
				"ffmpeg",
				[
					'-i', location,
					'-vf', 'select=eq(n\\,0)', // select the first frame
					'-vsync', 'vfr',
					'-frames:v', '1', // number of frames to decode I think
					'-q:v', '31', // quality
					'-f', 'image2pipe',
					'-'
				],
				() => {},
				(process) => {
					process.stdout.on('data', (data) => {
						// Converts the buffer to a base64 string
						data = `data:image/png;base64,${Buffer.from(data, "base64").toString('base64') }`;
						clip.thumbnail = data;
						process.stdout.removeAllListeners('data');
						resolve();
					});
				}
			)
		});	
	}
}
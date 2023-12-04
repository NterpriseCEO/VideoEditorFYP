const { ipcMain, dialog } = require("electron");
const fs = require("fs");

const { setProjectPath } = require("../globals/Globals");

function SaveAndLoadProjects(window) {
	this.mainWindow = window;
}

SaveAndLoadProjects.prototype.listenForEvents = function() {
	ipcMain.on("create-blank-project", (_, project) => {
		dialog.showSaveDialog(this.mainWindow, {
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
			project.location = split.join("\\")+"\\"+folderName+"\\"+name;

			let projectFolder = split.join("\\")+"\\"+folderName+"\\";

			//Creates a folder for the project
			fs.mkdirSync(projectFolder);
			setProjectPath(projectFolder);

			//Saves the project to a file
			//Formtas the JSON with tabs
			fs.writeFile(project.location, JSON.stringify(project, null, "\t"), (err) => {
				if(err) {
					console.log(err);
				}
				this.mainWindow.webContents.send("project-created", project.location);
			});
		});
	});
	ipcMain.on("save-project-as", (_, project) => {
		dialog.showSaveDialog(this.mainWindow, {
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
			project.location = split.join("\\")+"\\"+folderName+"\\"+name;

			let projectFolder = split.join("\\")+"\\"+folderName+"\\";

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
				this.mainWindow.webContents.send("project-saved", project);
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
			this.mainWindow.webContents.send("project-saved", project);
		});
	});

	ipcMain.on("load-project", (_, __) => {
		dialog.showOpenDialog(this.mainWindow, {
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

				this.mainWindow.webContents.send("project-loaded", JSON.parse(data));
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

			this.mainWindow.webContents.send("project-loaded", JSON.parse(data));
		});
	});
}

exports.SaveAndLoadProjects = SaveAndLoadProjects;
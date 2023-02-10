const { ipcMain, dialog } = require("electron");
const fs = require("fs");

function SaveAndLoadProjects(window) {
	this.mainWindow = window;
}

SaveAndLoadProjects.prototype.listenForEvents = function() {
	ipcMain.on("save-project-as", (_, project) => {
		dialog.showSaveDialog(this.mainWindow, {
			properties: ["saveFile"],
			filters: [
				{ name: "Project File", extensions: ["json"] },
			],
		}).then((result) => {
			if (result.canceled) {
				return;
			}
			console.log(result);

			project.location = result.filePath;

			//Loop through the tracks and filters and
			//reduces the filter properties to just their values
			if(project.tracks) {
				project.tracks.forEach((track) => {
					if(!track.filters) {
						return;
					}
					track.filters.map((filter) => {
						filter.properties = filter.properties.map((property) => {
							return property.value;
						});
						return filter;
					});
				});
			}

			//Save the project to the file
			fs.writeFile(result.filePath, JSON.stringify(project), (err) => {
				if (err) {
					console.log(err);
				}
				this.mainWindow.webContents.send("project-saved", project);
			});

		}).catch((err) => {
			console.log(err);
		});
	});

	ipcMain.on("save-project", (_, project) => {
		fs.writeFile(project.location, JSON.stringify(project), (err) => {
			if (err) {
				console.log(err);
			}
			this.mainWindow.webContents.send("project-saved", project);
		});
	});

	ipcMain.on("load-project", (_, project) => {
		dialog.showOpenDialog(this.mainWindow, {
			properties: ["openFile"],
			filters: [
				{ name: "Project File", extensions: ["json"] },
			],
		}).then((result) => {
			if (result.canceled) {
				return;
			}

			console.log(result);

			//Load the project from the file
			fs.readFile(result.filePaths[0], (err, data) => {
				if (err) {
					console.log(err);
				}
				console.log("hello 2");

				this.mainWindow.webContents.send("project-loaded", JSON.parse(data));
			});

		}).catch((err) => {
			console.log(err);
		});
	});
}


exports.SaveAndLoadProjects = SaveAndLoadProjects;
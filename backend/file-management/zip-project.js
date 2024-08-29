const { ipcMain, dialog } = require("electron");
const jszip = require("jszip");
const fs = require("fs-extra");

const { getProjectPath } = require("../globals/Globals");
const { Windows } = require("../LoadWindows");

module.exports.ZipProject = class ZipProject {

	constructor() {
		this.#listenForEvents();
	}

	#listenForEvents() {
		ipcMain.on("zip-project", (_, project) => {
			this.#zipProject(project);
		});

		ipcMain.on("unzip-project", () => {
			this.#unzipProject(project);
		});
	}

	#zipProject(project) {

		dialog.showOpenDialog({
			properties: ["openDirectory"]
		}).then(result => {
			if(result.canceled) return;
			const projectFolder = result.filePaths[0];

			const zip = new jszip();
			// Creates a zip folder for clips
			zip.folder(`clips`);
			project.clips.forEach(clip => {
				// Reads each file and adds them to the zip folder
				const fileData = fs.readFileSync(clip.location);
				// Extracts the file name from the location
				// before using it as the file name in the zip folder
				const fileName = clip.location.split("\\").pop();
				zip.file(`clips/${fileName}`, fileData);
				// Also changes the old location in the JSON to the new location
				clip.location = `clips/${fileName}`;
			});

			// Loops through tracks and change any clip locations where clips are used
			project.tracks = project.tracks?.forEach(track => {
				track.clips = track.clips?.forEach(clip => {
					clip.location = `clips/${clip.location.split("\\").pop()}`;
				});
			});

			// Change the project file location
			project.location = `\\${project.location.split("\\").pop()}`;

			// Gets the name of the project file
			// It ends in vls but might have a different name hence the use of find
			const vlsFile = fs.readdirSync(getProjectPath()).find(file => file.endsWith(".vls"));
			// Writes the project JSON object to the zipped vls file
			zip.file(vlsFile, JSON.stringify(project, null, "\t"));
			// Extract the folder name from the path
			const folderName = getProjectPath().split("\\").pop();

			// Generates the zip file and informs tthe user when done
			zip.generateAsync({ type: "nodebuffer" }).then((content) => {
				fs.writeFileSync(`${projectFolder}\\${folderName}.zip`, content);
				Windows.sendToMainWindow("project-zipped");
			}).catch((error) => console.log(error));
		});
	}

	#unzipProject() {
		dialog.showOpenDialog({
			properties: ["openFile"],
			filters: [{ name: "Zip Files", extensions: ["zip"] }]
		}).then(result => {
			if(result.canceled) return;
			const zipFile = result.filePaths[0];

			const zipData = fs.readFileSync(zipFile);
			const zip = new jszip();
			zip.loadAsync(zipData).then(async (zip) => {
				const projectPath = zipFile.replace(".zip", "");

				let promises = [];

				// Loops through the zip file and extracts the files
				// and folders to the new project path
				zip.forEach(async (relativePath, zipEntry) => {
					const fullPath = `${projectPath}\\${relativePath}`;
					if(zipEntry.dir) {
						promises.push(fs.ensureDir(fullPath));
					}else {
						promises.push(zipEntry.async("nodebuffer")
							.then(content => fs.outputFile(fullPath, content)));
					}
				});

				await Promise.all(promises);

				// Loads the project file
				const projectFile = fs.readdirSync(projectPath).find(file => file.endsWith(".vls"));
				const projectData = fs.readFileSync(`${projectPath}\\${projectFile}`);
				const project = JSON.parse(projectData);

				// Loops through project clips and project track clips
				// and prepends the project path to the location
				project.clips?.forEach(clip => {
					clip.location = `${projectPath}\\${clip.location}`;
				});
				project.tracks?.forEach(track => {
					track.clips?.forEach(clip => {
						clip.location = `${projectPath}\\${clip.location}`;
					});
				});
				// Saves the project file
				fs.writeFileSync(`${projectPath}\\${projectFile}`, JSON.stringify(project, null, "\t"));

				Windows.sendToMainWindow("project-unzipped", project);
			});
		});
	}
}
const fs = require("fs");
const { dialog, ipcMain } = require("electron");
const { setExportPath } = require("../globals/Globals");

exports.listenForExportEvents = function(window) {

	ipcMain.on("choose-export-location", (_, __) => {
		dialog.showSaveDialog(window, {
			properties: ["saveFile"],
			filters: [
				{ name: "Video file", extensions: ["webm"] },
			],
		}).then((result) => {
			if (result.canceled) {
				return;
			}
	
			setExportPath(result.filePath);

			window.webContents.send("export-location-chosen", result.filePath);

		}).catch((err) => {
			console.log(err);
		});
	});
}
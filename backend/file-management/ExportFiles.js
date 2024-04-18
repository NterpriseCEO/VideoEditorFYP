const fs = require("fs");
const { dialog, ipcMain } = require("electron");
const { setExportPath } = require("../globals/Globals");
const { Windows } = require("../LoadWindows");

exports.listenForExportEvents = function() {

	ipcMain.on("choose-export-location", (_, __) => {
		dialog.showSaveDialog(Windows.mainWindow, {
			properties: ["saveFile"],
			filters: [
				{ name: "Video file", extensions: ["webm"] },
			],
		}).then((result) => {
			if(result.canceled) {
				return;
			}

			Windows.sendToMainWindow("export-location-chosen", result.filePath);
			setExportPath(result.filePath);

		}).catch((err) => {
			console.log(err);
		});
	});
}
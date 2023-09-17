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
			if(result.canceled) {
				return;
			}

			window.webContents.send("export-location-chosen", result.filePath);

			//Replaces the file name with filename_n.webm
			result.filePath = result.filePath.substring(0, result.filePath.lastIndexOf(".")) + "_n.webm";
	
			setExportPath(result.filePath);			

		}).catch((err) => {
			console.log(err);
		});
	});
}
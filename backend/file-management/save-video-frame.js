const fs = require("fs");
const path = require("path");
const { dialog, ipcMain } = require("electron");

const { Windows } = require("../LoadWindows");

ipcMain.on("export-frame", (_, data) => {
	let location;
	dialog.showSaveDialog(null, {
		title: "Export Frame",
		filters: [
			{ name: "png", extensions: ["png", "PNG"] },
			{ name: "jpg", extensions: ["jpg", "JPG", "jpeg", "JPEG"] },
			{ name: "webp", extensions: ["webp", "WEBP"] },
		]
	}).then(({ filePath, canceled }) => {
		if(canceled) {
			Windows.sendToPreviewWindow("cancel-frame-export");
			ipcMain.removeAllListeners("frame-data-received");
			return;
		}

		location = filePath;
		// Gets the file extension excluding the period
		const extension = path.extname(filePath).split('.');

		Windows.sendToPreviewWindow("frame-requested", extension.at(-1));
	});

	ipcMain.once("frame-data-received", (_, data) => {
		// Once the actual frame data is received, saves the file to the requested location
		fs.writeFile(location, data.split(',')[1], "base64", (error) => {
			if(error) {
				console.log(error);
				Windows.sendToPreviewWindow("cancel-frame-export");
				return;
			}
			// Sends a message that the frame was saved
			Windows.sendToPreviewWindow("frame-saved");
		});
	});
});
const { ipcMain, desktopCapturer } = require("electron");

function StreamingAndFilters() {}

StreamingAndFilters.prototype.setWindows = function(window, previewWindow) {
	this.window = window;
	this.previewWindow = previewWindow;
}
StreamingAndFilters.prototype.listenForEvents = function() {
	ipcMain.on("get-stream", () => {
		//Gets screenshare stream
		desktopCapturer.getSources({ types: ["window", "screen"] }).then(sources => {
			this.previewWindow.webContents.send("stream", sources);
		});
	});

	ipcMain.on("get-screenshare-options", () => {
		//Gets screenshare options
		desktopCapturer.getSources({ types: ["window", "screen"] }).then(sources => {
			sources.map((source) => {
				source.thumbnail = source.thumbnail.toDataURL();
			});
			this.window.webContents.send("screenshare-options", sources);
		});
	});

	ipcMain.on("send-tracks", (_, tracks) => {
		this.previewWindow.webContents.send("tracks", tracks);
	});
	ipcMain.on("update-track-clips", (_, track) => {
		this.previewWindow.webContents.send("update-track-clips", track);
	});
	ipcMain.on("update-filters", (_, track) => {
		this.previewWindow.webContents.send("update-filters", track);
	});

	ipcMain.on("set-selected-clip-in-preview", (_, filePath) => {
		//Sets the source of the video element in the preview window
		//that is used to preview the selected clip
		this.previewWindow.webContents.send("set-selected-clip-in-preview", filePath);
	});
}

module.exports.StreamingAndFilters = StreamingAndFilters;

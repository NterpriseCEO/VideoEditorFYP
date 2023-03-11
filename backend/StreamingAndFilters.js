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
		if(this.previewWindow) {
			this.previewWindow.webContents.send("update-track-clips", track);
		}
	});
	ipcMain.on("update-filters", (_, track) => {
		if(this.previewWindow) {
			this.previewWindow.webContents.send("update-filters", track);
		}
	});
	ipcMain.on("update-layer-filter", (_, track) => {
		if(this.previewWindow) {
			this.previewWindow.webContents.send("update-layer-filter", track);
		}
	});

	ipcMain.on("set-selected-clip-in-preview", (_, filePath) => {
		//Sets the source of the video element in the preview window
		//that is used to preview the selected clip
		this.previewWindow.webContents.send("set-selected-clip-in-preview", filePath);
	});

	ipcMain.on("toggle-playing", () => {
		//Toggles the playing state of the preview
		this.previewWindow.webContents.send("toggle-playing");
	});

	ipcMain.on("rewind-to-start", () => {
		//Rewinds the preview to the start
		this.previewWindow.webContents.send("rewind-to-start");
	});

	ipcMain.on("update-play-video-button", (_, data) => {
		//Changes the state of the play button in the main window
		this.window.webContents.send("update-play-video-button", data);
	});

	ipcMain.on("update-track-in-history", (_, track) => {
		this.window.webContents.send("update-track-in-history", track);
	});
}

module.exports.StreamingAndFilters = StreamingAndFilters;

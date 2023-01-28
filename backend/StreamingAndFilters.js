const { ipcMain, desktopCapturer } = require("electron");

function StreamingAndFilters(window, previewWindow) {
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

	ipcMain.on("set-filters", (_, filters) => {
		this.previewWindow.webContents.send("get-filters", filters);
	});
	ipcMain.on("send-tracks", () => {
		this.previewWindow.webContents.send("tracks");
	});
	ipcMain.on("change-source", (_, sourceData) => {
		this.previewWindow.webContents.send("source-changed", sourceData);
	});
}

module.exports.StreamingAndFilters = StreamingAndFilters;
const { ipcMain, desktopCapturer } = require("electron");

const { Windows } = require("./LoadWindows");

module.exports.StreamingAndFilters = class StreamingAndFilters {
	
	constructor() {
		this.#listenForEvents();
	}

	#listenForEvents() {
		ipcMain.on("get-stream", () => {
			//Gets screenshare stream
			desktopCapturer.getSources({ types: ["window", "screen"] }).then(sources => {
				Windows.sendToPreviewWindow("stream", sources);
			});
		});

		ipcMain.on("get-screenshare-options", () => {
			//Gets screenshare options
			desktopCapturer.getSources({ types: ["window", "screen"] }).then(sources => {
				sources.map((source) => {
					source.thumbnail = source?.thumbnail?.toDataURL();
				});
				Windows.sendToMainWindow("screenshare-options", sources);
			});
		});

		ipcMain.on("send-tracks", (_, data) => {
			data.tracks.forEach((track) => {
				if(!track.filters) {
					return;
				}
			});
			Windows.sendToPreviewWindow("tracks", data);
		});
		ipcMain.on("mute-track", (_, track) => {
			Windows.sendToPreviewWindow("mute-track", track);
		});
		ipcMain.on("update-track-clips", (_, track) => {
			Windows.sendToPreviewWindow("update-track-clips", track);
		});
		ipcMain.on("update-filters", (_, track) => {
			Windows.sendToPreviewWindow("update-filters", track);
		});
		ipcMain.on("update-layer-filter", (_, track) => {
			Windows.sendToPreviewWindow("update-layer-filter", track);
		});

		ipcMain.on("set-selected-clip-in-preview", (_, filePath) => {
			//Sets the source of the video element in the preview window
			//that is used to preview the selected clip
			Windows.sendToPreviewWindow("set-selected-clip-in-preview", filePath);
		});

		ipcMain.on("toggle-playing", () => {
			//Toggles the playing state of the preview
			Windows.sendToPreviewWindow("toggle-playing");

			//Tells the main window that the preview is open and ready to be played
			Windows.sendToMainWindow("preview-window-is-open", !!Windows.previewWindow);
		});

		ipcMain.on("rewind-to-start", () => {
			//Rewinds the preview to the start
			Windows.sendToPreviewWindow("rewind-to-start");
		});

		ipcMain.on("update-play-video-button", (_, data) => {
			//Changes the state of the play button in the main window
			Windows.sendToMainWindow("update-play-video-button", data);
		});

		ipcMain.on("update-track-in-history", (_, track) => {
			Windows.sendToMainWindow("update-track-in-history", track);
		});
	}
}

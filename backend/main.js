const { app, BrowserWindow } = require("electron");
const path = require("path");
const url = require("url");
const ffbinaries = require("ffbinaries");

const { MainWindow } = require("./LoadWindows");


//Downloads ffmpeg and ffprobe binaries for the current platform
// if they are not already downloaded
ffbinaries.downloadBinaries(() => {
	console.log("Downloaded all binaries for current platform.");
});

const window = new MainWindow();

app.whenReady().then(() => window.createWindow());

// exports.MainWindow = MainWindow;
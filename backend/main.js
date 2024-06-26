const { app, BrowserWindow } = require("electron");
const path = require("path");
const url = require("url");
const ffbinaries = require("ffbinaries");

const { Windows } = require("./LoadWindows");
const { StreamingAndFilters } = require("./StreamingAndFilters");
const { Server } = require("./globals/HTTPServer");
const { ImportFiles } = require("./file-management/ImportFiles");
const { SaveAndLoadProjects } = require("./file-management/SaveAndLoadProjects");
const { listenForExportEvents } = require("./file-management/ExportFiles");
const exportVideo = require("./video-processing/ExportVideos");

new StreamingAndFilters();

new ImportFiles();
new SaveAndLoadProjects();
listenForExportEvents(Windows.mainWindow);

new Server();

//Downloads ffmpeg and ffprobe binaries for the current platform
// if they are not already downloaded
ffbinaries.downloadBinaries(() => {
	console.log("Downloaded all binaries for current platform.");
});

Windows.init();

app.whenReady().then(() => Windows.createMainWindow());
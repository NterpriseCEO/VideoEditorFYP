const { app, BrowserWindow } = require("electron");
const path = require("path");
const url = require("url");
const ffbinaries = require("ffbinaries");

const { Windows } = require("./LoadWindows");
const { StreamingAndFilters } = require("./StreamingAndFilters");
const { Server } = require("./globals/HTTPServer");
const { ImportFiles } = require("./file-management/ImportFiles");
const { SaveAndLoadProjects } = require("./file-management/SaveAndLoadProjects");
const { ZipProject } = require("./file-management/zip-project");
const { listenForExportEvents } = require("./file-management/ExportFiles");
const exportVideo = require("./video-processing/ExportVideos");

require("./file-management/save-video-frame");

new StreamingAndFilters();

new ImportFiles();
new SaveAndLoadProjects();
new ZipProject();
listenForExportEvents(Windows.mainWindow);

new Server();

//Downloads ffmpeg and ffprobe binaries for the current platform
// if they are not already downloaded
ffbinaries.downloadBinaries(() => {
	console.log("Downloaded all binaries for current platform.");
});

process.on('uncaughtException', (err) => {
	console.error('Uncaught Exception:', err);
});

Windows.init();

app.whenReady().then(() => Windows.createMainWindow());
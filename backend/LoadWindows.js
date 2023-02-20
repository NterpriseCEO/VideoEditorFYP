const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const windowStateKeeper = require("electron-window-state");

const { StreamingAndFilters } = require("./StreamingAndFilters");
const { Worker } = require("worker_threads");
const { ImportFiles } = require("./file-management/ImportFiles");
const { Server } = require("./globals/HTTPServer");
const { registerFileProtocol } = require("./file-management/FIleProtocol.js");
const { SaveAndLoadProjects } = require("./file-management/SaveAndLoadProjects");
const { listenForExportEvents } = require("./file-management/ExportFiles");

function MainWindow() {

	//This is like a constructor for the MainWindow class
	//Except that I can"t use constructors in this flavour of javascript
	this.isFullScreen = false;

	//This parses the command line arguments to determine
	//if the app is in development mode or not
	this.args = process.argv.slice(1);
	this.serve = this.args.some(val => val === "--localhost");

	this.canExit = false;
}

MainWindow.prototype.listenForEvents = function() {
	new ImportFiles(this.window).listenForEvents();
	new SaveAndLoadProjects(this.window).listenForEvents();
	this.streamingAndFilters = new StreamingAndFilters();
	this.streamingAndFilters.listenForEvents();
	listenForExportEvents(this.window);

	this.server = new Server();

	//Saves the video files to the user"s computer in a sparate thread
	//WIll replace this with MediaRecorder in the future
	// const worker = new Worker("./backend/video-processing/ListenForFrames.js");

	/*//Pipes individual frames to the worker thread
	//Will stream chunks over websocket in the future
	ipcMain.on("frame", (_, source) => {
		worker.postMessage({type: "frame", contents: source});
	});*/

	ipcMain.on("toggle-recording", (_, isRecording) => {
		//Sends the recording status to the worker thread to start/stop the merging of frames
		// worker.postMessage({type: "toggle-recording", contents: isRecording});
		this.previewWindow.webContents.send("toggle-recording", isRecording);
	});

	app.on("window-all-closed", () => {
		// On macOS specific close process
		if (process.platform !== "darwin") {
			app.quit()
		}
	});

	this.window.on("close", (e) => {
		if(!this.canExit) {
			e.preventDefault();
			this.window.webContents.send("check-if-can-exit");
		}else {
			this.canExit = false;
		}
	});
	
	app.on("activate", () => {
		if (this.window === null) {
			createWindow()
		}
	});

	ipcMain.on("open-preview-window", () => {
		this.createPreviewWindow();
	});
	ipcMain.on("exit-to-start-view", () => {
		if(this.previewWindow) {
			this.previewWindow.close();
		}
		this.loadStartView();
	});
	ipcMain.on("exit", () => {
		this.canExit = true;
		app.quit();
	});

	registerFileProtocol();
}

MainWindow.prototype.createWindow = function() {

	const mainWindowState = windowStateKeeper({
		defaultWidth: 600,
		defaultHeight: 600
	});

	this.window = new BrowserWindow({
		titlebarStyle: "hidden",
		width: mainWindowState.width,
		height: mainWindowState.height,
		minWidth: 600,
		minHeight: 600,
		x: mainWindowState.x,
		y: mainWindowState.y,
		webPreferences: {
			contextIsolation: true,
			preload: path.join(__dirname, "preload.js")
		}
	});

	mainWindowState.manage(this.window);

	this.loadStartView();

	//Hides the top menu bar
	this.window.setMenu(null);

	this.window.webContents.openDevTools();

	this.listenForEvents();
};

MainWindow.prototype.loadStartView = function() {
	if(this.serve) {
		//Development mode
		this.window.loadURL("http://localhost:4200/startup");
	}else {
		//Production mode
		this.window.loadURL(url.format({
			pathname: path.join(__dirname, "../dist/video-editor/index.html"),
			protocol: "file:",
			slashes: true,
			hash: "/startup"
		}));
	}
}

MainWindow.prototype.createPreviewWindow = function() {
	this.previewWindow = new BrowserWindow({
		titlebarStyle: "hidden",
		width: 600,
		height: 400,
		minWidth: 600,
		minHeight: 600,
		x: 100,
		y: 100,
		webPreferences: {
			contextIsolation: true,
			preload: path.join(__dirname, "preload.js")
		}
	});

	this.previewWindow.setMenu(null);

	if(this.serve) {
		//Development mode
		this.previewWindow.loadURL("http://localhost:4200/preview");
	}else {
		this.previewWindow.loadURL(url.format({
			pathname: path.join(__dirname, "../dist/video-editor/index.html"),
			protocol: "file:",
			slashes: true,
			hash: "/preview"
		}));
	}
	this.previewWindow.webContents.openDevTools();

	this.server.setWindows(this.window, this.previewWindow);
	this.streamingAndFilters.setWindows(this.window, this.previewWindow);

	//Clears the previous on close event
	this.previewWindow.once("close", (e) => {
		this.previewWindow = null;
		this.streamingAndFilters.setWindows(this.window, this.previewWindow);
		this.window.webContents.send("preview-exited");
	});
	
	//Tells the main window that the preview window has loaded
	//And is ready to receive data
	this.previewWindow.webContents.once("did-finish-load", () => {
		this.window.webContents.send("preview-opened");
	});
}

exports.MainWindow = MainWindow;
const { app, BrowserWindow, ipcMain } = require("electron");
const path = require("path");
const windowStateKeeper = require("electron-window-state");

const { StreamingAndFilters } = require("./StreamingAndFilters");
const { Worker } = require("worker_threads");
const { ImportFiles } = require("./file-management/ImportFiles");
const { startServer } = require("./globals/http-server");

function MainWindow() {

	//This is like a constructor for the MainWindow class
	//Except that I can"t use constructors in this flavour of javascript
	this.isFullScreen = false;

	//This parses the command line arguments to determine
	//if the app is in development mode or not
	this.args = process.argv.slice(1);
	this.serve = this.args.some(val => val === "--localhost");
}

MainWindow.prototype.listenForEvents = function() {
	new StreamingAndFilters(this.window, this.previewWindow).listenForEvents();
	new ImportFiles(this.window).listenForEvents();

	//Saves the video files to the user"s computer in a sparate thread
	//WIll replace this with MediaRecorder in the future
	const worker = new Worker("./backend/video-processing/ListenForFrames.js");

	//Pipes individual frames to the worker thread
	//Will stream chunks over websocket in the future
	ipcMain.on("frame", (_, source) => {
		worker.postMessage({type: "frame", contents: source});
	});

	ipcMain.on("toggle-recording", (_, isRecording) => {
		//Sends the recording status to the worker thread to start/stop the merging of frames
		worker.postMessage({type: "toggle-recording", contents: isRecording});
		this.previewWindow.webContents.send("toggle-recording", isRecording);
	});

	app.on("window-all-closed", function () {
		// On macOS specific close process
		if (process.platform !== "darwin") {
			app.quit()
		}
	});
	
	ipcMain.on("close-window", () => {
		if (process.platform !== "darwin") {
			app.quit()
		}
	});
	
	app.on("activate", function () {
		if (this.window === null) {
			createWindow()
		}
	});

	//Keep thjis here for future reference
	/*app.on("ready", async () => {
		protocol.registerFileProtocol("test", (request, callback) => {
			const url = request.url.replace("test://gem", "")
			const decodedUrl = decodeURI(url)
			try {
				return callback(decodedUrl)
			} catch (error) {
				console.error("ERROR: registerLocalResourceProtocol: Could not get file path:", error)
			}
		})
	});*/
}

MainWindow.prototype.createWindow = function() {

	const mainWindowState = windowStateKeeper({
		defaultWidth: 600,
		defaultHeight: 600
	});

	const previewWindowState = windowStateKeeper({
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

	this.previewWindow = new BrowserWindow({
		titlebarStyle: "hidden",
		width: previewWindowState.width,
		height: previewWindowState.height,
		minWidth: 600,
		minHeight: 600,
		x: previewWindowState.x,
		y: previewWindowState.y,
		webPreferences: {
			contextIsolation: true,
			preload: path.join(__dirname, "preload.js")
		}
	});


	mainWindowState.manage(this.window);
	previewWindowState.manage(this.previewWindow);

	//Hides the top menu bar
	this.window.setMenu(null);
	this.previewWindow.setMenu(null);

	if(this.serve) {
		//Development mode
		this.window.loadURL("http://localhost:4200/mainview");
		this.previewWindow.loadURL("http://localhost:4200/preview");
		this.window.webContents.openDevTools();
		this.previewWindow.webContents.openDevTools();
	}else {
		//Production mode
		this.window.loadURL(url.format({
			pathname: path.join(__dirname, "../dist/video-editor/index.html"),
			protocol: "file:",
			slashes: true,
			hash: "/mainview"
		}));
		
		this.window.webContents.openDevTools();
		this.previewWindow.loadURL(url.format({
			pathname: path.join(__dirname, "../dist/video-editor/index.html"),
			protocol: "file:",
			slashes: true,
			hash: "/preview"
		}));
		this.previewWindow.webContents.openDevTools();
	}

	startServer(this.window);
	this.listenForEvents();

	ipcMain.handle("close-window", async (evt) => {
		this.window.close();
	});
};

exports.MainWindow = MainWindow;
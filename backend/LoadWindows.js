const { app, BrowserWindow, ipcMain, nativeImage } = require("electron");
const path = require("path");
const windowStateKeeper = require("electron-window-state");
const url = require("url");

const { Worker } = require("worker_threads");
const { registerFileProtocol } = require("./file-management/FIleProtocol.js");

module.exports.Windows = class Windows {

	static #args;
	static #serve;
	static #canExit;
	static #image;
	static mainWindow;
	static previewWindow;

	static init() {
		//This parses the command line arguments to determine
		//if the app is in development mode or not
		Windows.#args = process.argv.slice(1);
		Windows.#serve = Windows.#args.some(val => val === "--localhost");

		Windows.#canExit = false;

		Windows.#image = path.join(__dirname, "/icons/icon.ico");
	}

	static listenForEvents() {

		//Saves the video files to the user"s computer in a sparate thread
		//WIll replace this with MediaRecorder in the future
		// const worker = new Worker("./backend/video-processing/ListenForFrames.js");

		/*//Pipes individual frames to the worker thread
		//Will stream chunks over websocket in the future
		ipcMain.on("frame", (_, source) => {
			worker.postMessage({type: "frame", contents: source});
		});*/

		ipcMain.on("toggle-recording", (_, data) => {
			// worker.postMessage({type: "toggle-recording", contents: isRecording});
			Windows.sendToPreviewWindow("toggle-recording", data);
		});

		ipcMain.on("toggle-recording-all", () => {
			//Toggles the recording of all tracks
			Windows.sendToPreviewWindow("toggle-recording-all");
		});

		app.on("window-all-closed", () => {
			// On macOS specific close process
			if(process.platform !== "darwin") {
				app.quit()
			}
		});

		Windows.mainWindow.on("close", (e) => {
			if(!this.#canExit) {
				e.preventDefault();
				Windows.mainWindow.webContents.send("check-if-can-exit");
			}else {
				Windows.#canExit = false;
			}
		});

		app.on("activate", () => {
			if(Windows.mainWindow === null) {
				createWindow()
			}
		});

		ipcMain.on("open-preview-window", () => {
			this.createPreviewWindow();
		});
		ipcMain.on("exit-to-start-view", () => {
			if(Windows.previewWindow) {
				Windows.previewWindow.close();
			}
			Windows.loadStartView();
		});
		ipcMain.on("exit", () => {
			Windows.#canExit = true;
			app.quit();
		});

		ipcMain.on("open-manual", () => {
			Windows.openManual();
		});

		registerFileProtocol();
	}

	static createMainWindow() {

		const mainWindowState = windowStateKeeper({
			defaultWidth: 600,
			defaultHeight: 600
		});

		Windows.mainWindow = new BrowserWindow({
			titlebarStyle: "hidden",
			width: mainWindowState.width,
			height: mainWindowState.height,
			minWidth: 600,
			minHeight: 600,
			x: mainWindowState.x,
			y: mainWindowState.y,
			icon: Windows.#image,
			webPreferences: {
				contextIsolation: true,
				preload: path.join(__dirname, "preload.js")
			}
		});

		mainWindowState.manage(Windows.mainWindow);

		Windows.loadStartView();

		//Hides the top menu bar
		Windows.mainWindow.setMenu(null);

		Windows.mainWindow.webContents.openDevTools();

		Windows.listenForEvents();
	}

	static openManual() {
		if(Windows.manualWindow) {
			Windows.manualWindow.focus();
			return;
		}
		Windows.manualWindow = new BrowserWindow({
			titlebarStyle: "hidden",
			width: 600,
			height: 400,
			minWidth: 600,
			minHeight: 600,
			x: 100,
			y: 100,
			icon: Windows.#image,
			webPreferences: {
				contextIsolation: true,
				preload: path.join(__dirname, "preload.js")
			}
		});

		Windows.manualWindow.setMenu(null);
		if(Windows.#serve) {
			//Development mode
			Windows.manualWindow.loadURL("http://localhost:4200/manual");
		}else {
			//Production mode
			Windows.manualWindow.loadURL(url.format({
				pathname: path.join(__dirname, "../dist/video-editor/index.html"),
				protocol: "file:",
				slashes: true,
				hash: "/manual"
			}));
		}

		Windows.manualWindow.once("close", (e) => {
			Windows.manualWindow = null;
		});
	}

	static loadStartView() {
		if(Windows.#serve) {
			//Development mode
			console.log("Loading start view");
			Windows.mainWindow.loadURL("http://localhost:4200/startup");
		}else {
			//Production mode
			Windows.mainWindow.loadURL(url.format({
				pathname: path.join(__dirname, "../dist/video-editor/index.html"),
				protocol: "file:",
				slashes: true,
				hash: "/startup"
			}));
		}
	}

	static createPreviewWindow() {
		Windows.previewWindow = new BrowserWindow({
			titlebarStyle: "hidden",
			width: 600,
			height: 400,
			minWidth: 600,
			minHeight: 600,
			x: 100,
			y: 100,
			icon: Windows.#image,
			webPreferences: {
				contextIsolation: true,
				preload: path.join(__dirname, "preload.js")
			}
		});

		Windows.previewWindow.setMenu(null);

		if(Windows.#serve) {
			//Development mode
			Windows.previewWindow.loadURL("http://localhost:4200/preview");
		}else {
			Windows.previewWindow.loadURL(url.format({
				pathname: path.join(__dirname, "../dist/video-editor/index.html"),
				protocol: "file:",
				slashes: true,
				hash: "/preview"
			}));
		}
		Windows.previewWindow.webContents.openDevTools();

		//Clears the previous on close event
		Windows.previewWindow.once("close", (e) => {
			Windows.previewWindow = null;
			Windows.mainWindow.webContents.send("preview-exited");
			Windows.mainWindow.webContents.send("update-play-video-button", { isPlaying: false, isFinishedPlaying: true, currentTime: 0 });
		});

		//Tells the main window that the preview window has loaded
		//And is ready to receive data
		Windows.previewWindow.webContents.once("did-finish-load", () => {
			Windows.mainWindow.webContents.send("preview-opened");
		});
	}

	static sendToMainWindow(messageName, ...args) {
		Windows.mainWindow.webContents.send(messageName, ...args);
	}

	static sendToPreviewWindow(messageName, ...args) {
		if(Windows.previewWindow) {
			Windows.previewWindow.send(messageName, ...args);
		}
	}
}
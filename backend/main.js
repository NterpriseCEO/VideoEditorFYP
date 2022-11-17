const { app, BrowserWindow, ipcMain, protocol, desktopCapturer } = require("electron");
const path = require("path");
const windowStateKeeper = require("electron-window-state");

// const { globals } = require("../globals");

function MainWindow() {
    //This is like a constructor for the MainWindow class
	//Except that I can't use constructors in this flavour of javascript

	//This parses the command line arguments to determine
	//if the app is in development mode or not
	this.args = process.argv.slice(1);
	this.serve = this.args.some(val => val === '--localhost');
	
	this.listenForEvents();
}

MainWindow.prototype.listenForEvents = function() {
	app.on('window-all-closed', function () {
		// On macOS specific close process
		if (process.platform !== 'darwin') {
			app.quit()
		}
	});
	
	ipcMain.on("close-window", () => {
		if (process.platform !== 'darwin') {
			app.quit()
		}
	});
	
	ipcMain.on("minimise-window", () => {
		this.window.minimize();
	});

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
	ipcMain.on("change-source", (_, sourceData) => {
		this.previewWindow.webContents.send("source-changed", sourceData);
	});
	
	// ipcMain.on("maximise-window", () => {
	// 	this.isFullScreen = !this.isFullScreen;
	// 	this.isFullScreen ? this.window.maximize() : this.window.unmaximize();
	// });
	
	app.on('activate', function () {
		if (this.window === null) {
			createWindow()
		}
	});
}

MainWindow.prototype.createWindow = function() {

	// const mainWindowState = windowStateKeeper({
	// 	defaultWidth: 800,
	// 	defaultHeight: 600
	// });

	this.window = new BrowserWindow({
		titlebarStyle: 'hidden',
		width: 200,
		height: 200,
		minWidth: 800,
		minHeight: 600,
		x: 200,
		y: 200,
		webPreferences: {
			contextIsolation: true,
			preload: path.join(__dirname, "preload.js")
		}
	});

	this.previewWindow = new BrowserWindow({
		titlebarStyle: 'hidden',
		width: 200,
		height: 200,
		minWidth: 800,
		minHeight: 600,
		x: 200,
		y: 200,
		webPreferences: {
			contextIsolation: true,
			preload: path.join(__dirname, "preload.js")
		}
	});

	// this.isFullScreen = mainWindowState.isMaximized;

	// mainWindowState.manage(this.window);

	//Hides the top menu bar
	this.window.setMenu(null);
	this.previewWindow.setMenu(null);

	if(this.serve) {
		//Development mode
		this.window.loadURL('http://localhost:4200/mainview');
		this.previewWindow.loadURL('http://localhost:4200/preview');
		this.window.webContents.openDevTools();
		this.previewWindow.webContents.openDevTools();
	}else {
		//Production mode
		// this.window.loadURL(path.join(__dirname, "../../dist/music-streaming/index.html"));
		this.window.webContents.openDevTools();
	}

	ipcMain.handle('close-window', async (evt) => {
		this.window.close();
	});
};

const window = new MainWindow();

app.whenReady().then(() => window.createWindow());

// exports.MainWindow = MainWindow;
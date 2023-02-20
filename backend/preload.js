const {
	ipcRenderer,
	contextBridge,
	desktopCapturer,
} = require("electron");

//This exposes the functionality of the contextBridge to the renderer process
//i.e. the frontend UI
contextBridge.exposeInMainWorld("api", {
	on: (event, func) => {
		ipcRenderer.on(event, (e, ...args) => func(e, ...args));
	},
	once: (event, func) => {
		ipcRenderer.once(event, (e, ...args) => func(e, ...args));
	},
	emit: (event, data) => {
		ipcRenderer.send(event, data);
	}
});
const {
	ipcRenderer,
	contextBridge
} = require("electron");

const eventsMap = new Map();

//This exposes the functionality of the contextBridge to the renderer process
//i.e. the frontend UI
contextBridge.exposeInMainWorld("api", {
	on: (event, func) => {
		const funct = (e, ...args) => func(e, ...args);
		ipcRenderer.on(event, funct)
		eventsMap.set(event, funct);
	},
	once: (event, func) => {
		const funct = (e, ...args) => func(e, ...args);
		ipcRenderer.once(event, funct);
		eventsMap.set(event, funct);
	},
	emit: (event, data) => {
		ipcRenderer.send(event, data);
	},
	removeListener: (event) => {
		const listener = eventsMap.get(event);
		if (listener) {
			ipcRenderer.removeListener(event, listener);
		}
	},
	removeAllListeners: (event) => {
		ipcRenderer.removeAllListeners(event);
	}
});
const http = require("http");
const { ipcMain } = require("electron");
const fs = require("fs");
const { listenForVideoData } = require("../video-processing/ListenForVideoData.js");
const { Windows } = require("../LoadWindows.js");

let server;

function Server() {
	server = http.createServer();
	//Finds a free port and starts the server
	server.listen(0, "localhost", () => {
		console.log(`Server is running on http://localhost:${server.address().port}`);
		socketConnections();
		ipcMain.on("get-server-port", () => {
			let port = server.address().port;
			Windows.sendToMainWindow("server-port", port);
			Windows.sendToPreviewWindow("server-port", port);
		});
	});
}

function socketConnections() {
	const io = require("socket.io")(server, {
		pingTimeout: 86400000,
		cors: {
			origin: server.address().port,
			methods: ["GET", "POST"]
		}
	});
	io.on("connection", client => {
		listenForVideoData(client);
	});
}

exports.Server = Server;
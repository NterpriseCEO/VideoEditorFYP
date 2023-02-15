const http = require("http");
const { ipcMain } = require("electron");
const fs = require("fs");
const { listenForVideoData } = require("../video-processing/ListenForVideoData.js");

let server;

function Server() {
	server = http.createServer();
	//Finds a free port and starts the server
	server.listen(0, "localhost", () => {
		console.log(`Server is running on http://localhost:${server.address().port}`);
		socketConnections();
		ipcMain.on("get-server-port", () => {
			this.window.webContents.send("server-port", server.address().port);
		});
	});
}

Server.prototype.setWindow = function(win) {
	this.window = win;
}

function socketConnections() {
	const io = require("socket.io")(server, {
		cors: {
			origin: server.address().port,
			methods: ["GET", "POST"]
		}
	});
	io.on("connection", client => {
		listenForVideoData(client);
		client.on("disconnect", () => {});
	});
}

exports.Server = Server;
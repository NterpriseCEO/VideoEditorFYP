const http = require("http");
const { ipcMain } = require("electron");
const fs = require("fs");

let server;
let window;

function startServer(win) {
	window = win;
	server = http.createServer();
	//Finds a free port and starts the server
	server.listen(0, "localhost", () => {
		console.log(`Server is running on http://localhost:${server.address().port}`);
		socketConnections();
		ipcMain.on("get-server-port", () => {
			window.webContents.send("server-port", server.address().port);
		});

	});
}

exports.startServer = startServer;

function socketConnections() {
	const io = require('socket.io')(server, {
		cors: {
			origin: server.address().port,
			methods: ["GET", "POST"]
		}
	});
	io.on('connection', client => {
		let fileStream;

		client.on("start-recording", () => {
			fileStream = fs.createWriteStream("./test.webm", { flags: 'a' });
		});
		client.on('recording-data', data => {
			fileStream.write(Buffer.from(new Uint8Array(data)));
		});
		client.on('stop-recording', () => {
			fileStream.end();
		});
		client.on('disconnect', () => {});
	});
}
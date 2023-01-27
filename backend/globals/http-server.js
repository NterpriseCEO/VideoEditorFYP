const http = require("http");

let server;
let window;

function startServer(win) {
	window = win;
	server = http.createServer();
	//Finds a free port and starts the server
	server.listen(0, "localhost", () => {
		console.log(`Server is running on http://localhost:${server.address().port}`);
		window.webContents.send("server-port", server.address().port);
	});
}

exports.startServer = startServer;
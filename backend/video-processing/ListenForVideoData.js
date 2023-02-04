const fs = require("fs");

exports.listenForVideoData = function(client) {
	let fileStream;

	client.on("start-recording", () => {
		//delete test.webm if it exists
		if (fs.existsSync("./test.webm")) {
			fs.unlinkSync("./test.webm");
		}
		fileStream = fs.createWriteStream("./test.webm", { flags: 'a' });
	});
	client.on('recording-data', data => {
		fileStream.write(Buffer.from(new Uint8Array(data)));
	});
	client.on('stop-recording', () => {
		fileStream.end();
	});
}
const { ipcMain } = require("electron");
const fs = require("fs");

function ListenForFrames() {

	let ffbinaries = require('ffbinaries');
	
	this.currentFrame = null;
	this.frameNumber = 0;

	ffbinaries.downloadBinaries(() => {
		console.log('Downloaded all binaries for current platform.');
	});

	this.listenForFrames();
}

ListenForFrames.prototype.listenForFrames = function() {
	ipcMain.on("frame", (_, source) => {
		this.currentFrame = source;
		this.frameNumber++;
		//save the frame to a file
		if(this.frameNumber < 3000) {
			// console.log(this.currentFrame);
			const data = source.replace(/^data:image\/\w+;base64,/, "");
			const buffer = Buffer.from(data, "base64");
			//convert framenumber to string and pad with 2 0s if less than 100
			fs.writeFile(`./frames/frame${this.frameNumber.toString().padStart(3, "0")}.png`, buffer, (err) => {
				if (err) {
					console.log(err);
				}
			});
		}else {
			// console.log("100 frames saved");
		}
	});
}

module.exports.ListenForFrames = ListenForFrames;
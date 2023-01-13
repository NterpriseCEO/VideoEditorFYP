const { ipcMain } = require("electron");
const fs = require("fs");
//import cmd runner
const { exec } = require("child_process");

function ListenForFrames() {

	let ffbinaries = require('ffbinaries');
	
	this.currentFrame = null;
	this.frameNumber = 0;

	this.outputNumber = 0;

	ffbinaries.downloadBinaries(() => {
		console.log('Downloaded all binaries for current platform.');
	});

	//Deletes outputX.mp4 if it exists
	if(fs.existsSync(`./output${this.outputNumber}.mp4`)) {
		fs.unlinkSync(`./output${this.outputNumber}.mp4`);
	}

	this.saveFrames();
	this.listenForFrames();
}

ListenForFrames.prototype.listenForFrames = function() {
	ipcMain.on("frame", (_, source) => {
		this.currentFrame = source;
	});
}

//This function takes the current frame and saves it to a file
// 30 times a second
//After 5 seconds, it merges the frames into a video
//After 2 videos, it merges the videos into one video
//It then deletes the old video and continues from the beginning
ListenForFrames.prototype.saveFrames = function() {
	//interval 30fps
	let _this = this;
	setInterval(() => {
		//Skip if no frame is available
		if(_this.currentFrame == null) {
			return;
		}
		_this.frameNumber++;
		const data = _this.currentFrame.replace(/^data:image\/\w+;base64,/, "");
		const buffer = Buffer.from(data, "base64");
		//Save each frame to a file
		fs.writeFile(`./frame${_this.frameNumber}.png`, buffer, (err) => {
			if (err) {
				console.log(err);
			}
		});
		//Skip if less than 5 seconds have passed
		if(_this.frameNumber < 150) {
			return;
		}
		_this.frameNumber = 0;
		//Check that output.mp4 doesn't exists
		if(!fs.existsSync(`./output${_this.outputNumber}.mp4`)) {
			// Create outputX.mp4 from the frames
			mergeFrames(`output${_this.outputNumber}`);
		}else {
			// console.log("Merging frames AND TESTING TESTING TESTING TESTING BRO");
			// Create temp.mp4 from the next set of frames
			mergeFrames("temp", () => {
				//merge output.mp4 and temp.mp4
				exec(`(echo file 'output${_this.outputNumber}.mp4' & echo file 'temp.mp4' )>list.txt && ffmpeg -safe 0 -f concat -y -i list.txt -c copy output${++this.outputNumber}.mp4`, (error, stdout, stderr) => {
					if (error) {
						console.log(`error: ${error.message}`);
						return;
					}
					if (stderr) {
						console.log(`stderr: ${stderr}`);
						// return;
					}
					console.log(`stdout: ${stdout}`);
					console.log("Video compiled");
					//Deletes output(X-1).mp4
					fs.unlinkSync(`./output${_this.outputNumber - 1}.mp4`);
				});
			});
		}
	}, 1000/30);
}

function mergeFrames(name, callback) {
	console.log("\n\n\n\n\n");
	// Create {{name}}.mp4 from the frames
	//ffmpeg yes to overwrite, framerate 30, input files = frame%d.png, encoding stuff??, output  = {{name}}.mp4
	exec(`ffmpeg -y -framerate 30 -i frame%d.png -c:v libx264 -pix_fmt yuv420p ${name}.mp4`, (error, stdout, stderr) => {
		if (error) {
			console.log(`error: ${error.message}`);
			return;
		}
		if (stderr) {
			console.log(`error?: ${stderr}`);
			// return;
		}
		console.log(`stdout: ${stdout}`);
		console.log("\n\n\n\n\n" + name + ".mp4 compiled");

		if(callback) {
			//Return callback if it exists
			//Allows for syncronous execution
			callback();
		}
	});
}

module.exports.ListenForFrames = ListenForFrames;
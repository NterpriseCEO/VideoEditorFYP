const { ipcMain } = require("electron");
const fs = require("fs");
const { exec } = require("child_process");
const { workerData, parentPort } = require('worker_threads');

let currentFrame = null,
	frameNumber = 0,
	outputNumber = 0;

let ffbinaries = require('ffbinaries');

//Downloads ffmpeg and ffprobe binaries for the current platform
// if they are not already downloaded
ffbinaries.downloadBinaries(() => {
	console.log('Downloaded all binaries for current platform.');
});

//Deletes outputX.mp4 if it exists
if(fs.existsSync(`./output${outputNumber}.mp4`)) {
	fs.unlinkSync(`./output${outputNumber}.mp4`);
}

saveFrames();

//Reads the current frame from the main thread
parentPort.on('message', message => currentFrame = message);

//This function takes the current frame and saves it to a file
// 30 times a second
//After 5 seconds, it merges the frames into a video
//After 2 videos, it merges the videos into one video
//It then deletes the old video and continues from the beginning
function saveFrames() {
	//Runs at approximately 30fps
	setInterval(() => {
		//Skip if no frame is available
		if(currentFrame == null) {
			return;
		}
		frameNumber++;
		//Removes the data:image/png;base64, from the beginning of the string
		//This is the format that the canvas.toDataURL() function returns
		//It is then converted to a buffer
		const data = currentFrame.replace(/^data:image\/\w+;base64,/, "");
		const buffer = Buffer.from(data, "base64");
		//Save each frame to a file
		fs.writeFile(`./frame${frameNumber}.png`, buffer, (err) => {
			if (err) {
				console.log(err);
			}
		});
		//Skip if less than 5 seconds have passed
		if(frameNumber < 150) {
			return;
		}
		frameNumber = 0;
		//Check that output.mp4 doesn't exists
		if(!fs.existsSync(`./output${outputNumber}.mp4`)) {
			// Create outputX.mp4 from the frames
			mergeFrames(`output${outputNumber}`);
		}else {
			// console.log("Merging frames AND TESTING TESTING TESTING TESTING BRO");
			// Create temp.mp4 from the next set of frames
			mergeFrames("temp", () => {
				//merge output.mp4 and temp.mp4
				exec(`(echo file 'output${outputNumber}.mp4' & echo file 'temp.mp4' )>list.txt && ffmpeg -safe 0 -f concat -y -i list.txt -c copy output${++outputNumber}.mp4`, (error, stdout, stderr) => {
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
					fs.unlinkSync(`./output${outputNumber - 1}.mp4`);
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
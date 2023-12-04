const { spawn } = require("child_process");

let exportPath = "";
let projectPath = "";
let mainWindow;

exports.setExportPath = function(path) {
	exportPath = path;
}

exports.getExportPath = function() {
	return exportPath;
}

exports.setProjectPath = function(path) {
	projectPath = path;
}

exports.getProjectPath = function() {
	return projectPath;
}

exports.setMainWindow = function(window) {
	mainWindow = window;
}

exports.getMainWindow = function() {
	return mainWindow;
}	

exports.cmdExec = function(cmd, args) {
	//Returns a promise
	return new Promise((resolve, reject) => {
		const s = spawn(cmd, args);

		//Prints any data generated by the command to the console
		s.stdout.on("data", (data) => {
			console.log(data.toString());
		});

		//Prints the error to the console
		s.stderr.on("data", (data) => {
			data = data.toString();
			console.log(data);
		});

		//Returns the exit code of the command
		s.on("close", (code) => {
			if(code != 0) {
				console.log("\n\nerror: " + code);
				reject(code);
			}
			resolve(code);
		});
	});
}

exports.exportPath = exportPath;
exports.projectPath = projectPath;
exports.mainWindow = mainWindow;
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

exports.exportPath = exportPath;
exports.projectPath = projectPath;
exports.mainWindow = mainWindow;
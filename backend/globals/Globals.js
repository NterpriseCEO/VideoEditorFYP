let exportPath = "";

exports.setExportPath = function(path) {
	exportPath = path;
}

exports.getExportPath = function() {
	return exportPath;
}

exports.exportPath = exportPath;
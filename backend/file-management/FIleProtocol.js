const {protocol} = require("electron");

exports.registerFileProtocol = function() {
	//This is used to load files from the local file system
	protocol.registerFileProtocol("local-resource", (request, callback) => {
		const url = request.url.replace("local-resource://getMediaFile/", "");
		try {
			return callback(decodeURIComponent(url));
		}
		catch (error) {
			console.error(error)
			return callback(404)
		}
	});
}
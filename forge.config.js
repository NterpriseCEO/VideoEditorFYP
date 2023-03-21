module.exports = {
	packagerConfig: {
		icon: "./backend/icons/icons/icon",
		// ignore: [
		// 	// "^\\/public$",
		// 	// "^\\/src$",
		// 	// "^\\/node_modules$",
		// 	// "^\\/[.].+",
		// ]
	},
	rebuildConfig: {},
	makers: [
		{
			name: "@electron-forge/maker-squirrel",
			config: {
			},
		},
		{
			name: "@electron-forge/maker-zip",
			platforms: ["darwin"],
		},
		{
			name: "@electron-forge/maker-deb",
			config: {},
		},
		{
			name: "@electron-forge/maker-rpm",
			config: {},
		},
	],
};

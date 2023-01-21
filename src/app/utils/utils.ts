export function getRGBBrightness(rgb: string) {
	//Calculates the colour of the title based on the colour of the clip brightness
	let r = parseInt(rgb.substring(4, 6));
	let g = parseInt(rgb.substring(8, 12));
	let b = parseInt(rgb.substring(13, 17));

	return (r * 299 + g * 587 + b * 114) / 1000;
}

export function getHexBrightness(hex: string) {
	//Converts the hex colour to rgb and then calculates the brightness
	let rgb = hexToRgb(hex);
	return getRGBBrightness(rgb);
}

export function hexToRgb(hex: string) {
	//converts the hex colour to rgb
	let bigint = parseInt(hex.substring(1), 16);
	let r = (bigint >> 16) & 255;
	let g = (bigint >> 8) & 255;
	let b = bigint & 255;

	return `rgb(${r}, ${g}, ${b})`;
}
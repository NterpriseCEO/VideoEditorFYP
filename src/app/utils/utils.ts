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

//Deep comparison of two objects
//https://stackoverflow.com/questions/38400594/javascript-deep-comparison
export function deepCompare(a: any, b) {
	if ((typeof a == 'object' && a != null) &&
		(typeof b == 'object' && b != null)) {
		var count = [0, 0];
		for (var key in a) count[0]++;
		for (var key in b) count[1]++;
		if (count[0] - count[1] != 0) { return false; }
		for (var key in a) {
			if (!(key in b) || !deepCompare(a[key], b[key])) { return false; }
		}
		for (var key in b) {
			if (!(key in a) || !deepCompare(b[key], a[key])) { return false; }
		}
		return true;
	}
	else {
		return a === b;
	}
}
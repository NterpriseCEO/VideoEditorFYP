import { Component, ElementRef, QueryList, ViewChild, ViewChildren } from '@angular/core';
const fx = require("glfx-es6");

@Component({
	selector: 'app-root',
	templateUrl: './app.component.html',
	styleUrls: ['./app.component.scss']
})
export class AppComponent {

	src: any;

	getSampleCanvas: any;
	getSampleContext: any;

	@ViewChild('video') video!: ElementRef;
	//Reference all canvas elements using ViewCHildren
	@ViewChildren('canvas') canvas1!: QueryList<ElementRef>;

	constructor() {
		//access webcam
		navigator.mediaDevices.getUserMedia({ video: true })
			.then(stream => {
				this.src = stream;
				const video = this.video.nativeElement;
				video.onloadedmetadata = () => {
					this.video.nativeElement.play();
					this.allCanvases();
				};
			}
		);
	}

	allCanvases() {
		const canvases = this.canvas1.toArray();

		const filters: Filters[] = [
			// {name: "zoomBlur", properties: [320, 239.5, 0.3]},
			// {name: "bulgePinch", properties: [320, 239.5, 200, 1]},
			{name: "edgeWork", properties: [10]},
			// {name: "sepia", properties: [1]},
			// {name: "vignette", properties: [0.5, 0.5]},
			// {name: "colorHalftone", properties: [320, 239.5, 0.25, 4]}
		];

		//loop through all canvases
		for (let i = 0; i < this.canvas1.toArray().length; i++) {
			const _canvas = canvases[i].nativeElement;

			let canvas: any;
			try {
				canvas = fx.canvas();
			} catch (e) {
				alert(e);
				return;
			}

			_canvas.parentNode.insertBefore(canvas, _canvas.firstChild);
			_canvas.remove();
			const texture = canvas.texture(this.video.nativeElement);

			// texture.loadContentsOf(document.getElementsByTagName("img")[0]);

			let step = () => {
				texture.loadContentsOf(this.video.nativeElement);
				let draw = canvas.draw(texture);

				filters.forEach(filter => {
					draw = draw[filter.name](...filter.properties);
				});

				draw.update();

				window.requestAnimationFrame(step);
			};

			window.requestAnimationFrame(step);
		}
	}

	// greyscale(srcImageData: ImageData) {
	// 	var srcPixels    = srcImageData.data,
	// 		srcWidth     = srcImageData.width,
	// 		srcHeight    = srcImageData.height,
	// 		srcLength    = srcPixels.length,
	// 		dstImageData = this.createImageData(srcWidth, srcHeight),
	// 		dstPixels    = dstImageData.data;
	
	// 	for (var i = 0; i < srcLength; i += 4) {
	// 		var intensity = (srcPixels[i] * 19595 + srcPixels[i + 1] * 38470 + srcPixels[i + 2] * 7471) >> 16;
	// 		//var intensity = (srcPixels[i] * 0.3086 + srcPixels[i + 1] * 0.6094 + srcPixels[i + 2] * 0.0820) | 0;
	// 		dstPixels[i] = dstPixels[i + 1] = dstPixels[i + 2] = intensity;
	// 		dstPixels[i + 3] = srcPixels[i + 3];
	// 	}
	
	// 	return dstImageData;
	// }

	// edge(srcImageData: any) {
	// 	//pretty close to Fireworks 'Find Edges' effect
	// 	return this.convolutionFilter(srcImageData, 3, 3, [
	// 		-1, -1, -1,
	// 		-1,  8, -1,
	// 		-1, -1, -1
	// 	]);
	// };

	// emboss(srcImageData: any) {

	// 	return this.convolutionFilter(srcImageData, 3, 3, [
	// 		-2, -1, 0,
	// 		-1,  1, 1,
	// 		0,  1, 2
	// 	]);
	// }

	// convolutionFilter(srcImageData: any, matrixX: any, matrixY: any, matrix: number[], divisor?: any, bias?: any, preserveAlpha?: any, clamp?: any, color?: any, alpha?: any) {
	// 	var srcPixels    = srcImageData.data,
	// 		srcWidth     = srcImageData.width,
	// 		srcHeight    = srcImageData.height,
	// 		srcLength    = srcPixels.length,
	// 		dstImageData = this.createImageData(srcWidth, srcHeight),
	// 		dstPixels    = dstImageData.data;
	
	// 	divisor = divisor || 1;
	// 	bias = bias || 0;
	
	// 	// default true
	// 	(preserveAlpha !== false) && (preserveAlpha = true);
	// 	(clamp !== false) && (clamp = true);
	
	// 	color = color || 0;
	// 	alpha = alpha || 0;
	
	// 	var index = 0,
	// 		rows = matrixX >> 1,
	// 		cols = matrixY >> 1,
	// 		clampR = color >> 16 & 0xFF,
	// 		clampG = color >>  8 & 0xFF,
	// 		clampB = color       & 0xFF,
	// 		clampA = alpha * 0xFF;
	
	// 	for (var y = 0; y < srcHeight; y += 1) {
	// 		for (var x = 0; x < srcWidth; x += 1, index += 4) {
	// 			var r = 0,
	// 				g = 0,
	// 				b = 0,
	// 				a = 0,
	// 				replace = false,
	// 				mIndex = 0,
	// 				v;
	
	// 			for (var row = -rows; row <= rows; row += 1) {
	// 				var rowIndex = y + row,
	// 					offset = 0;
	
	// 				if (0 <= rowIndex && rowIndex < srcHeight) {
	// 					offset = rowIndex * srcWidth;
	// 				}
	// 				else if (clamp) {
	// 					offset = y * srcWidth;
	// 				}
	// 				else {
	// 					replace = true;
	// 				}
	
	// 				for (var col = -cols; col <= cols; col += 1) {
	// 					var m = matrix[mIndex++];
	
	// 					if (m !== 0) {
	// 						var colIndex = x + col;
	
	// 						if (!(0 <= colIndex && colIndex < srcWidth)) {
	// 							if (clamp) {
	// 								colIndex = x;
	// 							}
	// 							else {
	// 								replace = true;
	// 							}
	// 						}
	
	// 						if (replace) {
	// 							r += m * clampR;
	// 							g += m * clampG;
	// 							b += m * clampB;
	// 							a += m * clampA;
	// 						}
	// 						else {
	// 							var p = (offset + colIndex) << 2;
	// 							r += m * srcPixels[p];
	// 							g += m * srcPixels[p + 1];
	// 							b += m * srcPixels[p + 2];
	// 							a += m * srcPixels[p + 3];
	// 						}
	// 					}
	// 				}
	// 			}
	
	// 			dstPixels[index]     = (v = r / divisor + bias) > 255 ? 255 : v < 0 ? 0 : v | 0;
	// 			dstPixels[index + 1] = (v = g / divisor + bias) > 255 ? 255 : v < 0 ? 0 : v | 0;
	// 			dstPixels[index + 2] = (v = b / divisor + bias) > 255 ? 255 : v < 0 ? 0 : v | 0;
	// 			dstPixels[index + 3] = preserveAlpha ? srcPixels[index + 3] : (v = a / divisor + bias) > 255 ? 255 : v < 0 ? 0 : v | 0;
	// 		}
	// 	}
	
	// 	return dstImageData;
	// };

	// initSampleCanvas() {
    //     var _canvas = document.createElement('canvas'),
    //         _context = _canvas.getContext('2d');
        
    //     _canvas.width = 0;
    //     _canvas.height = 0;
        
    //     this.getSampleCanvas = function () {
    //         return _canvas;
    //     };
    //     this.getSampleContext = function () {
    //         return _context;
    //     };
    //     this.createImageData = (_context?.createImageData) ? function (w, h) {
	// 		return _context?.createImageData(w, h);
	// 	} : function (w, h) {
	// 		return new ImageData(w, h);
	// 	};
    // }

	// createImageData(w: any, h: any): any {
    //     this.initSampleCanvas();
    //     return this.createImageData(w, h);
    // }


}

interface Filters {
	name: string;
	properties: number[];
}
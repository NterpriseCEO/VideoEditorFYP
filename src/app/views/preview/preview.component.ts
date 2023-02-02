import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, NgZone, QueryList, ViewChild, ViewChildren } from "@angular/core";
import { FilterLibrary, TrackType } from "../../utils/constants";
import { Filter, FilterInstance, Track } from "../../utils/interfaces";
import { ImageFilters } from "src/app/utils/ImageFilters";
import { io, Socket } from "socket.io-client";
// import * as GPU from "../../utils/gpu.js";
// const GPU = require("../../utils/gpu.js");

const fx = require("glfx-es6");

@Component({
	selector: "video-preview",
	templateUrl: "./preview.component.html",
	styleUrls: ["./preview.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewComponent implements AfterViewInit {

	@ViewChild("replaceWithCanvas") replaceWithCanvas!: ElementRef;
	@ViewChild("finalCanvas") finalCanvas!: ElementRef;
	@ViewChildren("videos") videos!: QueryList<ElementRef>;

	mediaRecorder: any;

	ctx: any;

	videosLength: number = 0;

	tracks: Track[] = [];

	//Testing
	fps: number = 0;

	canvasElements: any[] = [];

	largestWidth: number = 0;
	largestHeight: number = 0;

	lStream: any[] = [];
	stream: any;
	exportStream: any;

	hasChanged: boolean = false;

	animationFrames: any[] = [];

	isFullscreen: boolean = false;
	videoPlaying: boolean = true;
	isRecording: boolean = false;

	currentTime: number = 0;
	duration: number = 0;

	socket: any;

	constructor(
		private changeDetector: ChangeDetectorRef,
		private ngZone: NgZone
	) {

		window.api.on("update-filters", (_, track: Track) => this.ngZone.run(() => {
			//Maps the filters to an array of filter property values
			this.tracks[track.id].filters = track!.filters!.filter(filter=> filter.enabled).map((filter: Filter, index: number) => {
				return {
					function: filter.function,
					properties: filter.properties ? filter.properties.map(prop => prop.value ?? prop.defaultValue) : [],
					type: filter.type
				}
			}) as FilterInstance[];
			this.changeDetector.detectChanges();
		}));

		window.api.on("toggle-recording", (_, isRecording) => this.ngZone.run(() => {
			this.isRecording = isRecording;
			if(isRecording) {
				this.socket.emit("start-recording");
				const recorderOptions = {
					mimeType: 'video/webm; codecs=vp9',
					videoBitsPerSecond: 200000 // 0.2 Mbit/sec.
				};
				//Captures the canvas and sends it to the server as new data is available
				const mediaStream: MediaStream = new MediaStream(this.finalCanvas.nativeElement.captureStream());
				this.mediaRecorder  = new MediaRecorder(this.stream, recorderOptions);
				this.mediaRecorder.onstop = (event) => {};
				this.mediaRecorder.ondataavailable = (event) => {
					if (event.data && event.data.size > 0) {
						this.socket.emit("recording-data", event.data);
					}
				};
				this.mediaRecorder.start(100); // 1000 - the number of milliseconds to record into each Blob
			}else {
				this.socket.emit("stop-recording");
				this.mediaRecorder.stop();
			}
		}));

		window.api.on("tracks", (_, tracks: Track[]) => this.ngZone.run(() => {
			//Gets all the tracks
			this.tracks = tracks;

			this.regeneratePreview();

			this.changeDetector.detectChanges();
		}));

		//Gets the localhost server port.
		//Used to send live video data to the server
		window.api.emit("get-server-port");
		window.api.on("server-port", (_:any, port: number) => {
			//Sets the socket connection to the server
			this.socket = io("http://localhost:" + port);
		});

		//KEEP THIS CODE FOR REFERENCE
		// if(typeof Worker !== "undefined") {
		// 	// Create a new
		// 	this.worker = new Worker(new URL("./video-preview.worker", import.meta.url));
		// 	this.worker.onmessage = ({ data }) => {
		// 		console.log(`page got message: ${data}`);
		// 	};
		// 	this.worker.postMessage("hello");
		// } else {
		// 	// Web Workers are not supported in this environment.
		// 	// You should add a fallback so that your program still executes correctly.
		// }
	}
	ngAfterViewInit() {
		this.finalRender();
		this.videos.changes.subscribe((change: QueryList<ElementRef>) => {
			//If the number of videos changes, regenerate the preview
			//This ensures that the preview isn't rerendered unnecessarily
			if(this.videosLength == change.length) {
				return;
			}
			this.videosLength = change.length;
			change.forEach((video, index) => {
				//Gets the video source from each video element
				this.setSource(this.tracks[index], video.nativeElement, index+1);
			});
			//Stops all live streams to improve performance
			this.lStream.forEach((stream) => {
				stream.getTracks()[0].stop();
			});
			//Resets the live stream array
			this.lStream = [];
		});
		this.hasChanged = true;
	}

	//page resize event
	@HostListener("window:resize", ["$event"])
	onResize() {
		//Resizes the canvas when the window is resized
		//to make sure the canvas is always the same size as the video
		//Loop through all the canvas elements and finds the largest one
		if(this.canvasElements.length) {
			let finalCanvas = this.finalCanvas.nativeElement;
			//Gets the dimensions of the largest video element using the videoDimensions function
			this.videos.forEach(video => {
				let dimensions = this.videoDimensions(video.nativeElement);
				if(dimensions[0] > this.largestWidth) {
					this.largestWidth = dimensions[0];
				}
				if(dimensions[1] > this.largestHeight) {
					this.largestHeight = dimensions[1];
				}
			});
			finalCanvas.width = this.largestWidth;
			finalCanvas.height = this.largestHeight;
		}
	}

	getVisibleTracks() {
		return this.tracks.filter((track) => track.isVisible);
	}

	toggleFullScreen() {
		this.isFullscreen = !this.isFullscreen;

		setTimeout(() => {
			// this.setCanvasDimensions();
		}, 100);
	}

	setCanvasDimensions(video: HTMLVideoElement, canvas: any) {
		//Sets the canvas" dimensions to the same as the video
		const parentWidth = canvas.parentNode.getBoundingClientRect().width;
		const parentHeight = canvas.parentNode.getBoundingClientRect().height;
		let [videoWidth, videoHeight] = this.videoDimensions(video);

		videoWidth = this.isFullscreen ? parentWidth : videoWidth;
		videoHeight = this.isFullscreen ? parentHeight : videoHeight;

		canvas.style.width = `${videoWidth}px`;
		canvas.style.height = `${videoHeight}px`;

		// canvas.style.top = (parentHeight / 2 - this.videoHeight / 2) + "px";
		// canvas.style.left = (parentWidth / 2 - this.videoWidth / 2) + "px";
	}

	//THIS CODE NEEDS TO BE REWRITTEN (probably)
	videoDimensions(video: HTMLVideoElement) {
		const videoRatio = video.videoWidth / video.videoHeight;
		let width = video.offsetWidth,
		height = video.offsetHeight;

		const videoElementRatio = width/height;
		if(videoElementRatio > videoRatio) {
			width = height * videoRatio;
		} else {
			height = width / videoRatio;
		}
		return [width, height];
	}

	regeneratePreview() {
		const nativeElement = this.replaceWithCanvas.nativeElement;
		this.canvasElements = [];

		//Removes all the canvas elements except the final render canvas
		document.querySelectorAll(".non-final-canvas").forEach(canvas => canvas.remove());

		this.tracks.forEach(() => {
			this.changeDetector.markForCheck();
		});
	}

	drawCanvas(video: HTMLVideoElement, track: Track, index: number) {
		//The element that the canvas will replace
		const nativeElement = this.replaceWithCanvas.nativeElement;
		let canvas;
		//Checks if the canvas has already been created
		try {
			canvas = fx.canvas();
			this.canvasElements.push(canvas);
		} catch (e) {
			console.log(e);
			return;
		}

		//Inserts the canvas into the DOM
		nativeElement.parentNode.insertBefore(canvas, nativeElement.firstChild);

		this.setCanvasDimensions(video, canvas);
		let imageFilters = new ImageFilters();

		//Creates a WebGL texture from the video element
		const texture = canvas.texture(video);
		const ifTexture = imageFilters.texture(video);

		let now = window.performance.now();
		let then = window.performance.now();
		let fpsInterval = 1000 / 30;
		let elapsedTime = 0;

		//Applies certain classes to the canvas
		canvas.classList.add("w-full");
		canvas.classList.add("absolute");
		canvas.classList.add("opacity-0");
		canvas.classList.add("non-final-canvas");

		let step = async () => {
			// console.time("draw");
			//Measure the time it takes to draw the canvas
			// let start = window.performance.now();

			now = window.performance.now();
			elapsedTime = now - then;

			if(elapsedTime > fpsInterval) {
				//Loads the contents of the video element into the texture
				texture.loadContentsOf(video);
				let draw = canvas.draw(texture);

				let length = 0;

				if(track.filters) {
					track.filters!.length - 1
				}

				//Applies the filters to the canvas
				track.filters?.forEach((filter: FilterInstance, index: number) => {
					//Applies the GLFX filters here
					if(filter.type === FilterLibrary.GLFX) {
						//Calls the filter function by name and applies the properties
						draw = draw[filter.function](...(filter.properties ?? []));
						
						//Draws the filters to the canvas if the next filter is not an ImageFilters filter
						if(track.filters![index + 1]?.type === FilterLibrary.IMAGE_FILTERS) {
							draw.update();
						}
					}else {
						const wasGLFXOrWasIndex0 = track.filters![index - 1]?.type === FilterLibrary.GLFX || index === 0;

						//previous filter was an ImageFilters filter
						if(wasGLFXOrWasIndex0) {
							let imageToDraw = index === 0 ? video : canvas;
							ifTexture.texture(imageToDraw);
						}

						imageFilters = imageFilters[filter.function](...(filter.properties ?? []));

						//Draws the filters to the visible canvas if the next filter is not an ImageFilters filter
						if(track.filters![index + 1]?.type === FilterLibrary.GLFX || index == length) {
							//Load the texture from the hidden canvas
							texture.loadContentsOf(imageFilters.getImageData());
							draw = canvas.draw(texture);
						}
					}
				});
				draw.update();
			}

			// this.fps = window.performance.now() - start;

			// console.timeEnd("draw");
			
			//Adds this animationFrame to the array so it can be cancelled later
			this.animationFrames[index] = window.requestAnimationFrame(step);
		};
		window.requestAnimationFrame(step);
	}

	finalRender() {
		let finalCanvas = this.finalCanvas.nativeElement;
		this.ctx = finalCanvas.getContext("2d");


		let step = async () => {
			//Loops through all the canvas elements and draws them to the final canvas
			if(this.hasChanged && this.canvasElements.length) {
				this.hasChanged = false;
				//Gets the dimensions of the largest video element using the videoDimensions function
				this.videos.forEach(video => {
					let dimensions = this.videoDimensions(video.nativeElement);
					if(dimensions[0] > this.largestWidth) {
						this.largestWidth = dimensions[0];
					}
					if(dimensions[1] > this.largestHeight) {
						this.largestHeight = dimensions[1];
					}
				});
				finalCanvas.width = this.largestWidth;
				finalCanvas.height = this.largestHeight;
			}
			this.canvasElements.forEach(canvas => {

				//Loops through all canvases and centers them on the final canvas
				//Needs to get rid of the split() and parseInt() and make it more efficient
				let width = parseInt(canvas.style.width.split("px")[0]);
				let height = parseInt(canvas.style.height.split("px")[0]);
				//position is center of largest canvas
				let x = (finalCanvas.width / 2) - (width / 2);
				let y = (finalCanvas.height / 2) - (height / 2);
				
				this.ctx.drawImage(canvas, x, y, width, height);
			});
			window.requestAnimationFrame(step);
		}

		window.requestAnimationFrame(step);
		this.stream = finalCanvas.captureStream();
	}

	setSource(track: Track, video: HTMLVideoElement, index: number) {
		let type = track.type;
		let source = track?.source;

		//Cancels all the previous animation calls
		this.animationFrames.forEach((frame) => {
			window.cancelAnimationFrame(frame);
		});

		//Checks if the source is a video, webcam or desktop capture
		if(type === TrackType.WEBCAM) {
			//accesses the webcam
			navigator.mediaDevices.getUserMedia({ video: true })
			.then(stream => {
				//The video preview element src
				video.srcObject = stream;
				this.lStream.push(stream);

				this.playPreview(video, track, index);
			});
		}else if (type === TrackType.SCREEN_CAPTURE) {
			//Gets the list of desktop capture options
			window.api.emit("get-stream");
			window.api.on("stream", (_: any, stream: any[]) => this.ngZone.run(() => {
				//Initiates the desktop capture and plays it
				navigator.mediaDevices.getUserMedia({
					audio: false,
					video: {
						mandatory: {
							chromeMediaSource: "desktop",
							chromeMediaSourceId: stream.find(({id}) => id === source.sourceId).id, //The id of the desktop capture
							minWidth: 1280,
							maxWidth: 1280,
							minHeight: 720,
							maxHeight: 720,
						}
					} as MediaTrackConstraints,
				}).then((stream) => {
					//The video preview element src
					video.srcObject = stream;
					this.lStream.push(stream);

					this.playPreview(video, track, index);
				});
			}));
		}else if(type === TrackType.VIDEO) {
			//Sets the video src = to the video in assets folder

			this.changeDetector.markForCheck();
			video.src = "/assets/video.mp4";
			this.playPreview(video, track, index);
		}
	}

	//This starts playing the preview so that the canvas can be drawn
	playPreview(video: HTMLVideoElement, track: Track, index: number) {
		this.changeDetector.detectChanges();

		video.onloadedmetadata = () => {
			//Once the video is loaded, the video is played and the filters canvas is created
			video.play();


			//Gets the max video time
			this.duration = video.duration;

			//Creates and draws the canvas corresponding to the video
			this.drawCanvas(video, track, index);
		};

		video.ontimeupdate = () => {
			//Updates the time of the video
			this.currentTime = video.currentTime;
			this.changeDetector.detectChanges();
		}
	}

	playPauseVideo() {
		//Plays or pauses the video
		// this.videoNativeElement.paused ? this.videoNativeElement.play() : this.videoNativeElement.pause();
		// this.videoPlaying = !this.videoNativeElement.paused;
	}

	seekVideo(time: number) {
		//Seeks the video to the time
		// this.videoNativeElement.currentTime = time;
	}
}
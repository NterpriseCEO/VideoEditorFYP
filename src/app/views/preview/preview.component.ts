import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, NgZone, QueryList, ViewChild, ViewChildren } from "@angular/core";
import { FilterLibrary, TrackType } from "../../utils/constants";
import { ClipInstance, Filter, FilterInstance, Track } from "../../utils/interfaces";
import { ImageFilters } from "src/app/utils/ImageFilters";
import { io } from "socket.io-client";
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
	@ViewChild("previewVideo") previewVideo!: ElementRef;
	@ViewChildren("videos") videos!: QueryList<ElementRef>;

	mediaRecorder: any;

	ctx: any;

	videosLength: number = 0;

	tracks: Track[] = [];
	currentClip: number[] = [];

	//Testing
	fps: number = 0;

	canvasElements: any[] = [];

	largestWidth: number = 0;
	largestHeight: number = 0;

	lStream: any[] = [];
	stream: any;

	animationFrames: any[] = [];
	timeAnimationFrames: number[] = [];

	isFullscreen: boolean = false;
	videoPlaying: boolean = false;
	isRecording: boolean = false;

	audioCtx: any;
	audioDestination: any;

	startTime: number = 0;
	currentTime: number = 0;
	masterTime: number = 0;
	duration: number = 0;

	socket: any;

	previewSrc: string = "";

	recorderOptions: any = {
		mimeType: "video/webm;codecs=vp9",
		videoBitsPerSecond: 500000
	};

	constructor(
		private changeDetector: ChangeDetectorRef,
		private ngZone: NgZone
	) {

		this.videoPlayback();

		this.listenForEvents();

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
		//Gets the localhost server port.
		//Used to send live video data to the server
		window.api.emit("get-server-port");
		window.api.once("server-port", (_:any, port: number) => {
			//Sets the socket connection to the server
			console.log("Server port: " + port);
			
			this.socket = io("http://localhost:" + port);
		});

		this.initAudio();
		this.finalRender();
		this.videos.changes.subscribe((change: QueryList<ElementRef>) => {
			//If the number of videos changes, regenerate the preview
			//This ensures that the previous tracks aren't rerendered unnecessarily

			if(this.videosLength == change.length) {
				return;
			}
			this.timeAnimationFrames.forEach((frame) => {
				window.cancelAnimationFrame(frame);
			});

			this.deleteCanvases();
			this.initAudio();
			//Remove all audio tracks from the stream if they
			//were removed from the preview
			//All new audio tracks will fail otherwise
			this.stream.getAudioTracks().forEach((track) => {
				track.stop();
				this.stream.removeTrack(track);
			});
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
	}

	listenForEvents() {
		window.api.on("update-filters", (_, track: Track) => this.ngZone.run(() => {
			//Maps the filters to an array of filter property values
			this.tracks.find(({id}) => id === track.id)!.filters =
				track!.filters?.filter(filter=> filter.enabled).map((filter: Filter, index: number) => {
					return {
						function: filter.function,
						properties: filter.properties ? filter.properties.map(prop => isNaN(prop) ? (prop.value ?? prop.defaultValue) : prop) : [],
						type: filter.type
					}
				}) as FilterInstance[];
			this.changeDetector.detectChanges();
		}));

		window.api.on("toggle-recording", (_, data) => this.ngZone.run(() => {
			this.isRecording = data.isRecording;
			if(this.isRecording) {
				//Finds the track matching data.drack
				let id = this.tracks.findIndex(track => track.id === data.track.id);

				let video = this.videos.toArray()[id].nativeElement;
				this.startRecording(video.captureStream(), true);
			}else {
				this.mediaRecorder.stop();
				this.socket.emit("stop-recording");
			}
		}));

		window.api.on("toggle-recording-all", () => this.ngZone.run(() => {
			this.isRecording = !this.isRecording;
			if(this.isRecording) {
				this.startRecording(this.stream); 
			}else {
				this.mediaRecorder.stop();
				this.socket.emit("stop-recording");
			}
		}));

		window.api.on("tracks", (_, tracks: Track[]) => this.ngZone.run(() => {
			//Gets all the new tracks
			this.tracks = [...tracks];

			this.rewindToStart();
		}));

		window.api.on("update-track-clips", (_, track: Track) => this.ngZone.run(() => {
			this.tracks[track.id].clips = track.clips;

			this.rewindToStart();
		}));

		window.api.on("set-selected-clip-in-preview", (_, filePath) => this.ngZone.run(() => {
			this.previewSrc = "local-resource://getMediaFile/"+filePath;
			this.previewVideo.nativeElement.startTime = 0;
			this.changeDetector.detectChanges();
		}));

		window.api.on("toggle-playing", () => this.ngZone.run(() => {
			this.playPauseVideo(false);
		}));
		window.api.on("rewind-to-start", () => this.ngZone.run(() =>{
			this.rewindToStart();
		}));
	}

	startRecording(stream, addToTrack: boolean = false) {
		// if(captureAudioTracks) {
		// 	this.videos.toArray().forEach((video) => {
		// 		console.log("Adding audio track");
		// 		this.createAudioTrack(video.nativeElement);
		// 	});
		// }

		this.socket.emit("start-recording", {recordToProjectFolder: true, addToTrack: addToTrack});
		//Captures the canvas or video and sends it to the server as new data is available
		this.mediaRecorder = new MediaRecorder(stream, this.recorderOptions);
		this.mediaRecorder.onstop = (event) => {};
		this.mediaRecorder.ondataavailable = (event) => {
			if (event.data && event.data.size > 0) {
				this.socket.emit("recording-data", event.data);
			}
		};
		this.mediaRecorder.start(100); // 1000 - the number of milliseconds to record into each Blob
	}

	rewindToStart() {
		//Resets the preview
		//Will need to remember the current position of the preview
		//in a future revision
		this.masterTime = 0;
		this.startTime = 0;
		this.currentTime = 0;
		this.duration = 0;

		this.videoPlaying = false;

		this.currentClip = [];
		this.calculateDuration();

		this.videos.toArray().forEach((video, i) => {
			//Pauses and rewinds all videos that are not live streams
			if(!video.nativeElement.srcObject) {
				video.nativeElement.pause();
			}
			video.nativeElement.currentTime = 0;
		});

		this.changeDetector.detectChanges();
	}

	getVisibleTracks() {
		return this.tracks.filter((track) => track.isVisible);
	}

	calculateDuration() {
		//find the duration from start to the end of the last clip
		this.tracks.forEach(track => {
			//gets the duration of the last clip
			if(!track.clips) {
				return;
			}
			let lastClip = track.clips[track.clips.length - 1];

			if(!lastClip) {
				return;
			}

			if(lastClip.startTime + lastClip.duration > this.duration) {
				this.duration = lastClip.startTime + lastClip.duration;
			}
		});
	}

	toggleFullscreen() {
		this.isFullscreen = !this.isFullscreen
		//set the final canvas to be vertically centered
		this.finalCanvas.nativeElement.style.top = "50%";
		this.finalCanvas.nativeElement.style.transform = "translateY(-50%)";
	}

	videoPlayback() {
		this.tracks.forEach((track: Track, index) => {
			this.startTime = window.performance.now() / 1000;
			let elapsedTime = 0;

			let video;

			if(this.videos.toArray()[index]) {
				video = this.videos.toArray()[index].nativeElement;
			}

			if(!track.isVisible) {
				return;
			}

			video.src = "";
			video.currentTime = 0;

			let step = async () => {
				if(this.videoPlaying) {
					let currentTime = window.performance.now() / 1000;
					this.masterTime = currentTime - this.startTime;
					
					this.checkIfClipNeedsChanging(video, track, index);
					
					if(this.masterTime >= this.duration) {
						this.videoPlaying = false;
						this.masterTime = 0;
					}
				}
				this.changeDetector.markForCheck();
				this.timeAnimationFrames[index] = requestAnimationFrame(step);
			}
			requestAnimationFrame(step);
		});
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

	deleteCanvases() {
		const nativeElement = this.replaceWithCanvas.nativeElement;
		this.canvasElements = [];

		//Removes all the canvas elements except the final render canvas
		document.querySelectorAll(".non-final-canvas").forEach(canvas => canvas.remove());
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

		canvas.width = 1920;
		canvas.height = 1080;
		
		let imageFilters = new ImageFilters();

		//Creates a WebGL texture from the video element
		let texture;
		let ifTexture;

		let now = window.performance.now();
		let then = window.performance.now();
		let fpsInterval = 1000 / 30;
		let elapsedTime = 0;

		//Applies certain classes to the canvas
		canvas.classList.add("w-full");
		canvas.classList.add("h-full");
		canvas.classList.add("absolute");
		canvas.classList.add("opacity-0");
		canvas.classList.add("non-final-canvas");

		let step = async () => {
			// console.time("draw");
			//Measure the time it takes to draw the canvas
			// let start = window.performance.now();

			if(video.paused || video.currentTime === 0) {
				this.animationFrames[index] = window.requestAnimationFrame(step);
				return;
			}

			if(!texture) {
				texture = canvas.texture(video);
			}

			if(!ifTexture) {
				ifTexture = imageFilters.texture(video);
			}

			now = window.performance.now();
			elapsedTime = now - then;

			if(elapsedTime > fpsInterval) {
				then = now;

				//Loads the contents of the video element into the texture
				try {
					texture.loadContentsOf(video);
				}catch(e) {
					console.log(e);
				}

				let draw;
				try {
					draw = canvas.draw(texture);
				}catch(e) {
					console.log(e);
					this.animationFrames[index] = window.requestAnimationFrame(step);
					return;
				}

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
			//Clears the canvas
			this.ctx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
			//Draws the background
			this.ctx.fillStyle = "black";
			this.ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

			let videos = this.videos.toArray();

			//Loops through all the canvas elements and draws them to the final canvas
			//Filter out all canvases in which the corresponding video is paused
			this.canvasElements.forEach((canvas: HTMLCanvasElement, index: number) => {
				if(videos[index] && videos[index].nativeElement.paused && this.videoPlaying) {
					return;
				}

				if(canvas.width === 0 || canvas.height === 0) {
					return;
				}
				//Loops through all canvases and centers them on the final canvas
				//position is center of largest canvas
				let x = (finalCanvas.width / 2) - (canvas.width / 2);
				let y = (finalCanvas.height / 2) - (canvas.height / 2);

				this.ctx.drawImage(canvas, x, y, canvas.width, canvas.height);
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
			navigator.mediaDevices.getUserMedia({ video: true, audio: true })
			.then(stream => {
				//The video preview element src
				video.srcObject = stream;				

				this.stream.addTrack(stream.getAudioTracks()[0]);

				this.lStream.push(stream);

				this.playPreview(video, track, index);
			});
		}else if (type === TrackType.SCREEN_CAPTURE) {
			//Gets the list of desktop capture options
			window.api.emit("get-stream");
			window.api.on("stream", (_: any, stream: any[]) => this.ngZone.run(() => {
				//Initiates the desktop capture and plays it
				navigator.mediaDevices.getUserMedia({
					// audio: true,
					//Doesn't work with audio: Terminating renderer for bad IPC message, reason 263
					//Need to look into this later
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
			this.changeDetector.markForCheck();
			this.playPreview(video, track, index);
		}
	}

	//This starts playing the preview so that the canvas can be drawn
	playPreview(video: HTMLVideoElement, track: Track, index: number) {
		this.changeDetector.detectChanges();

		if(track.type !== TrackType.VIDEO) {
			video.onloadedmetadata = () => {
				//Calls once the the video metadata has loaded
				video.play();
			};
		}

		this.createAudioTrack(video);

		//Creates and draws the canvas corresponding to the video
		this.drawCanvas(video, track, index);

		video.ontimeupdate = () => {
			//Updates the time of the video
			this.currentTime = video.currentTime;
			this.changeDetector.detectChanges();
		}
	}

	createAudioTrack(video: HTMLVideoElement) {
		try {
			//Creates an audio track from the video
			let sourceNode = this.audioCtx.createMediaElementSource(video);
			// Connect the video element's output to the stream
			sourceNode.connect(this.audioDestination);
			sourceNode.connect(this.audioCtx.destination);
			this.stream.addTrack(this.audioDestination.stream.getAudioTracks()[0]);
		} catch(e) {
			console.log(e);
		}
	}

	initAudio() {
		this.audioCtx = new AudioContext();
		// This will be used to merge audio tracks from multiple videos
		this.audioDestination = this.audioCtx.createMediaStreamDestination();
	}

	playPauseVideo(updateInMainEditor: boolean = true) {
		//Toggles play pause on the preview
		// this.videoNativeElement.paused ? this.videoNativeElement.play() : this.videoNativeElement.pause();
		this.videoPlaying = !this.videoPlaying;

		this.videos.toArray().forEach((video, i) => {
			video.nativeElement.paused ? video.nativeElement.play() : video.nativeElement.pause();
		});

		if(this.videoPlaying) {
			if(this.masterTime === 0) {
				//Resets everything when a user plays the video
				//after it it has played all the way through
				//This will basically restart the video from the beginning
				this.timeAnimationFrames.forEach((frame) => {
					window.cancelAnimationFrame(frame);
				});

				this.timeAnimationFrames = [];

				this.currentClip = [];

				this.startTime = window.performance.now() / 1000;
				this.videoPlayback();
			}else {
				this.startTime = window.performance.now() / 1000 - this.masterTime;
			}
		}

		if(updateInMainEditor) {
			//Sends the signal to update the play pause button in the main editor
			//This is only done if the play/pause event was triggered in the preview
			window.api.emit("update-play-video-button", this.videoPlaying);
		}
	}

	seekVideo(event: any) {
		//Seeks the video to the time
		this.getClipAtTime(event.value);
	}

	getClipAtTime(time: number) {
		//Gets all the clips that overlap a given time
		let videos = this.videos.toArray();
		this.tracks.forEach((track: Track, i) => {
			if(!track.clips || !track.isVisible) {
				return;
			}
			track.clips.forEach((clip: ClipInstance, j) => {
				if(this.masterTime >= clip.startTime && time < clip.startTime + clip.duration) {
					let video = videos[i].nativeElement;
					if(video.src != "local-resource://getMediaFile/"+clip.location) {
						video.src = "local-resource://getMediaFile/"+clip.location;
						this.changeDetector.detectChanges();
					}
					//Sets the current clip to j if
					//the clip is to be played
					this.currentClip[i] = j;
					//Sets the video's current time if to masterTime-the start time of the clip
					video.currentTime = time - clip.startTime;
					this.masterTime = time;
					// videos[i].nativeElement.play();
					return
				}
			});
		});
	}

	checkIfClipNeedsChanging(video: HTMLVideoElement, track: Track, index: number) {
		//Checks if the clip needs to be changed
		if(!track.clips) {
			return;
		}

		if(!this.currentClip[index]) {
			this.currentClip[index] = 0;
		}

		let clips = track.clips;
		let clip = clips[this.currentClip[index]];

		if(!clip) {
			return;
		}

		//convert this.startTime to seconds

		if(this.masterTime >= clip.startTime && this.masterTime < clip.startTime + clip.duration) {
			if(video.src != "local-resource://getMediaFile/"+clip.location) {
				if(track.type !== TrackType.VIDEO) {
					video.srcObject = null;
				}
				video.src = "local-resource://getMediaFile/"+clip.location;
				this.changeDetector.detectChanges();
				video.currentTime = clip.in;				
				video.play();
				// this.currentClip[index]++;
			}
		}else if(this.masterTime >= clip.startTime + clip.duration) {
			video.src = "";
			this.currentClip[index]++;

			if(track.type !== TrackType.VIDEO) {
				this.setSource(track, video, index);
			}
		}
	}

	//Converts this.masterTime to hrs, mins, secs
	convertTime(time: number) {
		let hours = Math.floor(time / 3600);
		let minutes = Math.floor((time % 3600) / 60);
		let seconds = Math.floor(time % 60);

		let hoursString = hours < 10 ? "0" + hours : hours;
		let minutesString = minutes < 10 ? "0" + minutes : minutes;
		let secondsString = seconds < 10 ? "0" + seconds : seconds;

		return hoursString + ":" + minutesString + ":" + secondsString;
	}
}
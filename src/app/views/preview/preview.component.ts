import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnDestroy, OnInit, Renderer2, ViewChild } from "@angular/core";
import { io } from "socket.io-client";
import { fromEvent, Observable, Subscription } from "rxjs";
import { Title } from "@angular/platform-browser";

import { FilterLibrary, TrackType } from "../../utils/constants";
import { ClipInstance, Filter, FilterInstance, Track } from "../../utils/interfaces";
import { ImageFilters } from "src/app/utils/ImageFilters";
import { deepCompare } from "src/app/utils/utils";
// import * as GPU from "../../utils/gpu.js";
// const GPU = require("../../utils/gpu.js");

import * as fx from "glfx-es6";

@Component({
	selector: "video-preview",
	templateUrl: "./preview.component.html",
	styleUrls: ["./preview.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class PreviewComponent implements OnInit, AfterViewInit, OnDestroy {

	@ViewChild("replaceWithCanvas") replaceWithCanvas!: ElementRef;
	@ViewChild("finalCanvas") finalCanvas!: ElementRef;
	@ViewChild("previewVideo") previewVideo!: ElementRef;
	@ViewChild("previewImage") previewImage!: ElementRef;
	@ViewChild("previewContainer") previewContainer!: ElementRef;
	@ViewChild("canvasContainer") canvasContainer!: ElementRef;
	@ViewChild("scaler") scaler!: ElementRef;

	mediaElements: any[] = [];

	mediaRecorder: any;

	ctx: any;

	tracks: Track[] = [];
	trackIdsList: number[] = [];
	previousTracks: Track[] = [];
	selectedTrackIndex: number = -1;
	currentClip: number[] = [];
	trackVisibilityAtGivenTime: any[] = [];
	selectedClipIndex: number = -1;

	//Testing
	fps: number = 0;

	canvasElements: any[] = [];
	textures: any[] = [];

	audioTracks: any[] = [];
	stream: any;

	animationFrames: any[] = [];
	timeAnimationFrames: number[] = [];

	isFullscreen: boolean = false;
	mediaPlaying: boolean = false;
	isRecording: boolean = false;

	audioCtx: any;
	audioDestination: any;

	startTime: number = 0;
	currentTime: number = 0;
	masterTime: number = 0;
	duration: number = 0;

	socket: any;

	previewSrc: string | null = null;
	previewStream: any = null;

	scalerWidth: number = 0;
	scalerHeight: number = 0;
	scalerRatio: number = 0;
	isScaling: boolean = false;

	updateHistoryTimeout: any;

	recorderOptions: any = {
		mimeType: "video/webm;codecs=vp9",
		videoBitsPerSecond: 500000
	};

	resizeObservable!: Observable<Event>;
	resizeSubscription!: Subscription;

	isMouseDown: boolean = false;
	selectedTrackType: TrackType = TrackType.VIDEO;

	constructor(
		private changeDetector: ChangeDetectorRef,
		private ngZone: NgZone,
		private renderer: Renderer2,
		private titleService: Title
	) {}

	ngOnInit() {
		this.titleService.setTitle("GraphX - Preview");

		this.mediaPlayback();

		this.listenForEvents();

		//KEEP THIS CODE FOR REFERENCE
		// if(typeof Worker !== "undefined") {
		// 	// Create a new
		// 	this.worker = new Worker(new URL("./video-preview.worker", import.meta.url));
		// 	this.worker.onmessage = ({ data }) => {
		// 		console.log(`page got message: ${data}`);
		// 	};
		// 	this.worker.postMessage("hello");
		// }else {
		// 	// Web Workers are not supported in this environment.
		// 	// You should add a fallback so that your program still executes correctly.
		// }
	}

	ngAfterViewInit() {
		//Window resize event
		this.resizeObservable = fromEvent(window, "resize")
		this.resizeSubscription = this.resizeObservable.subscribe(event => {
			let track = this.tracks[this.selectedTrackIndex];
			if(track) {
				this.isScaling = true;
				this.calculateScalerSize(track);
				this.isScaling = false;
			}
		})
		//Gets the localhost server port.
		//Used to send live media data to the server
		window.api.emit("get-server-port");
		window.api.once("server-port", (_: any, port: number) => {
			//Sets the socket connection to the server
			this.socket = io("http://localhost:" + port);
		});

		this.initAudio();
		this.finalRender();

		new ResizeObserver((mutations) => {
			let dimensions = mutations[0].contentRect;
			let track = this.tracks[this.selectedTrackIndex];

			if(!this.isScaling) {
				clearTimeout(this.updateHistoryTimeout);

				//Calculates the ratio in size between the canvas container and the actual output dimensions
				let canvasContainerToCanvasRatio = 1920 / this.canvasContainer.nativeElement.clientWidth;
				this.scalerWidth = this.canvasContainer.nativeElement.clientWidth / canvasContainerToCanvasRatio;
				this.scalerHeight = (dimensions.width / this.scalerRatio);
				let selectedClip;

				try {
					selectedClip = track.clips![this.selectedClipIndex];

					selectedClip.width = dimensions.width * canvasContainerToCanvasRatio;
					selectedClip.height = this.scalerHeight * canvasContainerToCanvasRatio;
				}catch(e) {
					if(track) {
						track.width = dimensions.width * canvasContainerToCanvasRatio;
						track.height = this.scalerHeight * canvasContainerToCanvasRatio;
					}
				}
				this.scaler.nativeElement.style.height = this.scalerHeight + "px";

				if(this.isMouseDown) {
					this.updateHistoryTimeout = setTimeout(() => {
						window.api.emit("update-track-in-history", track);
						clearTimeout(this.updateHistoryTimeout);
					}, 500);
				}else {
					clearTimeout(this.updateHistoryTimeout);
				}

				this.changeDetector.detectChanges();
			}
		}).observe(this.scaler.nativeElement);

		this.previewVideo.nativeElement.onloadeddata = () => {
			this.initScaler(this.previewVideo.nativeElement);
		}

		this.previewImage.nativeElement.onload = () => {
			this.initScaler(this.previewImage.nativeElement);
		}
	}

	ngOnDestroy() {
		this.resizeSubscription.unsubscribe();
	}

	initScaler(element) {
		let track = this.tracks![this.selectedTrackIndex];
		element.startTime = 0;
		this.isScaling = true;

		this.calculateScalerSize(track);

		try {
			let selectedClip = track.clips![this.selectedClipIndex];
			selectedClip.width = selectedClip.width ?? element.naturalWidth ?? element.width;
			selectedClip.height = selectedClip.height ?? element.naturalHeight ?? element.height;
		} catch (e) {
			//Tries to set the width and height of the track if there is no clip selected
			track.width = track.width ?? element.width;
			track.height = track.height ?? element.height;
		}

		this.isScaling = false;
		this.changeDetector.detectChanges();
	}

	calculateScalerSize(track: Track) {
		let canvasContainerToCanvasRatio;
		try {
			let selectedClip = track.clips![this.selectedClipIndex];
			canvasContainerToCanvasRatio = 1920 / (selectedClip?.width ?? track.width ?? this.canvasElements[this.selectedTrackIndex].width);
		}catch(e) {
			canvasContainerToCanvasRatio = 1920 / (track.width ?? this.canvasElements[this.selectedTrackIndex].width);
		}

		this.scalerWidth = this.canvasContainer.nativeElement.clientWidth / canvasContainerToCanvasRatio;
		//Calultes width to height ratio of the preview video
		const width = track.type === TrackType.IMAGE ? "width" : "videoWidth";
		const height = track.type === TrackType.IMAGE ? "height" : "videoHeight";
		const element = track.type === TrackType.IMAGE ? this.previewImage : this.previewVideo;
		this.scalerRatio = element.nativeElement[width] / element.nativeElement[height];
		this.scaler.nativeElement.style.width = this.scalerWidth + "px";
		this.scalerHeight = this.scalerWidth / this.scalerRatio;

		this.scaler.nativeElement.style.height = this.scalerHeight + "px";
	}

	listenForEvents() {
		window.api.on("update-filters", (_, track: Track) => this.ngZone.run(() => {
			this.updateTrackFilters(track);
		}));

		window.api.on("update-layer-filter", (_, track: Track) => this.ngZone.run(() => {
			this.tracks.find(({ id }) => id === track.id)!.layerFilter = track.layerFilter;
			this.changeDetector.detectChanges();
		}));

		window.api.on("toggle-recording", (_, data) => this.ngZone.run(() => {
			this.isRecording = data.isRecording;
			if(this.isRecording) {
				//Finds the track matching data.track
				let id = this.tracks.findIndex(track => track.id === data.track.id);
				this.startRecording(this.mediaElements[id].captureStream(), true);
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

		window.api.on("tracks", (_, data: any) => this.ngZone.run(() => {
			if(data.resetPreview) {
				// reset the master time
				this.rewindToStart();
			}

			this.tracks = [...data.tracks.filter(track => track.isVisible)];
			this.tracks.forEach((track) => this.updateTrackFilters(track));
			this.calculateDuration();
			this.generateMediaElements();
		}));

		window.api.on("mute-track", (_, track: Track) => this.ngZone.run(() => {
			//Finds the track with the matching id
			const id = this.tracks.findIndex(({ id }) => id === track.id);

			//Mutes/unmutes the video if it is a video track
			//prevents live streams from being unmuted
			//which causes audio feedback
			if(track.type === TrackType.VIDEO) {
				this.mediaElements[id].muted = track.muted;
			}
			this.tracks[id].muted = track.muted;

			//Mutes/unmutes the audio track
			//if one exists
			//This is for MediaStream tracks i.e. webcam and screen capture
			if(this.audioTracks[id]) {
				this.audioTracks[id].enabled = !track.muted;
			}

			this.changeDetector.detectChanges();
		}));

		window.api.on("update-track-clips", (_, track: Track) => this.ngZone.run(() => {
			//find the track with the matching id
			this.tracks.find(({ id }) => id === track.id)!.clips = track.clips;
			this.calculateDuration();

			this.getClipAtTime(this.masterTime);
		}));

		window.api.on("set-selected-clip-in-preview", (_, data) => this.ngZone.run(() => {
			let track = this.tracks![data.trackIndex];
			this.selectedTrackType = track.type;
			//Checks if the selected clip / track is the same as the one that is already selected
			if((this.selectedTrackIndex === data.trackIndex && this.selectedClipIndex === data.clipIndex)) {
				return;
			}
			this.setPreviewSource("local-resource://getMediaFile/" + data.location, track);
			this.selectedTrackIndex = data.trackIndex;
			this.selectedClipIndex = data.clipIndex;
			this.calculateScalerSize(track);
		}));

		window.api.on("toggle-playing", () => this.ngZone.run(() => {
			this.playPauseMedia(false);
		}));
		window.api.on("rewind-to-start", () => this.ngZone.run(() => {
			this.rewindToStart();
		}));
	}

	updateTrackFilters(track: Track) {
		//Maps the filters to an array of filter property values
		let matchingTrack = this.tracks.find(({ id }) => id === track.id);

		if (!matchingTrack!.filters) {
			matchingTrack!.filters = [];
		}
		matchingTrack!.filters = track!.filters?.filter(filter => filter.enabled).map((filter: FilterInstance, index: number) => {
			return {
				function: filter.function,
				//Mmaps the properties (an object with keys) to an array of key values
				properties: filter.properties ? Object.keys(filter.properties).map(key => filter.properties[key]) : [],
				type: filter.type
			}
		}) as FilterInstance[];
		this.changeDetector.detectChanges();
	}

	generateMediaElements() {
		let index = 0;


		let tracks = JSON.parse(JSON.stringify(this.tracks));
		let previousTracks = JSON.parse(JSON.stringify(this.previousTracks));

		//Finds all tracks in previousTracks that are not in tracks
		let removedTracks = previousTracks.filter((track) => !tracks.some(t => deepCompare(t, track)));

		removedTracks.forEach((track) => {
			//TODO (maybe): Remove the audio track from the stream at the index
			const id = this.trackIdsList.findIndex(id => id === track.id);
			// if(this.audioTracks[id]) {
			// 	this.audioTracks[id].stop();
			// 	this.stream.removeTrack(this.audioTracks[id]);
			// }

			//Removes each media element from the preview container
			this.renderer.removeChild(this.previewContainer.nativeElement, this.mediaElements[id]);
			delete this.mediaElements[id];
			delete this.audioTracks[id];
			//And cancels the animation frames and time animation frames
			window.cancelAnimationFrame(this.timeAnimationFrames[id]);
			window.cancelAnimationFrame(this.animationFrames[id]);
			this.animationFrames[id] = null;
			//Removes the canvases as well
			if(this.canvasElements[id]) {
				this.renderer.removeChild(this.canvasContainer.nativeElement, this.canvasElements[id]);
			}
			delete this.canvasElements[id];
			this.textures[id]?.destroy();
			this.textures[id] = null;
		});

		this.tracks.forEach((track) => {
			//Checks if the track is in the previousTracks array
			const matchingTracks = this.previousTracks.filter(t => deepCompare(t, track));
			if(matchingTracks.length === 1) {
				index++;
				return;
			}

			let trackType = track.type.toLocaleLowerCase();
			trackType = trackType === "audio" ? "audio"
				: trackType === "image" ? "img"
				: "video";

			let mediaElement = document.createElement(trackType) as HTMLMediaElement;
			mediaElement.id = "media-" + index;
			mediaElement.classList.add("media", "absolute", "opacity-0");
			// If an image is being displayed, don't add h-full
			// as it will stretch the image
			if(track.type !== TrackType.IMAGE) {
				mediaElement.classList.add("h-full");
			}
			//Appends the media element after #previewVideo
			this.renderer.appendChild(this.previewContainer.nativeElement, mediaElement);
			this.setSource(track, mediaElement, index);

			//Adds the media element to the mediaElements array
			if(!!this.mediaElements[index]) {
				this.mediaElements.splice(index, 0, mediaElement);
				for (let i = index + 1; i < this.mediaElements.length; i++) {
					if(this.mediaElements[i]) {
						this.mediaElements[i].id = "media-" + i;
					}
				}
			}else {
				this.mediaElements[index] = mediaElement;
			}
			this.trackIdsList[index] = track.id;

			index++;
		});

		this.previousTracks = JSON.parse(JSON.stringify([...this.tracks]));
	}

	startRecording(stream, addToTrack: boolean = false) {
		this.socket.emit("start-recording", { recordToProjectFolder: true, addToTrack: addToTrack });
		//Captures the canvas or video and sends it to the server as new data is available
		this.mediaRecorder = new MediaRecorder(new MediaStream([
			stream.getVideoTracks()[0],
			this.audioDestination.stream.getAudioTracks()[0]
		]), this.recorderOptions);

		this.mediaRecorder.onstop = (event) => {
			console.log("recorder stopped", event);
		};
		this.mediaRecorder.error = (event) => {
			console.log("error", event);
		};
		this.mediaRecorder.ondataavailable = (event) => {
			if(event.data && event.data.size > 0) {
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

		this.mediaPlaying = false;

		this.currentClip = [];
		this.trackVisibilityAtGivenTime = [];
		this.calculateDuration();

		this.mediaElements.forEach((mediaElement, i) => {
			//Pauses and rewinds all media elements that are not live streams
			if(!mediaElement?.srcObject && this.tracks[i].type !== TrackType.IMAGE) {
				mediaElement?.pause();
			}
			mediaElement.currentTime = 0;
		});

		this.changeDetector.detectChanges();
	}

	getVisibleTracks() {
		return this.tracks.filter((track) => track.isVisible);
	}

	calculateDuration() {
		this.duration = 0;
		//Find the duration from start to the end of the last clip
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

	mediaPlayback() {
		this.startTime = window.performance.now() - this.masterTime;
		this.tracks.forEach((track: Track, index) => {
			let elapsedTime = 0;

			let media;

			if(this.mediaElements[index]) {
				media = this.mediaElements[index];
			}

			if(!track.isVisible) {
				return;
			}

			media.src = "";
			media.removeAttribute("src");
			media.currentTime = 0;

			let step = async () => {
				if(this.mediaPlaying) {
					let currentTime = window.performance.now();
					this.masterTime = currentTime - this.startTime;

					this.checkIfClipNeedsChanging(media, track, index);

					if(this.masterTime >= this.duration) {
						this.mediaPlaying = false;
						this.masterTime = 0;
						window.api.emit("update-play-video-button", { isPlaying: false, isFinishedPlaying: true });
					}
				}
				this.changeDetector.markForCheck();
				this.timeAnimationFrames[index] = requestAnimationFrame(step);
			}
			requestAnimationFrame(step);
		});
	}

	//Not even used anymore but is incredibly useful
	videoDimensions(video: HTMLVideoElement) {
		const videoRatio = video.videoWidth / video.videoHeight;
		let width = video.offsetWidth,
			height = video.offsetHeight;

		const videoElementRatio = width / height;
		if(videoElementRatio > videoRatio) {
			width = height * videoRatio;
		}else {
			height = width / videoRatio;
		}
		return [width, height];
	}

	deleteCanvases() {
		const nativeElement = this.replaceWithCanvas.nativeElement;

		//Removes all the canvas elements except the final render canvas
		document.querySelectorAll(".non-final-canvas").forEach((canvas) => {
			this.renderer.removeChild(this.canvasContainer, canvas);
		});
		this.canvasElements = [];
	}

	deleteMediaElements() {
		this.mediaElements.forEach((mediaElement) => {
			this.renderer.removeChild(this.previewContainer.nativeElement, mediaElement);
		});
		this.mediaElements = [];
	}

	drawCanvas(video: HTMLVideoElement, track: Track, index: number) {
		//The element that the canvas will replace
		const nativeElement = this.replaceWithCanvas.nativeElement;
		let canvas;
		//Checks if the canvas has already been created
		try {
			canvas = fx.canvas();
			if(this.canvasElements[index]) {
				this.canvasElements.splice(index, 0, canvas);
			}else {
				this.canvasElements[index] = canvas;
			}
		} catch(e) {
			console.log(e);
			return;
		}

		const insertBefore = this.canvasElements[index - 1] || nativeElement.parentNode.firstChild;

		insertBefore.parentNode.insertBefore(canvas, insertBefore.nextSibling);

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
		canvas.classList.add("absolute", "opacity-0", "non-final-canvas", "canvas-" + index);

		let step = async () => {
			// console.time("draw");
			//Measure the time it takes to draw the canvas
			// let start = window.performance.now();

			// If it's an image track, it is ignored
			// since these properties are not available anyway
			if(track.type !== TrackType.IMAGE) {
				if(video.currentTime === 0 || video.videoWidth === 0 || video.videoHeight === 0) {
					this.animationFrames[index] = window.requestAnimationFrame(step);
					return;
				}
			} else {
				if(!video.width || !video.height) {
					this.animationFrames[index] = window.requestAnimationFrame(step);
					return;
				}
			}

			if((!video.src && !video?.srcObject) || video.readyState < 2) {
				this.animationFrames[index] = window.requestAnimationFrame(step);
				return;
			}

			if(!texture && canvas) {
				texture = canvas.texture(video);
				this.textures[index] = texture;
			}

			// canvas.width = video.videoWidth;
			// canvas.height = video.videoHeight;

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
					length = track.filters!.length - 1
				}

				//Applies the filters to the canvas
				track.filters?.forEach((filter: FilterInstance, index: any) => {
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
						if((track.filters![index + 1]?.type === FilterLibrary.GLFX || index == length) && canvas) {
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
			this.ctx.globalCompositeOperation = "source-over";
			//Clears the canvas
			this.ctx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
			//Draws the background
			this.ctx.fillStyle = "black";
			this.ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

			let tracks = this.tracks;

			//Loops through all the canvas elements and draws them to the final canvas
			//Filters out all canvases in which the corresponding video is paused
			this.canvasElements.forEach((canvas: HTMLCanvasElement, index: number) => {
				let mediaElement = this.mediaElements[index];
				let track = tracks[index];

				// Symptom of a bigger problem, need to not use question mark here
				if(Array.isArray(track?.isVisible)) {
					if(!this.trackVisibilityAtGivenTime[index]) {
						this.trackVisibilityAtGivenTime[index] = 0;
					}
					const visibility = track.isVisible[this.trackVisibilityAtGivenTime[index]];
					if(visibility) {
						if(this.masterTime >= visibility.startTime && this.masterTime <= visibility.startTime + visibility.duration && !visibility.on) {
							return;
						}else if(this.masterTime >= visibility.startTime + visibility.duration) {
							this.trackVisibilityAtGivenTime[index]++;
						}
					}
				}

				if(mediaElement) {
					//Will not render the canvas if this is an audio track
					if(mediaElement instanceof HTMLAudioElement) {
						return;
					}

					if(!mediaElement.src && !mediaElement?.srcObject) {
						return;
					}
					if(mediaElement.paused && this.mediaPlaying) {
						return;
					}
				}

				if(!canvas || canvas?.width === 0 || canvas?.height === 0) {
					return;
				}
				let clip;
				try {
					clip = track?.clips![this.currentClip[index]];
				} catch(e) { }

				let width = clip?.width ?? track?.width ?? canvas?.width ?? 1920;
				let height = clip?.height ?? track?.height ?? canvas?.height ?? 1080;

				//Loops through all canvases and centers them on the final canvas
				//position is center of largest canvas
				let x = (finalCanvas.width / 2) - (width / 2);
				let y = (finalCanvas.height / 2) - (height / 2);

				let func = track?.layerFilter;
				this.ctx.globalCompositeOperation = (func != undefined && func != "") ? func : "source-over";
				this.ctx.drawImage(canvas, x, y, width, height);
			});
			window.requestAnimationFrame(step);
		}

		window.requestAnimationFrame(step);
		this.stream = finalCanvas.captureStream();
	}

	setPreviewSource(mediaSource: string, track: Track) {
		let type = track.type;
		let source = track?.source;

		let previewVideo = this.previewVideo.nativeElement;

		if(type === TrackType.WEBCAM) {
			//Accesses the webcam
			navigator.mediaDevices.getUserMedia({ video: true, audio: true })
				.then(stream => {
					//The video preview element src
					this.previewStream = stream;
					this.previewSrc = null;
					this.changeDetector.markForCheck();
					previewVideo.onloadedmetadata = () => {
						previewVideo.play();
					}
				});
		}else if(type === TrackType.SCREEN_CAPTURE) {
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
							chromeMediaSourceId: stream.find(({ id }) => id === source.sourceId).id, //The id of the desktop capture
							minWidth: 1280,
							maxWidth: 1920,
							minHeight: 720,
							maxHeight: 1080,
						}
					} as MediaTrackConstraints,
				}).then((stream) => {
					//The video preview element src
					this.previewStream = stream;
					this.previewSrc = null;
					previewVideo.onloadedmetadata = () => {
						previewVideo.play();
					}
					this.changeDetector.markForCheck();
				});
			}));
		}else if(type === TrackType.VIDEO) {
			this.previewSrc = mediaSource;
			this.previewStream = null;
			this.changeDetector.markForCheck();
		}else if(type === TrackType.IMAGE) {
			this.previewSrc = mediaSource;
			this.previewStream = null;
			this.changeDetector.markForCheck();
		}
	}

	setSource(track: Track, media: HTMLMediaElement, index: number) {
		let type = track.type;
		let source = track?.source;

		//Cancels all the previous animation calls
		// this.animationFrames.forEach((frame) => {
		// 	window.cancelAnimationFrame(frame);
		// });

		//Checks if the source is a video, webcam or desktop capture
		if(type === TrackType.WEBCAM) {

			//remove the audio track from the stream at the index
			// if(this.audioTracks[index]) {
			// 	this.audioTracks[index].stop();
			// 	this.stream.removeTrack(this.audioTracks[index]);
			// }

			//accesses the webcam
			navigator.mediaDevices.getUserMedia({ video: true, audio: true })
				.then(stream => {
					//The video preview element src
					media.srcObject = stream;

					// //remove the audio track from the stream at the index
					// if(this.stream.getAudioTracks()[index]) {
					// 	// this.stream.getAudioTracks()[index].stop();
					// 	this.stream.removeTrack(this.stream.getAudioTracks()[index]);
					// }

					this.audioTracks[index] = stream.getAudioTracks()[0];

					//Mutes the media stream if the track is muted
					if(track.muted) {
						this.audioTracks[index].enabled = false;
					}

					const sourceNode = new MediaStreamAudioSourceNode(this.audioCtx, {
						mediaStream: new MediaStream([this.audioTracks[index]])
					});

					sourceNode.connect(this.audioDestination);

					if(!this.canvasElements[index]) {
						this.initPreview(media, track, index);
					}
				});
		}else if(type === TrackType.SCREEN_CAPTURE) {
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
							chromeMediaSourceId: stream.find(({ id }) => id === source.sourceId).id, //The id of the desktop capture
							minWidth: 1280,
							maxWidth: 1920,
							minHeight: 720,
							maxHeight: 1080,
						}
					} as MediaTrackConstraints,
					audio: {
						mandatory: {
							chromeMediaSource: "desktop",
							chromeMediaSourceId: stream.find(({ id }) => id === source.sourceId).id,
						},
					} as MediaTrackConstraints,
				}).then((stream) => {
					//The video preview element src
					media.srcObject = stream;

					this.audioTracks[index] = stream.getAudioTracks()[0];

					if(track.muted) {
						this.audioTracks[index].enabled = false;
					}

					const sourceNode = new MediaStreamAudioSourceNode(this.audioCtx, {
						mediaStream: new MediaStream([this.audioTracks[index]])
					});

					sourceNode.connect(this.audioDestination);

					if(!this.canvasElements[index]) {
						this.initPreview(media, track, index);
					}
				});
			}));
		}else if([TrackType.VIDEO, TrackType.AUDIO].includes(type)) {
			this.changeDetector.markForCheck();
			if(!this.canvasElements[index]) {
				this.initPreview(media, track, index);
			}
		}else if(type === TrackType.IMAGE) {
			// Skips the initalsiation of audio for image tracks
			// as they do not have audio (duh)
			this.drawCanvas(media as HTMLVideoElement, track, index);
		}
	}

	//This starts playing the preview so that the canvas can be drawn
	initPreview(mediaElement: HTMLMediaElement, track: Track, index: number) {
		this.changeDetector.detectChanges();

		mediaElement.onloadedmetadata = () => {
			//Calls once the the media metadata has loaded
			mediaElement.muted = (track.type !== TrackType.VIDEO && mediaElement.srcObject !== null) || (track?.muted ?? false);
			if(this.mediaPlaying || mediaElement.srcObject) {
				mediaElement.play();
			}

			if([TrackType.VIDEO, TrackType.AUDIO].includes(track.type) && !this.audioTracks[index]) {
				this.createAudioTrack(mediaElement, index);
			}
		};

		if(track.type !== TrackType.AUDIO) {
			//Creates and draws the canvas corresponding to the video
			this.drawCanvas(mediaElement as HTMLVideoElement, track, index);
		}

		mediaElement.ontimeupdate = () => {
			//Updates the time of the media
			this.changeDetector.detectChanges();
		}
	}

	createAudioTrack(media: any, index: number) {
		try {
			let sourceNode = this.audioCtx.createMediaElementSource(media);
			// Connect the media element's output to the stream
			sourceNode.connect(this.audioDestination);
			sourceNode.connect(this.audioCtx.destination);
			sourceNode.enabled = true;
			this.audioTracks[index] = sourceNode;
		}catch(e) {
			console.log(e);
		}
	}

	initAudio() {
		this.audioCtx = new AudioContext();
		// This will be used to merge audio tracks from multiple media elements
		this.audioDestination = new MediaStreamAudioDestinationNode(this.audioCtx);
	}

	playPauseMedia(updateInMainEditor: boolean = true) {
		//Toggles play pause on the preview
		// this.videoNativeElement.paused ? this.videoNativeElement.play() : this.videoNativeElement.pause();
		this.mediaPlaying = !this.mediaPlaying;

		this.mediaElements.forEach((mediaElement, i) => {
			if(mediaElement?.srcObject || !mediaElement.src || this.tracks[i].type === TrackType.IMAGE) {
				return;
			}
			mediaElement.paused ? mediaElement.play() : mediaElement.pause();
		});

		if(updateInMainEditor) {
			//Sends the signal to update the play pause button in the main editor
			//This is only done if the play/pause event was triggered in the preview
			window.api.emit("update-play-video-button", { isPlaying: this.mediaPlaying, isFinishedPlaying: false });
		}

		if(!this.mediaPlaying) {
			return;
		}

		if(this.masterTime === 0) {
			//Resets everything when a user plays the media
			//after it it has played all the way through
			//This will basically restart the media from the beginning
			this.timeAnimationFrames.forEach((frame) => {
				window.cancelAnimationFrame(frame);
			});

			this.timeAnimationFrames = [];

			this.currentClip = [];

			this.startTime = window.performance.now();
			this.mediaPlayback();
		}else {
			this.startTime = window.performance.now() - this.masterTime;
		}
	}

	seekMedia(value: number) {
		this.timeAnimationFrames.forEach((frame) => {
			window.cancelAnimationFrame(frame);
		});

		this.timeAnimationFrames = [];

		this.currentClip = [];
		this.trackVisibilityAtGivenTime = [];

		this.startTime = window.performance.now() - this.masterTime;
		this.mediaPlayback();

		//Seeks the media at the current time value
		this.getClipAtTime(value);
		window.api.emit("update-play-video-button", { isPlaying: this.mediaPlaying, isFinishedPlaying: false, currentTime: value });
	}

	//Calculates how much of a clip has been played
	calculateMSOfClipPlayed(clip: ClipInstance) {
		let msPlayed = this.masterTime - clip.startTime;
		let playableDuration = clip.totalDuration - clip.in;
		//if the clip has been played for longer than the duration of the clip
		//finds out how many times the clip has been repeated
		//and how much of the current iteration of the clip has been played
		if(msPlayed > playableDuration) {
			let repetitions = Math.floor(msPlayed / playableDuration);
			msPlayed = msPlayed - (repetitions * playableDuration);
			return msPlayed;
		}

		return msPlayed + clip.in;
	}

	getClipAtTime(time: number = this.masterTime) {
		//Gets all the clips that overlap a given time
		this.tracks.forEach((track: Track, i) => {
			if(!track.clips || !track.isVisible) {
				return;
			}

			if(Array.isArray(track.isVisible)) {
				track.isVisible.forEach((visibility, j) => {
					if(this.masterTime >= visibility.startTime && this.masterTime <= visibility.startTime + visibility.duration) {
						this.trackVisibilityAtGivenTime[i] = j;
					}
				});
			}
			let hasPlayingClip = false;

			let mediaElement = this.mediaElements[i];
			track.clips.forEach((clip: ClipInstance, j) => {
				if(time >= clip.startTime && time < clip.startTime + clip.duration) {
					hasPlayingClip = true;
					if(mediaElement.src != "local-resource://getMediaFile/" + clip.location) {
						mediaElement.srcObject = null;
						mediaElement.src = "local-resource://getMediaFile/" + clip.location;
						this.changeDetector.markForCheck();
					}
					//Sets the current clip to j if
					//the clip is to be played
					this.currentClip[i] = j;
					this.masterTime = time;
					mediaElement.currentTime = this.calculateMSOfClipPlayed(clip) / 1000;

					if(this.mediaPlaying && track.type !== TrackType.IMAGE) {
						mediaElement.play();
					}
					return;
				}
				this.masterTime = time;
			});

			//Set the media element's source to nothing
			if(!hasPlayingClip) {
				mediaElement.removeAttribute("src");
				if(![TrackType.VIDEO, TrackType.IMAGE].includes(track.type)) {
					if(mediaElement?.srcObject) {
						mediaElement.play();
						return;
					}

					this.setSource(track, mediaElement, i);
				}
			}
		});
		this.changeDetector.markForCheck();
	}

	checkIfClipNeedsChanging(mediaElement: HTMLMediaElement, track: Track, index: number) {
		//Checks if the clip needs to be changed
		if(!track.clips || !this.mediaPlaying) {
			return;
		}

		if(!this.currentClip[index]) {
			this.currentClip[index] = 0;
		}

		let clips = track.clips;
		let i = this.currentClip[index];
		let clip = clips[i];

		if(!clip) {
			return;
		}

		//convert this.startTime to seconds
		if(this.masterTime >= clip.startTime && this.masterTime < clip.startTime + clip.duration) {
			if(decodeURIComponent(mediaElement.src) != "local-resource://getMediaFile/" + clip.location) {
				mediaElement.srcObject = null;
				mediaElement.removeAttribute("srcObject");
				mediaElement.src = "local-resource://getMediaFile/" + clip.location;

				this.changeDetector.detectChanges();
				mediaElement.currentTime = clip.in / 1000;
			}else {
				//Check if the media element is finished and if so, restart it
				//This is for looping media elements
				if(mediaElement.ended && track.type !== TrackType.IMAGE) {
					mediaElement.currentTime = clip.in / 1000;
					mediaElement.play();
					this.changeDetector.detectChanges();
				}
			}
		}else if(this.masterTime >= clip.startTime + clip.duration) {
			this.currentClip[index]++;
			if(clip.location === clips[i + 1]?.location) {
				mediaElement.currentTime = clips[i + 1].in / 1000;
				return;
			}
			mediaElement.src = "";
			mediaElement.removeAttribute("src");
			const isLiveFootage = [TrackType.SCREEN_CAPTURE, TrackType.WEBCAM].includes(track.type);
			if(isLiveFootage && (!clips[i + 1] || clips[i + 1]?.startTime >= this.masterTime + 0.5)) {
				this.setSource(track, mediaElement, index);
			}
		}
	}

	//Converts this.masterTime to hrs, mins, secs
	convertTime(time: number) {
		time = time / 1000;
		let hours = Math.floor(time / 3600);
		let minutes = Math.floor((time % 3600) / 60);
		let seconds = Math.floor(time % 60);

		let hoursString = hours < 10 ? "0" + hours : hours;
		let minutesString = minutes < 10 ? "0" + minutes : minutes;
		let secondsString = seconds < 10 ? "0" + seconds : seconds;

		return hoursString + ":" + minutesString + ":" + secondsString;
	}
}
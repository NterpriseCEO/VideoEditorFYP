import { Component, ElementRef, QueryList, ViewChild, ViewChildren, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, NgZone, Renderer2, OnInit } from "@angular/core";
import { io } from "socket.io-client";

const fx = require("glfx-es6");

import { Filter, FilterInstance, Track } from "src/app/utils/interfaces";
import { TracksService } from "../../services/tracks.service";
import { ImageFilters } from "src/app/utils/ImageFilters";
import { FilterLibrary } from "src/app/utils/constants";
import { MenuItem } from "primeng/api";

@Component({
	selector: "app-exports-view",
	templateUrl: "./exports-view.component.html",
	styleUrls: ["./exports-view.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExportsViewComponent implements OnInit, AfterViewInit {

	@ViewChild("finalCanvas") finalCanvas!: ElementRef;
	@ViewChild("replaceWithCanvas") replaceWithCanvas!: ElementRef;
	@ViewChild("canvasContainer") canvasContainer!: ElementRef;
	@ViewChildren("videos") videos!: QueryList<ElementRef>;

	recentExports: any[] = [];

	tracks: Track[] = [];
	currentClip: number[] = [];

	canvasElements: any[] = [];
	ctx: any;

	socket: any;

	stream: any;

	mediaRecorder: any;

	audioCtx: any;
	audioDestination: any;

	animationFrames: any[] = [];
	timeAnimationFrames: number[] = [];

	startTime: number = 0;
	masterTime: number = 0;
	duration: number = 0;

	isRecording: boolean = false;

	items: MenuItem[] = [
		{
			label: "Export",
			command: this.startExport.bind(this)
		},
		{
			label: "Clear",
			command: () => {
				this.recentExports = [];
				localStorage.setItem("recentExports", "[]");
			}
		}
	];

	constructor(
		private tracksService: TracksService,
		private changeDetector: ChangeDetectorRef,
		private renderer: Renderer2,
		private zone: NgZone
	) {}

	ngOnInit() {
		let recents = localStorage.getItem("recentExports");
		if(recents) {
			this.recentExports = JSON.parse(recents);
		}
		this.listenForEvents();
	}

	ngAfterViewInit() {
		window.api.emit("get-server-port");
		window.api.once("server-port", (_:any, port: number)=> this.zone.run(() => {
			//Sets the socket connection to the server
			this.socket = io("http://localhost:" + port);
		}));

		this.videos.changes.subscribe(changes => {
			this.isRecording = true;
			this.finalRender();

			changes.forEach((video: ElementRef, index: number) => {
				this.createAudioTrack(video.nativeElement, index);
				video.nativeElement.muted = this.tracks[index]?.muted ?? false;
				this.drawCanvas(video.nativeElement, this.tracks[index], index);
			});
		});
	}

	listenForEvents() {
		window.api.on("export-location-chosen", (_:any, path: string) => this.zone.run(() => {
			this.initAudio();

			//Reads recent-exports from localstorage
			let recents = localStorage.getItem("recentExports");
			const newExport = {
				name: path.substring(path.lastIndexOf("\\") + 1),
				path: path,
				date: new Date()
			};
			//Adds the new export to recent exports
			if(recents) {
				this.recentExports = JSON.parse(recents);
			}
			this.recentExports.push(newExport);
			localStorage.setItem("recentExports", JSON.stringify(this.recentExports));

			//Gets all tracks and filters out invisible ones
			this.tracks = [...JSON.parse(JSON.stringify(this.tracksService.getTracks()))];

			this.tracks = this.tracks.filter(track => track.isVisible && track.clips);

			this.tracks.forEach(track => {
				if(!track.filters) {
					return;
				}
				//Filters out disabled filters
				track.filters =
					track!.filters?.filter(filter=> filter.enabled).map((filter: Filter, index: number) => {

					//Converts the filter properties to
					//an array of values
					return {
						function: filter.function,
						properties: filter.properties ? filter.properties.map(prop => prop.value.value ?? prop.defaultValue) : [],
						type: filter.type
					}
				}) as FilterInstance[];
			});

			//Calculates the total duration of the export
			this.calculateDuration();
			this.changeDetector.detectChanges();

			this.socket.emit("start-recording");
		}));
	}

	startExport() {
		window.api.emit("choose-export-location");
	}

	cancelExport() {
		this.isRecording = false;
		this.mediaRecorder.stop();
		window.api.emit("cancel-recording");
	}

	initAudio() {
		this.audioCtx = new AudioContext();
		// This will be used to merge audio tracks from multiple videos
		this.audioDestination = this.audioCtx.createMediaStreamDestination();
	}

	calculateDuration() {
		//Finds the duration from start to the end of the last clip
		this.tracks.forEach(track => {
			let lastClip = track.clips![track.clips!.length - 1];

			if(!lastClip) {
				return;
			}

			if(lastClip.startTime + lastClip.duration > this.duration) {
				this.duration = lastClip.startTime + lastClip.duration;
			}
		});
	}

	createAudioTrack(video: any, index: number) {
		try {
			let sourceNode = this.audioCtx.createMediaElementSource(video);
			// Connect the video element's output to the stream
			sourceNode.connect(this.audioDestination);
			sourceNode.connect(this.audioCtx.destination);
			sourceNode.enabled = true;
		} catch (e) {
			console.log(e);
		}
	}

	recordAndSendData() {
		const recorderOptions = {
			mimeType: "video/webm; codecs=vp9",
			videoBitsPerSecond: 1000000 // 0.2 Mbit/sec.
		};

		//Captures the canvas and sends it to the server as new data is available
		this.mediaRecorder = new MediaRecorder(new MediaStream([
			this.stream.getVideoTracks()[0],
			this.audioDestination.stream.getAudioTracks()[0]
		]), recorderOptions);
		this.mediaRecorder.onstop = (event) => {};
		this.mediaRecorder.ondataavailable = (event) => {
			if(event.data && event.data.size > 0 && this.isRecording) {
				this.socket.emit("recording-data", event.data);
			}
		};

		this.mediaRecorder.start(100); // 1000 - the number of milliseconds to record into each Blob
	}

	checkIfClipNeedsChanging(video: HTMLVideoElement, track: Track, index: number) {
		//This keeps track of the current clip in a track that is being played
		//Each index in the array corresponds to a track
		if(!this.currentClip[index]) {
			this.currentClip[index] = 0;
		}

		let clips = track.clips!;
		let clip = clips[this.currentClip[index]];

		if(!clip) {
			return;
		}

		//Checks if the master time is within the clip's start and end time
		if(this.masterTime >= clip.startTime && this.masterTime <= clip.startTime + clip.duration) {
			if(video.src != "local-resource://getMediaFile/"+clip.location) {
				video.src = "local-resource://getMediaFile/"+clip.location;
				this.changeDetector.detectChanges();
				video.currentTime = clip.in;
				video.play();
			}
		}else if(this.masterTime >= clip.startTime + clip.duration) {
			video.src = "";

			this.currentClip[index]++;
		}
	}

	updateTime() {
		let currentTime = window.performance.now() / 1000;
		if(this.isRecording) {
			//Calculates the time since the recording started
			this.masterTime = currentTime - this.startTime;
			if(this.masterTime >= this.duration) {
				this.masterTime = 0;
				// this.mediaRecorder.stop();
				this.isRecording = false;
				this.socket.emit("stop-recording");
			}
			this.changeDetector.markForCheck();
		}
	}

	drawCanvas(video: HTMLVideoElement, track: Track, index: number) {
		//The element that the canvas will be placed after
		const nativeElement = this.replaceWithCanvas.nativeElement;
		let canvas;
		//Checks if the canvas has already been created
		try {
			canvas = fx.canvas();
			if(this.canvasElements[index]) {
				this.renderer.removeChild(this.canvasContainer, this.canvasElements[index]);
			}
			this.canvasElements[index] = canvas;
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
		canvas.classList.add("w-full", "h-full", "absolute", "opacity-0", "non-final-canvas");

		let step = async () => {
			// console.time("draw");
			//Measure the time it takes to draw the canvas
			// let start = window.performance.now();

			this.checkIfClipNeedsChanging(video, track, index);

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
					length = track.filters!.length - 1
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

			//Adds this animationFrame to the array so it can be cancelled later
			this.animationFrames[index] = window.requestAnimationFrame(step);
		};
		window.requestAnimationFrame(step);
	}

	finalRender() {
		let finalCanvas = this.finalCanvas.nativeElement;
		this.ctx = finalCanvas.getContext("2d");

		this.startTime = window.performance.now() / 1000;

		let step = async () => {
			this.ctx.globalCompositeOperation = "source-over";
			this.updateTime();
			//Clears the canvas
			this.ctx.clearRect(0, 0, finalCanvas.width, finalCanvas.height);
			//Draws the background
			this.ctx.fillStyle = "black";
			this.ctx.fillRect(0, 0, finalCanvas.width, finalCanvas.height);

			let videos = this.videos.toArray();

			let tracks = this.tracks;

			//Loops through all the canvas elements and draws them to the final canvas
			//Filter out all canvases in which the corresponding video is paused
			this.canvasElements.forEach((canvas: HTMLCanvasElement, index: number) => {
				if(videos[index] && videos[index].nativeElement.paused) {
					return;
				}

				if(canvas.width === 0 || canvas.height === 0) {
					return;
				}

				let track = tracks[index];
				let clip;
				try {
					clip = track?.clips![this.currentClip[index]];
				}catch(e) {}

				let width = (clip?.width ?? track?.width) ?? canvas.width;
				let height = (clip?.height ?? track?.height) ?? canvas.height;

				//Loops through all canvases and centers them on the final canvas
				//position is center of largest canvas
				let x = (finalCanvas.width / 2) - (width / 2);
				let y = (finalCanvas.height / 2) - (height / 2);

				let func = this.tracks[index]?.layerFilter?.function;
				this.ctx.globalCompositeOperation = (func != undefined && func != "") ? func : "source-over";

				this.ctx.drawImage(canvas, x, y, width, height);
			});
			window.requestAnimationFrame(step);
		}

		window.requestAnimationFrame(step);
		this.stream = finalCanvas.captureStream();
		this.recordAndSendData();
	}

	exportProgress() {
		//Progress is total duration mixed with the current time of the video
		return +((100 / this.duration) * this.masterTime).toFixed(2);
	}
}
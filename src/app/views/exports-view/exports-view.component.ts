import { AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, NgZone, OnInit, Renderer2, ViewChild } from "@angular/core";
import { Title } from "@angular/platform-browser";

import { FilterLibrary, TrackType } from "../../utils/constants";
import { ClipInstance, Filter, FilterInstance, Track } from "../../utils/interfaces";
import { ImageFilters } from "src/app/utils/ImageFilters";
import { deepCompare } from "src/app/utils/utils";
import { MenuItem } from "primeng/api";
import { TracksService } from "src/app/services/tracks.service";

const fx = require("glfx-es6");

@Component({
	selector: "app-exports-view",
	templateUrl: "./exports-view.component.html",
	styleUrls: ["./exports-view.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class ExportsViewComponent implements OnInit, AfterViewInit {

	@ViewChild("replaceWithCanvas") replaceWithCanvas!: ElementRef;
	@ViewChild("finalCanvas") finalCanvas!: ElementRef;
	@ViewChild("inputVideos") inputVideos!: ElementRef;
	@ViewChild("canvasContainer") canvasContainer!: ElementRef;
	@ViewChild("exportLogsWrapper") exportLogsWrapper!: ElementRef;

	recentExports: any[] = [];

	exportLogs: string = "";

	mediaElements: any[] = [];

	ctx: any;

	tracks: Track[] = [];
	tracksToBeRendered: boolean[] = [];
	trackIdsList: number[] = [];
	previousTracks: Track[] = [];
	currentClip: number[] = [];
	trackVisibilityAtGivenTime: any[] = [];

	//Testing
	fps: number = 0;

	canvasElements: any[] = [];
	textures: any[] = [];

	animationFrames: any[] = [];
	timeAnimationFrames: number[] = [];

	startTime: number = 0;
	currentTime: number = 0;
	masterTime: number = 0;
	duration: number = 0;

	frame: number = -1;

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

	needToProcessFrame: boolean = false;

	constructor(
		private tracksService: TracksService,
		private changeDetector: ChangeDetectorRef,
		private ngZone: NgZone,
		private renderer: Renderer2,
		private titleService: Title
	) { }

	ngOnInit() {
		this.titleService.setTitle("GraphX - Exports");

		this.listenForEvents();
	}

	ngAfterViewInit() {
		this.finalRender();
	}

	listenForEvents() {
		window.api.on("export-location-chosen", (_: any, path: string) => this.ngZone.run(() => {
			this.exportLogs = "";

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

			this.trackVisibilityAtGivenTime = [];

			//Gets all tracks and filters out invisible ones
			this.tracks = [...JSON.parse(JSON.stringify(this.tracksService.getTracks()))];

			this.tracks = this.tracks.filter(track => track.isVisible && track.clips);

			this.tracks.forEach(track => {
				if(!track.filters) {
					return;
				}
				//Filters out disabled filters
				track.filters =
					track!.filters?.filter(filter => filter.enabled).map((filter: Filter) => {
						//Converts the filter properties to
						//an array of values
						return {
							function: filter.function,
							properties: filter.properties ? filter.properties.map(prop => prop.value ?? prop.defaultValue) : [],
							type: filter.type
						}
					}) as FilterInstance[];
			});

			//Calculates the total duration of the export
			this.calculateDuration();

			const trackInfo = this.tracks.filter(({ clips, type }) => Array.isArray(clips) && clips.length > 0).map(track => ({
				id: track.id,
				clips: track?.clips,
				type: track.type,
				muted: track.muted
			}));

			trackInfo.forEach((track, index) => {
				const clipsList: any = [];
				// Loops through the and removes any unnecessary properties
				track.clips!.forEach((clip: ClipInstance, index) => {
					//check if clip startTime is more than the previous clip's startTime + duration
					//or if it is the first clip and startTime is more than 0
					const previousClip = track.clips![index - 1];

					clipsList.push({
						duration: clip.duration,
						type: "clip",
						location: clip.location,
						in: clip.in,
						startTime: clip.startTime
					});
				});
				track.clips = clipsList;
			});

			window.api.emit("export-tracks-data", trackInfo);

			this.tracks = this.tracks.filter(track => track.type !== TrackType.AUDIO);
		}));

		// Awaits the new clip paths and generated inside temp_export
		window.api.on("new-clip-paths", (_: any, tracks: any) => this.ngZone.run(() => {
			// Merges the new clip data into the existing tracks
			this.tracks = this.tracks.map((track, index) => {
				const newTrack = tracks.find(({ id }) => id === track.id);
				if(newTrack) {
					// Changes only the clip location
					track.clips = track.clips?.map((clip, index) => {
						const newClip = newTrack.clips[index];
						if(newClip) {
							clip.location = newClip.location;
						}
						return clip;
					});
				}
				return track;
			});
			console.log("new clip paths", this.tracks);
			this.generateMediaElements();
		}));

		// Prints the export logs to screen for interested users
		window.api.on("export-console-log", (_: any, data: any) => this.ngZone.run(() => {
			this.exportLogs += data + "<br>";
			this.changeDetector.detectChanges();
			this.exportLogsWrapper.nativeElement.scrollTop = this.exportLogsWrapper.nativeElement.scrollHeight;
		}));

		// Called when a frame has been piped to the main process
		window.api.on("frame-processed", (_: any, data: any) => this.ngZone.run(() => {
			console.log("frame done");
			this.mediaPlayback();
		}));
	}

	startExport() {
		window.api.emit("choose-export-location");
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

			//Removes the media element from the mediaElements array
			this.mediaElements[id] = null;
			//And cancels the animation frames and time animation frames
			window.cancelAnimationFrame(this.timeAnimationFrames[id]);
			window.cancelAnimationFrame(this.animationFrames[id]);
			this.animationFrames[id] = null;
			//Removes the canvases as well
			this.renderer.removeChild(this.canvasContainer.nativeElement, this.canvasElements[id]);
			delete this.canvasElements[id];
			this.textures[id]?.destroy();
			this.textures[id] = null;
		});

		this.tracks.filter(track => track.type !== TrackType.AUDIO).forEach((track) => {
			//Checks if the track is in the previousTracks array
			const matchingTracks = this.previousTracks.filter(t => deepCompare(t, track));
			if(matchingTracks.length === 1) {
				index++;
				return;
			}

			let trackType = track.type.toLocaleLowerCase();
			// Used to determine the type of media element to create
			trackType = trackType === "audio" ? "audio"
				: trackType === "image" ? "img"
				: "video";

			let mediaElement = document.createElement(trackType) as HTMLMediaElement;
			mediaElement.id = "media-" + index;
			mediaElement.classList.add("media", "w-full", "flex-grow-1", "absolute", "opacity-0");
			if (track.type !== TrackType.IMAGE) {
				mediaElement.classList.add("h-full");
			}
			//Appends the media element after #previewVideo
			this.renderer.appendChild(this.inputVideos.nativeElement, mediaElement);
			if(!this.canvasElements[index]) {
				this.initPreview(mediaElement, track, index);
			}

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

		this.startTime = window.performance.now() - this.masterTime;
		this.mediaPlayback();

		this.previousTracks = JSON.parse(JSON.stringify([...this.tracks]));
	}

	calculateDuration() {
		//Finds the duration from start to the end of the last clip
		this.tracks.forEach(track => {
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

	mediaPlayback() {
		if(this.masterTime >= this.duration) {
			this.needToProcessFrame = false;

			window.api.emit("frames-exportation-finished");
			return;
		}

		this.needToProcessFrame = true;
		
		this.tracks.filter(track => track.type !== TrackType.AUDIO).forEach((track: Track, index) => {
			let elapsedTime = 0;

			let media;

			if(this.mediaElements[index]) {
				media = this.mediaElements[index];
			}

			this.checkIfClipNeedsChanging(media, track, index);
			// Checks if the elements is to be rendered
			this.tracksToBeRendered[index] = !!media.src;
			if(track.type === TrackType.IMAGE) {
				return;
			}
			// Increases the current time of the media element by 1 frame
			const currentFrame = Math.floor(media.currentTime.toFixed(5) * 30);
			media.currentTime = ((currentFrame + 1) / 30) + 0.00001;
		});
		// Increases the master time by 1 frame
		this.masterTime += Math.round((1000 / 30) * 1000) / 1000;
	}

	deleteCanvases() {
		const nativeElement = this.replaceWithCanvas.nativeElement;

		//Removes all the canvas elements except the final render canvas
		document.querySelectorAll(".non-final-canvas").forEach((canvas) => {
			this.renderer.removeChild(this.canvasContainer, canvas);
		});
		this.canvasElements = [];
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
		} catch (e) {
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

		//Applies certain classes to the canvas
		canvas.classList.add("absolute", "opacity-0", "non-final-canvas", "canvas-" + index);

		let step = async () => {
			// console.time("draw");
			//Measure the time it takes to draw the canvas
			// let start = window.performance.now();

			// Skips if the frame is not to be rendered (or has already been rendered)
			if(!this.tracksToBeRendered[index]) {
				this.animationFrames[index] = window.requestAnimationFrame(step);
				return;
			}

			if(this.tracks[index]!.clips![this.currentClip[index]] === undefined || this.masterTime < this.tracks[index]!.clips![this.currentClip[index]]!.startTime) {
				this.tracksToBeRendered[index] = false;
				this.animationFrames[index] = window.requestAnimationFrame(step);
				return;
			}

			if(track.type !== TrackType.IMAGE) {
				if (video.currentTime === 0 || !video.src || video.readyState < 2) {
					this.animationFrames[index] = window.requestAnimationFrame(step);
					return;
				}
			}else {
				if(!video.width || !video.height) {
					this.animationFrames[index] = window.requestAnimationFrame(step);
					return;
				}
			}

			if(!texture && canvas) {
				texture = canvas.texture(video);
				this.textures[index] = texture;
			}

			if(!ifTexture) {
				ifTexture = imageFilters.texture(video);
			}

			//Loads the contents of the video element into the texture
			try {
				texture.loadContentsOf(video);
			} catch (e) {
				console.log(e);
			}

			let draw;
			try {
				draw = canvas.draw(texture);
			} catch (e) {
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

					//Checks if previous filter was an ImageFilters filter
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

			this.tracksToBeRendered[index] = false;
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

			// Makes sure no tracks are being rendered
			if(this.tracksToBeRendered.some(track => track === true) || this.tracksToBeRendered.length === 0) {
				window.requestAnimationFrame(step);
				return;
			}


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
					if(!mediaElement.src) {
						return;
					}
				}

				if(!canvas || canvas?.width === 0 || canvas?.height === 0) {
					return;
				}
				let clip;
				try {
					clip = track?.clips![this.currentClip[index]];
				} catch (e) { }

				if(clip && this.masterTime >= clip!.startTime + clip!.duration) {
					return;
				}

				let width = clip?.width ?? track?.width ?? canvas?.width ?? 1920;
				let height = clip?.height ?? track?.height ?? canvas?.height ?? 1080;

				//Loops through all canvases and centers them on the final canvas
				//position is center of largest canvas
				let x = (finalCanvas.width / 2) - (width / 2);
				let y = (finalCanvas.height / 2) - (height / 2);

				let func = track?.layerFilter?.function;
				this.ctx.globalCompositeOperation = (func != undefined && func != "") ? func : "source-over";
				this.ctx.drawImage(canvas, x, y, width, height);
			});

			if(this.needToProcessFrame) {
				console.log("frame", frames);
				this.needToProcessFrame = false;
				window.api.emit("frame", finalCanvas.toDataURL("image/jpeg"));
			}

			window.requestAnimationFrame(step);
		}

		window.requestAnimationFrame(step);
	}

	//This starts playing the preview so that the canvas can be drawn
	initPreview(mediaElement: HTMLMediaElement, track: Track, index: number) {
		this.changeDetector.detectChanges();

		this.drawCanvas(mediaElement as HTMLVideoElement, track, index);

		mediaElement.ontimeupdate = () => {
			// Maybe not needed anymore???
			this.changeDetector.detectChanges();
		}
	}

	//Calculates how much of a clip has been played
	calculateMSOfClipPlayed(clip: ClipInstance) {
		let msPlayed = this.masterTime - clip.startTime;
		let playableDuration = clip.totalDuration - clip.in;
		//If the clip has been played for longer than the duration of the clip
		//finds out how many times the clip has been repeated
		//and how much of the current iteration of the clip has been played
		if(msPlayed > playableDuration) {
			let repetitions = Math.floor(msPlayed / playableDuration);
			msPlayed = msPlayed - (repetitions * playableDuration);
			return msPlayed;
		}

		return msPlayed + clip.in;
	}

	checkIfClipNeedsChanging(mediaElement: HTMLMediaElement, track: Track, index: number) {
		//Checks if the clip needs to be changed
		if(!track.clips) {
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

		if(this.masterTime >= clip.startTime && this.masterTime < clip.startTime + clip.duration) {
			if(decodeURIComponent(mediaElement.src) != "local-resource://getMediaFile/" + clip.location) {
				mediaElement.src = "local-resource://getMediaFile/" + clip.location;

				this.changeDetector.detectChanges();
				mediaElement.currentTime = clip.in / 1000;
			}else {
				//Check if the media element is finished and if so, restart it
				//This is for looping media elements
				if(mediaElement.ended && track.type !== TrackType.IMAGE) {
					mediaElement.currentTime = clip.in / 1000;
					// Need to check this
					// mediaElement.play();
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
			this.checkIfClipNeedsChanging(mediaElement, track, index);
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

	exportProgress() {
		//Progress is total duration mixed with the current time of the video
		// Need to restore in next iteration
		// return +((100 / this.duration) * this.masterTime).toFixed(2);
	}
}
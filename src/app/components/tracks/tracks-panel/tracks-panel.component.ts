import { AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, OnDestroy, ViewChild } from "@angular/core";
import { TracksService } from "src/app/services/tracks.service";
import { ClipInstance, Track } from "src/app/utils/interfaces";
import { fromEvent } from "rxjs";
import { ClipService } from "src/app/services/clip.service";
import { TrackType } from "src/app/utils/constants";
import { ProjectFileService } from "src/app/services/project-file-service.service";

@Component({
	selector: "app-tracks-panel",
	templateUrl: "./tracks-panel.component.html",
	styleUrls: ["./tracks-panel.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TracksPanelComponent implements AfterViewChecked, AfterViewInit, OnDestroy {

	@ViewChild("tracksList") tracksList!: ElementRef;
	@ViewChild("tracksDetails") tracksDetails!: ElementRef;
	@ViewChild("tracksNgForList") tracksNgForList!: ElementRef;

	tracks: Track[] = [];
	tracksCount: number = 0;

	addingTrack: boolean = false;

	numbers: number[] = [];

	hoveringTrack: Track | null = null;
	originTrack: Track | null = null;

	draggingTimeout: any = null;

	timelineIndicatorPosition: number = 0;
	playStartTime: number = 0;
	isPlaying: boolean = false;

	timelineInterval: any = null;

	projectDuration: number = 0;
	tracksWidth: number = 0;

	hasLessTracksThanHeightOfTracksList: boolean = false;
	resizeObserver: ResizeObserver | null = null;

	constructor(
		public tracksService: TracksService,
		private changeDetector: ChangeDetectorRef,
		public cs: ClipService,
		public pfService: ProjectFileService
	) { }

	ngAfterViewInit() {
		this.listenForEvents();
		this.setTimeNumbers();
	}

	ngAfterViewChecked() {
		//Scrolls to the bottom when a track is added
		if(this.addingTrack) {
			this.addingTrack = false;
			this.tracksList.nativeElement.scrollTop = this.tracksList.nativeElement.scrollHeight;
			//Scroll the tracksDetails to the bottom
			this.tracksDetails.nativeElement.scrollTop = this.tracksList.nativeElement.scrollHeight;

			this.changeDetector.detectChanges();
		}
	}

	ngOnDestroy(): void {
		if(this.resizeObserver) {
			this.resizeObserver.disconnect();
		}

		this.tracksService.tracksSubject.unsubscribe();
		this.tracksService.selectedTrackChangedSubject.unsubscribe();
		this.tracksService.previewStateSubject.unsubscribe();
	}

	@HostListener('document:click', ['$event.target'])
	public click(targetElement) {
		//Checks if the click is inside the tracksNgForList element
		//and resets the dragged clip if it isn't
		const clickedInside = this.tracksNgForList.nativeElement.contains(targetElement);
		if(!clickedInside) {
			this.cs.setDraggedClip(null);
			this.cs.setPhantomClip(null);
			this.cs.setClipBeingResized(null);
			this.cs.setCurrentClip(null);
		}
	}

	listenForEvents() {
		//Listens for resize events on the tracksList element
		this.resizeObserver = new ResizeObserver(() => {
			this.tracksWidth = this.tracksList.nativeElement.scrollWidth;
			const trackCount = this.tracks.length;
			//Checks if the number of tracks is less than the height of the tracksList element
			this.hasLessTracksThanHeightOfTracksList = trackCount * 100 < this.tracksList.nativeElement.clientHeight;

			this.setTimeNumbers();
		});

		this.resizeObserver.observe(this.tracksList.nativeElement);

		//Subscribes to the addTrackSubject in the tracks service
		this.tracksService.tracksSubject.subscribe((tracks: Track[]) => {
			//Checks if a track is being added not removed
			this.addingTrack = this.tracksCount < tracks.length;
			this.tracksCount = tracks.length;

			this.tracks = tracks;

			this.projectDuration = this.tracksService.getProjectDuration();

			//Sets the tracks width to the project duration + 30 seconds
			//but the minimum width is the width of #tracksList
			const width = (this.projectDuration + 30) * 10;

			this.tracksWidth = width > this.tracksList.nativeElement.clientWidth ? width : this.tracksList.nativeElement.clientWidth;

			this.setTimeNumbers();

			this.changeDetector.detectChanges();
		});

		this.tracksService.selectedTrackChangedSubject.subscribe(() => {
			this.changeDetector.detectChanges();
		});

		this.tracksService.previewStateSubject.subscribe(state => {
			if(state?.isPlaying) {
				this.playStartTime = Date.now();
				this.moveTimeLineIndicator();
				this.isPlaying = true;
			}else {
				clearInterval(this.timelineInterval);
				this.isPlaying = false;
			}

			//Resets the timeline indicator position when the preview is finished playing
			if(state?.isFinishedPlaying) {
				this.timelineIndicatorPosition = 0;
				this.changeDetector.detectChanges();
				this.isPlaying = false;
			}

			if(state?.currentTime) {
				this.timelineIndicatorPosition = state.currentTime*10;
				this.changeDetector.detectChanges();
			}
		});
		//Listens for the window visibility change event
		//so that it's position can be updated when the window is visible
		document.addEventListener("visibilitychange", () => {
			clearInterval(this.timelineInterval);
			if(!document.hidden && this.isPlaying) {
				this.setTimlineIndicatorPosition();
				this.moveTimeLineIndicator();
			}
		}, false);
	}

	setTimlineIndicatorPosition() {
		let currentTime = Date.now()-this.playStartTime;
		//Rounds to the nearest 200ms
		this.timelineIndicatorPosition = Math.floor(currentTime / 100);

		this.changeDetector.detectChanges();
	}

	moveTimeLineIndicator() {
		this.timelineInterval = setInterval(() => {
			this.timelineIndicatorPosition+=2;
			this.changeDetector.detectChanges();
		}, 200);
	}

	//window resize event
	@HostListener("window:resize", ["$event"])
	onResize() {
		this.setTimeNumbers();
	}

	setTimeNumbers() {
		let roundedWidth = Math.round((this.projectDuration + 10) / 5);

		//If the amound of numbers is less than 2 then set it the amount that
		//fits in the tracksList element
		if(roundedWidth === 2) {
			const tracksListWidth = this.tracksList.nativeElement.scrollWidth-200;
			roundedWidth = Math.round((tracksListWidth) / 50);
		}
		this.numbers = [...Array(roundedWidth).keys()];
		this.changeDetector.detectChanges();
	}

	convertToTime(time: number) {
		//Converts the input to minutes and seconds where each number represents 5 seconds
		let minutes = Math.floor(time / 12);
		let seconds = (time % 12) * 5;

		return minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
	}

	insertClipAtPosition(track: Track, newClip: ClipInstance) {
		//This inserts the clip into the track at the correct index
		//so that the clips are in order.
		//This is necessary because code in the preview window
		//assumes that the clips are in order
		let clips = track.clips;
		let index = 0

		clips?.forEach((clip: ClipInstance, i: number) => {
			if(newClip.startTime > clip.startTime) {
				index = i+1;
			}
		});

		track.clips?.splice(index, 0, newClip);
	}

	checkIfClipOverlaps(track: Track, newClip: ClipInstance) {
		track?.clips?.map((clip: ClipInstance) => {
			if(JSON.stringify(clip) === JSON.stringify(newClip)) {
				//Count the number of clips that match the new clip
				//If there is more than one then remove the new clip
				//so that there are no duplicates
				let count = 0;
				track?.clips?.forEach((clip2: ClipInstance) => {
					if(clip2 === newClip) {
						count++;
					}
				});
				if(count > 1) {
					let index = track?.clips?.findIndex(clip2 => clip2 === newClip);
					track?.clips?.splice(index!, 1);
				}
				return;
			}
			let sTime = clip.startTime;
			let eTime = clip.startTime + clip.duration;
			let ncSTime = newClip.startTime;
			let ncETime = newClip.startTime + newClip.duration;
			//Checks if the current clip is inside the new clip completely
			if(sTime >= ncSTime && eTime <= ncETime) {
				//remove this clip
				track.clips = track?.clips?.filter((clip2: ClipInstance) => {
					return clip2 !== clip;
				});
				return;
			}
			//Checks if the new clip is cutting off the end of the current clip
			if(eTime > ncSTime && eTime < ncETime) {
				clip.duration = ncSTime - sTime;
			}else if(ncSTime > sTime && ncETime < eTime) {
				//Checks if the new clip is inside the current clip
				//Creates a new clip with the remaining duration
				let newClip2 = JSON.parse(JSON.stringify(clip));
				clip.duration = ncSTime - sTime;
				newClip2.startTime = ncETime;
				newClip2.duration -= clip.duration+newClip.duration;
				newClip2.in += clip.duration + newClip.duration;

				//insert the clip after the current clip (clip)
				track?.clips?.splice(track.clips.indexOf(clip)+1, 0, newClip2);
			}else if(ncETime > sTime && eTime > ncETime) {
				//Checks if the new clip is cutting off the start of the current clip
				clip.duration = eTime - ncETime;
				//Calulates the distance start of the current clip and the end of the new clip
				//This is used to calculate the new in point of the current clip
				clip.in += ncETime - sTime;
				clip.startTime = ncETime;
			}
		});
	}

	completeDrag(event, track: Track) {
		//Selects the hovering track
		this.tracksService.setSelectedTrack(this.hoveringTrack!);
		const draggedClip = this.cs.getDraggedClip();
		const phantomClip = this.cs.getPhantomClip();
		const clipBeingResized = this.cs.getClipBeingResized();
		const currentClip = this.cs.getCurrentClip();

		let updateProject = !!draggedClip && !!phantomClip && draggedClip?.startTime !== phantomClip?.startTime;

		this.tracksService.filtersChangedSubject.next(updateProject);

		if(!draggedClip && !currentClip && !clipBeingResized) {
			return;
		}

		//Checks if the clip is being dragged on the same track
		if(draggedClip && phantomClip &&
			draggedClip!.startTime === phantomClip!.startTime &&
			this.hoveringTrack === this.originTrack
		) {
			this.cs.setDraggedClip(null);
			this.cs.setPhantomClip(null);
			return;
		}

		let clip: ClipInstance = JSON.parse(JSON.stringify(phantomClip || clipBeingResized));
		let tracks: Track[] = this.tracksService.getTracks();
		let originTrack = tracks.find(track => track.id === this.originTrack?.id);

		//Finds the index of the clip that matches currently dragged clip
		let clipIndex = this.originTrack?.clips?.findIndex((clip2: ClipInstance) => {
			return JSON.stringify(clip2) === JSON.stringify(draggedClip);
		});

		console.log("origin track", event);

		this.checkIfClipOverlaps(track!, clip);
		if(!clipBeingResized) {
			//If a new clip is being added
			if(track && currentClip && track.type === TrackType.VIDEO) {
				//Creates an empty array if the track doesn't have any clips
				if(!track.clips) {
					track.clips = [];
				}

				console.log("clip", clip);

				//Gets the mouse position relative to the tracksList element including the scroll
				let mousePositionSeconds = this.getMousePosition(event);

				clip = JSON.parse(JSON.stringify(Object.assign(currentClip, { in: 0, startTime: mousePositionSeconds })));

				this.insertClipAtPosition(track, clip);

				track.clips = [...track.clips];

				//Resets the current clip so that it can't be added
				//multiple times
				this.cs.setCurrentClip(null);
			}else {
				//If an existing clip is being moved
				if(clip.startTime < 0) {
					clip.startTime = 0;
				}
				if(this.originTrack == this.hoveringTrack) {
					//Replace the clip with the modified version of itself
					originTrack!.clips?.splice(clipIndex!, 1);
					this.insertClipAtPosition(originTrack!, clip);
					this.cs.setDraggedClip(null);
				}else {
					this.cs.resetDraggedClip();

					if(!currentClip) {
						if(this.originTrack?.type != this.hoveringTrack?.type) {
							return;
						}
						//Removes the clip from the origin track
						originTrack!.clips?.splice(clipIndex!, 1);

						if(!track!.clips) {
							track!.clips = [];
						}

						this.insertClipAtPosition(track!, clip);
					}
				}
			}
		}

		this.cs.setClipBeingResized(null);

		this.projectDuration = this.tracksService.getProjectDuration();
		this.updateTracksPanelDimensions();

		this.setTimeNumbers();

		this.cs.setPhantomClip(null);
		this.changeDetector.markForCheck();

		//Updates the project file object
		this.pfService.updateTracks(this.tracks);

		window.api.emit("update-track-clips", track);
		window.api.emit("update-track-clips", this.originTrack);
	}

	deleteTrack(id: number) {
		this.tracksService.deleteTrack(id);
	}

	getMousePosition(event: MouseEvent) {
		let mousePosition = event.clientX - this.tracksList.nativeElement.getBoundingClientRect().left + this.tracksList.nativeElement.scrollLeft - 200;
		mousePosition = Math.round(mousePosition / 10) * 10;

		//Converts the mouse position to seconds
		return mousePosition/10;
	}

	setPhantomClip(event: MouseEvent) {
		const currentClip = this.cs.getCurrentClip();
		const draggedClip = this.cs.getDraggedClip();
		if (currentClip && !this.cs.isDraggingClip() && !draggedClip) {
			return;
		}
		if(this.cs.getClipBeingResized()) {
			return;
		}
		let mousePositionSeconds = this.getMousePosition(event) - this.cs.getDraggedDistanceDiff();

		//Sets the phantom clip to the current clip or the dragged clip
		let clip = JSON.parse(JSON.stringify(currentClip || draggedClip));
		if(clip) {
			this.cs.setPhantomClip(Object.assign(clip, { in: clip.in, startTime: mousePositionSeconds }));
		}
		this.changeDetector.detectChanges();
	}

	onDrag(event: MouseEvent, track: Track) {
		this.hoveringTrack = JSON.parse(JSON.stringify(track));
		this.setPhantomClip(event);

		const phantomClip = this.cs.getPhantomClip();

		if(phantomClip && phantomClip.startTime < 0) {
			phantomClip.startTime = 0;
			this.changeDetector.detectChanges();
		}

		clearTimeout(this.draggingTimeout);

		let clip = this.cs?.getClipBeingResized();

		if(clip) {
			//Resizes the clip
			const elementBeingResized = this.cs.getClipElementBeingResized()?.getBoundingClientRect()!;
			const mousePosition = this.getMousePosition(event);
			if(event.clientX > elementBeingResized.right - 20) {
				//Makes sure the clip can't be resized to a duration longer than the total duration
				let newDuration = mousePosition - clip!.startTime;
				if(newDuration > clip.totalDuration) {
					newDuration = clip.totalDuration;
				}
				//The mouse psotion in seconds - the start time of the clip
				clip!.duration = newDuration;
			}else if(event.clientX < elementBeingResized.left + 20) {

				//Shrinks the duration of the clip proportionally to the
				//new start time of the clip
				let newDuration = clip!.duration + clip!.startTime - mousePosition;

				const newIn = mousePosition - clip!.startTime;

				//Makes sure the clip can't resize to a duration less than 0
				if(clip.in === 0 && newIn < 0) {
					return;
				}

				if(newDuration > clip.totalDuration) {
					newDuration = clip.totalDuration;
				}
				clip!.duration = newDuration;
				//Sets the point where the clip starts
				//The start point of the clip itself,
				//not start point of the clip in the timeline
				clip.in += newIn;

				clip!.startTime = mousePosition;
			}
			//Recreates the clips array to trigger change detection
			this.hoveringTrack!.clips = [...this.hoveringTrack?.clips!];
			this.checkIfClipOverlaps(this.hoveringTrack!, clip);
			this.changeDetector.markForCheck();

			this.draggingTimeout = setTimeout(() => {
				//Updates the project file object
				this.pfService.updateTracks(this.tracks);
			}, 200);

			this.cs.setPhantomClip(null);
			this.updateTracksPanelDimensions();
			this.setTimeNumbers();

			window.api.emit("update-track-clips", this.hoveringTrack!);
		}
	}

	selectTrack(track: Track, index: number) {
		if(!track.clips || !track.clips.length) {
		}
		window.api.emit("set-selected-clip-in-preview", {location: null, trackIndex: index, clipIndex: null});
	}

	updateTracksPanelDimensions() {
		//width = product duration +30 seconds * 10px per second
		const width = (this.projectDuration + 30) * 10;
		this.tracksWidth = width > this.tracksList.nativeElement.clientWidth ? width : this.tracksList.nativeElement.clientWidth;
		const trackCount = this.tracks.length;
		this.hasLessTracksThanHeightOfTracksList = trackCount * 100 < this.tracksList.nativeElement.clientHeight;
	}
}

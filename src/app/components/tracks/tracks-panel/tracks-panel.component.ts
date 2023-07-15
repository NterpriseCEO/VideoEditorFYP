import { AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, HostListener, ViewChild } from "@angular/core";
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
export class TracksPanelComponent implements AfterViewChecked, AfterViewInit {

	@ViewChild("tracksList") tracksList!: ElementRef;
	@ViewChild("tracksDetails") tracksDetails!: ElementRef;
	@ViewChild("timeLines") timeLines!: ElementRef;
	@ViewChild("timelineNumbers") timelineNumbers!: ElementRef;

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

	constructor(
		public tracksService: TracksService,
		private changeDetector: ChangeDetectorRef,
		public cs: ClipService,
		public pfService: ProjectFileService
	) {
		this.listenForEvents();
	}

	listenForEvents() {
		//Subscribes to the addTrackSubject in the tracks service
		this.tracksService.tracksSubject.subscribe((tracks: Track[]) => {
			//Checks if a track is being added not removed
			this.addingTrack = this.tracksCount < tracks.length;
			this.tracksCount = tracks.length;

			this.tracks = tracks;

			if(!this.addingTrack) {
				this.moveTimeLines(true);
			}

			this.changeDetector.detectChanges();
		});

		this.tracksService.selectedTrackChangedSubject.subscribe((track: Track | null) => {
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

			//isFInishedPLaying or not
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

	ngAfterViewInit() {
		//Scrolls the tracks details to the same position as the tracks list
		setTimeout(() => {
			this.resizeTimeLines();
		}, 0);
		fromEvent(this.tracksList.nativeElement, "scroll").subscribe((event: any) => {
			this.tracksDetails.nativeElement.scrollTop = event.target.scrollTop;

			if(event.target.scrollLeft !== 0) {
				this.timelineNumbers.nativeElement.scrollLeft = event.target.scrollLeft;
			}
			
			if(!this.addingTrack) {
				this.moveTimeLines();
			}
		});
	}

	//window resize event
	@HostListener("window:resize", ["$event"])
	onResize() {
		this.renderTimeline();
	}

	ngAfterViewChecked() {
		//Scrolls to the bottom when a track is added
		if(this.addingTrack) {
			this.addingTrack = false;
			this.tracksList.nativeElement.scrollTop = this.tracksList.nativeElement.scrollHeight;
			//Scroll the tracksDetails to the bottom
			this.tracksDetails.nativeElement.scrollTop = this.tracksList.nativeElement.scrollHeight;

			this.moveTimeLines();

			this.changeDetector.detectChanges();
		}
	}

	resizeTimeLines() {
		this.timeLines.nativeElement.style.width = this.tracksList.nativeElement.clientWidth + "px";

		//Divide the width of the tracksList by 50 to get the number of seconds
		let roundedWidth = Math.floor(this.tracksList.nativeElement.clientWidth / 50);
		//Populates the numbers array with the number of seconds
		this.numbers = [];
		for(let i = 0; i < roundedWidth; i++) {
			this.numbers.push(i);
		}
		this.changeDetector.detectChanges();
	}

	//Moves the timeLines element to the same position as the tracksList element
	//so thatthe time lines are always visible
	moveTimeLines(removingTrack: boolean = false) {
		//Moves thes times lines to the top temporarily so
		//that the scrollHeight is not affected
		if(removingTrack) {
			this.timeLines.nativeElement.style.top = "0px";
		}
		setTimeout(() => {
			this.timeLines.nativeElement.style.top = this.tracksList.nativeElement.scrollTop + "px";
		}, 0);
	}

	convertToTime(time: number) {
		//Converts the input to minutes and seconds where each number represents 5 seconds
		let minutes = Math.floor(time / 12);
		let seconds = (time % 12) * 5;

		return minutes + ":" + (seconds < 10 ? "0" + seconds : seconds);
	}

	addClip(track: Track, event: MouseEvent) {
		//Returns if there is no current clip to add
		if(!this.cs.getCurrentClip() || track.type !== TrackType.VIDEO) {
			return;
		}

		//Creates an empty array if the track doesn't have any clips
		if(!track.clips) {
			track.clips = [];
		}

		//Gets the mouse position relative to the tracksList element including the scroll
		let mousePositionSeconds = this.getMousePosition(event);
		
		let newClip = JSON.parse(JSON.stringify(Object.assign(this.cs.getCurrentClip(), { in: 0, startTime: mousePositionSeconds })));
		
		this.checkIfClipOverlaps(track, newClip);
		this.insertClipAtPosition(track, newClip);

		this.changeDetector.markForCheck();

		track.clips = [...track.clips];

		//Resets the current clip so that it can't be added
		//multiple times
		this.cs.setCurrentClip(null);

		//Updates the project file object
		//2 events are being called here: NEED TO FIX/////////////////////////////////////////////////////////////
		this.pfService.updateTracks(this.tracks);

		window.api.emit("update-track-clips", track);

		this.renderTimeline();
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

	completeDrag() {
		//Selects the hovering track
		this.tracksService.setSelectedTrack(this.hoveringTrack!);
		let draggedClip = this.cs.getDraggedClip();
		let phantomClip = this.cs.getPhantomClip();

		let updateProject = !!draggedClip && !!phantomClip && draggedClip?.startTime !== phantomClip?.startTime;

		this.tracksService.filtersChangedSubject.next(updateProject);

		if(!this.cs.getDraggedClip() && !this.cs.getClipBeingResized()) {
			return;
		}

		//Checks if the clip is being dragged on the same track
		if(this.cs.getDraggedClip() && this.cs.getPhantomClip() &&
			this.cs.getDraggedClip()!.startTime === this.cs.getPhantomClip()!.startTime &&
			this.hoveringTrack === this.originTrack
		) {
			this.cs.setDraggedClip(null);
			this.cs.setPhantomClip(null);
			return;
		}
		//Checks if the clip is being resized
		if(this.cs.getClipBeingResized()) {
			this.cs.setClipBeingResized(null);
			this.cs.setPhantomClip(null);
			return;
		}

		let clip: ClipInstance = JSON.parse(JSON.stringify(this.cs.getPhantomClip()));
		let tracks: Track[] = this.tracksService.getTracks();
		let track = tracks.find(track => track.id === this.originTrack?.id);

		//Finds the index of the clip that matches currently dragged clip
		let clipIndex = this.originTrack?.clips?.findIndex((clip2: ClipInstance) => {
			return JSON.stringify(clip2) === JSON.stringify(this.cs.getDraggedClip());
		});

		if(clip.startTime < 0) {
			clip.startTime = 0;
		}

		//Checks if the clip is being dragged on the same track
		if(this.originTrack == this.hoveringTrack) {
			//Replace the clip with the modified version of itself
			track!.clips?.splice(clipIndex!, 1);
			this.insertClipAtPosition(track!, clip);
			this.cs.setDraggedClip(null);
			this.cs.setPhantomClip(null);
		}else {
			this.cs.resetDraggedClip();

			if(this.originTrack?.type != this.hoveringTrack?.type) {
				return;
			}

			//Removes the clip from the origin track
			track!.clips?.splice(clipIndex!, 1);

			track = tracks.find(track => track.id === this.hoveringTrack?.id);

			if(!track!.clips) {
				track!.clips = [];
			}

			this.insertClipAtPosition(track!, clip);

			this.changeDetector.markForCheck();
		}

		this.renderTimeline();

		this.checkIfClipOverlaps(track!, clip);
		this.changeDetector.markForCheck();

		//Updates the project file object
		this.pfService.updateTracks(this.tracks);

		window.api.emit("update-track-clips", this.hoveringTrack);
		window.api.emit("update-track-clips", this.originTrack);
	}

	deleteTrack(id: number) {
		this.tracksService.deleteTrack(id);
	}

	getMousePosition(event: MouseEvent) {
		let mousePosition = event.clientX - this.tracksList.nativeElement.getBoundingClientRect().left + this.tracksList.nativeElement.scrollLeft;
		//Converts the mouse position to seconds
		return mousePosition/10;
	}

	setPhantomClip(event: MouseEvent, track: Track) {
		this.hoveringTrack = JSON.parse(JSON.stringify(track));
		if(!this.cs.getCurrentClip() && !this.cs.isDraggingClip() && !this.cs.getDraggedClip()) {
			return;
		}
		if(this.cs.getClipBeingResized()) {
			return;
		}
		let mousePositionSeconds = this.getMousePosition(event);

		//Sets the phantom clip to the current clip or the dragged clip
		let clip = JSON.parse(JSON.stringify(this.cs.getCurrentClip() || this.cs.getDraggedClip()));
		if(clip) {
			this.cs.setPhantomClip(Object.assign(clip, { in: 0, startTime: mousePositionSeconds }));
		}
		this.changeDetector.detectChanges();
	}

	onDrag(event: MouseEvent) {
		if(!this.cs.isDraggingClip() && !this.cs.getPhantomClip() && !this.cs.getClipBeingResized()) {
			return;
		}

		clearTimeout(this.draggingTimeout);

		let clip = this.cs.getClipBeingResized();

		if(clip) {
			//Resizes the clip
			let elementBeingResized = this.cs.getClipElementBeingResized()?.getBoundingClientRect()!;
			if(event.clientX > elementBeingResized.right - 20) {
				//Makes sure the clip can't be resized to a duration longer than the total duration
				let newDuration = this.getMousePosition(event) - clip!.startTime;
				if(newDuration > clip.totalDuration) {
					newDuration = clip.totalDuration;
				}
				//The mouse psotion in seconds - the start time of the clip
				clip!.duration = newDuration;
			}else if(event.clientX < elementBeingResized.left + 20) {
				//Shrinks the duration of the clip proportionally to the
				//new start time of the clip
				let newDuration = clip!.duration + clip!.startTime - this.getMousePosition(event);
				if(newDuration > clip.totalDuration) {
					newDuration = clip.totalDuration;
				}
				clip!.duration = newDuration;
				//Sets the point where the clip starts
				//The start point of the clip itself,
				//not start point of the clip in the timeline
				clip.in += this.getMousePosition(event) - clip!.startTime;

				clip!.startTime = this.getMousePosition(event);
			}
			//Recreates the clips array to trigger change detection
			this.hoveringTrack!.clips = [...this.hoveringTrack?.clips!];
			this.checkIfClipOverlaps(this.hoveringTrack!, clip);
			this.changeDetector.markForCheck();

			this.draggingTimeout = setTimeout(() => {
				//Updates the project file object
				this.pfService.updateTracks(this.tracks);
			}, 200);

			window.api.emit("update-track-clips", this.hoveringTrack!);
			this.renderTimeline();
		}else {
			if(this.cs.getPhantomClip()) {
				this.cs.getPhantomClip()!.startTime = this.getMousePosition(event) - this.cs.getDraggedDistanceDiff();
			}
		}
	}

	selectTrack(track: Track, index: number) {
		if(!track.clips || !track.clips.length) {
		}
		window.api.emit("set-selected-clip-in-preview", {location: null, trackIndex: index, clipIndex: null});
	}

	renderTimeline() {
		setTimeout(() => {
			let longestTrackWidth = 0;
			let roundedWidth = 0;
			this.tracksList.nativeElement.querySelectorAll(".track-contents").forEach((trackContents: any) => {
				if(trackContents.getBoundingClientRect().width > longestTrackWidth) {
					longestTrackWidth = trackContents.getBoundingClientRect().width;
				}
			});

			longestTrackWidth += 100;

			//Checks if the longest track is longer than the tracksList element
			//If it is then the timeLines and tracksList elements are set to the width of the longest track
			
			if(longestTrackWidth > this.tracksList.nativeElement.getBoundingClientRect().width) {
				this.timeLines.nativeElement.style.width = longestTrackWidth + "px";
				this.tracksList.nativeElement.style.width = longestTrackWidth + "px";
				roundedWidth = Math.round(longestTrackWidth / 50);
			}else {
				this.timeLines.nativeElement.style.width = this.tracksList.nativeElement.scrollWidth + "px";
				roundedWidth = Math.round(this.tracksList.nativeElement.scrollWidth / 50);
			}

			this.cs.phantomClip = null;

			//Calculates the number of 5 second intervals to display
			this.numbers = [];
			for(let i = 0; i < roundedWidth+1; i++) {
				this.numbers.push(i);
			}
			this.changeDetector.detectChanges();
		}, 0);
	}
}

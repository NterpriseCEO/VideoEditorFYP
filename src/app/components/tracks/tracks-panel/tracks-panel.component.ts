import { AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild } from "@angular/core";
import { TracksService } from "src/app/services/tracks.service";
import { ClipInstance, Track } from "src/app/utils/interfaces";
import { fromEvent } from "rxjs";
import { ClipService } from "src/app/services/clip.service";
import { TrackType } from "src/app/utils/constants";

@Component({
	selector: "app-tracks-panel",
	templateUrl: "./tracks-panel.component.html",
	styleUrls: ["./tracks-panel.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TracksPanelComponent implements AfterViewChecked, AfterViewInit {

	tracks: Track[] = [];
	tracksCount: number = 0;

	addingTrack: boolean = false;

	numbers: number[] = [];

	hoveringTrack: Track | null = null;
	originTrack: Track | null = null;

	@ViewChild("tracksList") tracksList!: ElementRef;
	@ViewChild("tracksDetails") tracksDetails!: ElementRef;
	@ViewChild("timeLines") timeLines!: ElementRef;
	@ViewChild("timelineNumbers") timelineNumbers!: ElementRef;

	constructor(
		public tracksService: TracksService,
		public changeDetector: ChangeDetectorRef,
		public cs: ClipService
	) {
		//Subscribes to the addTrackSubject in the tracks service
		tracksService.tracksSubject.subscribe((tracks: Track[]) => {
			//Checks if a track is being added not removed
			this.addingTrack = this.tracksCount < tracks.length;
			this.tracksCount = tracks.length;

			this.tracks = tracks;

			if(!this.addingTrack) {
				this.moveTimeLines(true);
			}

			changeDetector.detectChanges();
		});
	}

	ngAfterViewInit() {
		//Scrolls the tracks details to the same position as the tracks list
		setTimeout(() => {
			this.timeLines.nativeElement.style.width = this.tracksList.nativeElement.clientWidth + "px";

			//Divide the width of the tracksList by 50 to get the number of seconds
			let roundedWidth = Math.floor(this.tracksList.nativeElement.clientWidth / 50);
			//Populates the numbers array with the number of seconds
			this.numbers = [];
			for(let i = 0; i < roundedWidth; i++) {
				this.numbers.push(i);
			}
			this.changeDetector.detectChanges();
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
		//Creates an empty array if the track doesn't have any clips
		if(!track.clips) {
			track.clips = [];
		}
		//Returns if there is no current clip to add
		if(!this.cs.getCurrentClip() || track.type !== TrackType.VIDEO) {
			return;
		}

		//Gets the mouse position relative to the tracksList element including the scroll
		let mousePositionSeconds = this.getMousePosition(event);
		
		let newClip = JSON.parse(JSON.stringify(Object.assign(this.cs.getCurrentClip(), { in: 0, out: 100, startTime: mousePositionSeconds })));

		this.checkIfClipOverlaps(track, newClip);

		track.clips = [...track.clips, newClip];		

		//Resets the current clip so that it can't be added
		//multiple times
		this.cs.setCurrentClip(null);

		this.renderTimeline();
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
			//Checks if the current clip is inside the new clip completely
			if(clip.startTime >= newClip.startTime && clip.startTime+clip.duration <= newClip.startTime + newClip.duration) {
				//remove this clip

				track.clips = track?.clips?.filter((clip2: ClipInstance) => {
					return clip2 !== clip;
				});
				return;
			}
			//Checks if the new clip is cutting off the end of the current clip
			if(clip.startTime+clip.duration > newClip.startTime && clip.startTime+clip.duration < newClip.startTime + newClip.duration) {
				clip.duration = newClip.startTime - clip.startTime;
			}else if(newClip.startTime > clip.startTime && newClip.startTime+newClip.duration < clip.startTime+clip.duration) {
				//Checks if the new clip is inside the current clip
				//Creates a new clip with the remaining duration
				let newClip2 = JSON.parse(JSON.stringify(clip));
				clip.duration = newClip.startTime - clip.startTime;
				newClip2.startTime = newClip.startTime + newClip.duration;
				newClip2.duration -= clip.duration+newClip.duration;
				
				//insert the clip after the current clip (clip)
				track?.clips?.splice(track.clips.indexOf(clip)+1, 0, newClip2);
			}else if(newClip.startTime+newClip.duration > clip.startTime && clip.startTime+clip.duration > newClip.startTime+newClip.duration) {
				//Checks if the new clip is cutting off the start of the current clip
				clip.duration = (clip.startTime+clip.duration) - (newClip.startTime+newClip.duration);
				clip.startTime = newClip.startTime + newClip.duration;
			}
		});
	}

	completeDrag() {

		//Selects the hovering track
		this.tracksService.setSelectedTrack(this.hoveringTrack!);
		this.tracksService.filtersChangedSubject.next(null);

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
		let index = tracks.findIndex(track => track.id === this.originTrack?.id);

		//Find the index of the clip that matches currently dragged clip
		let clipIndex = this.originTrack?.clips?.findIndex((clip2: ClipInstance) => {
			return JSON.stringify(clip2) === JSON.stringify(this.cs.getDraggedClip());
		});

		//Checks if the clip is being dragged on the same track
		if(this.originTrack == this.hoveringTrack) {
			//Replace the clip with the modified version of itself
			tracks[index].clips![clipIndex!] = JSON.parse(JSON.stringify(clip));
			this.cs.setDraggedClip(null);
			this.cs.setPhantomClip(null);
		}else {

			this.cs.resetDraggedClip();

			if(this.originTrack?.type != this.hoveringTrack?.type) {
				return;
			}

			//Remove the clip from the origin track

			//Get index of track with the origin id and replace the clips array
			//with the modified version of itself
			let hoveringIndex = tracks.findIndex(track => track.id === this.hoveringTrack?.id);

			tracks[index].clips?.splice(clipIndex!, 1);

			tracks[hoveringIndex].clips?.push(JSON.parse(JSON.stringify(clip)));

			this.changeDetector.markForCheck();
		}

		this.renderTimeline();

		this.checkIfClipOverlaps(this.hoveringTrack!, clip);
	}

	deleteTrack(id: number) {
		this.tracksService.deleteTrack(id);
	}

	getMousePosition(event: MouseEvent) {
		let mousePosition = event.clientX - this.tracksList.nativeElement.getBoundingClientRect().left + this.tracksList.nativeElement.scrollLeft;
		//Converts the mouse position to seconds
		return Math.floor(mousePosition / 10);
	}

	setPhantomClip(event: MouseEvent, track: Track) {
		this.hoveringTrack = track;
		if(!this.cs.getCurrentClip() && !this.cs.isDraggingClip() && !this.cs.getDraggedClip()) {
			return;
		}
		if(this.cs.getClipBeingResized()) {
			return;
		}
		let mousePositionSeconds = this.getMousePosition(event);
		
		//Sets the phantom clip to the current clip or the dragged clip
		let clip = JSON.parse(JSON.stringify(this.cs.getCurrentClip())) || JSON.parse(JSON.stringify(this.cs.getDraggedClip()));
		
		this.cs.setPhantomClip(Object.assign(clip, { in: 0, out: 100, startTime: mousePositionSeconds }));
		this.changeDetector.detectChanges();
	}

	onDrag(event: MouseEvent) {
		if(!this.cs.isDraggingClip() && !this.cs.getPhantomClip() && !this.cs.getClipBeingResized()) {
			return;
		}

		let clip = this.cs.getClipBeingResized();

		if(clip) {
			//Resizes the clip
			let elementBeingResized = this.cs.getClipElementBeingResized()?.getBoundingClientRect()!;
			if(event.clientX > elementBeingResized.right - 20) {
				//The mouse psotion in seconds - the start time of the clip
				clip!.duration = this.getMousePosition(event) - clip!.startTime;
			}else if(event.clientX < elementBeingResized.left + 20) {
				//Shrinks the duration of the clip proportionally to the
				//new start time of the clip
				clip!.duration = clip.startTime + clip.duration - this.getMousePosition(event);
				clip!.startTime = this.getMousePosition(event);
			}
			//Recreates the clips array to trigger change detection
			this.hoveringTrack!.clips = [...this.hoveringTrack?.clips!];
			this.checkIfClipOverlaps(this.hoveringTrack!, clip);
			this.renderTimeline();
		}else {
			this.cs.getPhantomClip()!.startTime = this.getMousePosition(event) - this.cs.getDraggedDistanceDiff();
		}
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

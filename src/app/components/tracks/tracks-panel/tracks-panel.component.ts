import { AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild } from "@angular/core";
import { TracksService } from "src/app/services/tracks.service";
import { ClipInstance, Track } from "src/app/utils/interfaces";
import { MenuItem, PrimeIcons } from "primeng/api";
import { fromEvent } from "rxjs";
import { ClipInsertionService } from "src/app/services/clip-insertion.service";

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

	contextMenu: MenuItem[] = [
		{
			label: "Add track",
			icon: PrimeIcons.PLUS,
			command: () => {
				this.tracksService.addTrack();
			}
		}
	];

	numbers: number[] = [];

	phantomClip: ClipInstance | null = null;
	hoveringTrack: Track | null = null;

	@ViewChild("tracksList") tracksList!: ElementRef;
	@ViewChild("tracksDetails") tracksDetails!: ElementRef;
	@ViewChild("timeLines") timeLines!: ElementRef;
	@ViewChild("timelineNumbers") timelineNumbers!: ElementRef;

	constructor(
		public tracksService: TracksService,
		public changeDetectorRef: ChangeDetectorRef,
		private cis: ClipInsertionService
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

			changeDetectorRef.detectChanges();
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
			this.changeDetectorRef.detectChanges();
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

			this.changeDetectorRef.detectChanges();
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
		if(!this.cis.getCurrentClip()) {
			return;
		}

		//Gets the mouse position relative to the tracksList element including the scroll
		let mousePositionSeconds = this.getMousePosition(event);
		
		let newClip = JSON.parse(JSON.stringify(Object.assign(this.cis.getCurrentClip(), { in: 0, out: 100, startTime: mousePositionSeconds })));

		track.clips.map((clip: ClipInstance) => {
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
				console.log(clip.duration+newClip.duration+newClip2.duration);
				console.log(clip.duration, newClip.duration, newClip2.duration);
				
				
			}else if(newClip.startTime+newClip.duration > clip.startTime && clip.startTime+clip.duration > newClip.startTime+newClip.duration) {
				//Checks if the new clip is cutting off the start of the current clip
				clip.duration = (clip.startTime+clip.duration) - (newClip.startTime+newClip.duration);
				clip.startTime = newClip.startTime + newClip.duration;
			}
		});

		track.clips = [...track.clips, newClip];
		console.log(track.clips);
		

		//Resets the current clip so that it can't be added
		//multiple times
		this.cis.setCurrentClip(null);

		// this.timeLines.nativeElement.style.width = this.tracksList.nativeElement.scrollWidth + "px";

		let longestTrackWidth = 0;

		setTimeout(() => {
			this.tracksList.nativeElement.querySelectorAll(".track-contents").forEach((trackContents: any) => {
				if(trackContents.getBoundingClientRect().width > longestTrackWidth) {
					longestTrackWidth = trackContents.getBoundingClientRect().width;
				}
			});

			longestTrackWidth += 100;

			console.log(longestTrackWidth);
			

			if(longestTrackWidth > this.tracksList.nativeElement.getBoundingClientRect().width) {
				this.timeLines.nativeElement.style.width = longestTrackWidth + "px";
				this.tracksList.nativeElement.style.width = longestTrackWidth + "px";
			}else {
				this.timeLines.nativeElement.style.width = this.tracksList.nativeElement.scrollWidth + "px";
			}

			this.phantomClip = null;

			let roundedWidth = Math.round(longestTrackWidth / 50);
			this.numbers = [];
			for(let i = 0; i < roundedWidth+1; i++) {
				this.numbers.push(i);
			}
			this.changeDetectorRef.detectChanges();
		}, 0);
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
		if(!this.cis.getCurrentClip()) {
			return;
		}
		let mousePositionSeconds = this.getMousePosition(event);
		this.phantomClip = Object.assign(this.cis.getCurrentClip(), { in: 0, out: 100, startTime: mousePositionSeconds });
		this.changeDetectorRef.detectChanges();

		this.hoveringTrack = track;
	}
}

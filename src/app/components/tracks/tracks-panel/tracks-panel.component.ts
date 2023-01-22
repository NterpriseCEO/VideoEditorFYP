import { AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, ViewChild } from "@angular/core";
import { TracksService } from "src/app/services/tracks.service";
import { Track } from "src/app/utils/interfaces";
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

	addClip(track: Track) {
		//Creates an empty array if the track doesn't have any clips
		if(!track.clips) {
			track.clips = [];
		}
		//Returns if there is no current clip to add
		if(!this.cis.getCurrentClip()) {
			return;
		}

		//Start time and duration of each clip added together
		let totalDuration = 0;
		track.clips.forEach((clip: any) => {
			console.log(clip);
			
			totalDuration += clip.duration;
		});
		
		let newClip = JSON.parse(JSON.stringify(Object.assign(this.cis.getCurrentClip(), { in: 0, out: 100, startTime: totalDuration })));

		track.clips = [...track.clips, newClip];
		this.changeDetectorRef.markForCheck();

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

			
			if(longestTrackWidth > this.tracksList.nativeElement.getBoundingClientRect().width) {
				this.timeLines.nativeElement.style.width = longestTrackWidth + "px";
				this.tracksList.nativeElement.style.width = longestTrackWidth + "px";
			}else {
				this.timeLines.nativeElement.style.width = this.tracksList.nativeElement.scrollWidth + "px";
			}

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
}

import { AfterViewChecked, AfterViewInit, ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, OnInit, ViewChild } from "@angular/core";
import { TracksService } from "src/app/services/tracks.service";
import { Track } from "src/app/utils/interfaces";
import { MenuItem, PrimeIcons } from "primeng/api";
import { fromEvent } from "rxjs";

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

	@ViewChild("tracksList") tracksList!: ElementRef;
	@ViewChild("tracksDetails") tracksDetails!: ElementRef;
	@ViewChild("timeLines") timeLines!: ElementRef;
	@ViewChild("tracksListContent") tracksListContent!: ElementRef;

	tracksListExists: boolean = false;

	constructor(public tracksService: TracksService, changeDetectorRef: ChangeDetectorRef) {
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
		fromEvent(this.tracksList.nativeElement, "scroll").subscribe((event: any) => {
			this.tracksDetails.nativeElement.scrollTop = event.target.scrollTop;
			
			if(!this.addingTrack) {
				this.moveTimeLines();
			}
		});
	}

	ngAfterViewChecked() {

		if(!this.tracksListExists && this.tracksList) {
			this.tracksListExists = true;
			
			setTimeout(() => {
				let tracksList = this.tracksList.nativeElement.getBoundingClientRect();

				//Sets the width and height of the timeLines element in relation to the tracksList element
				this.timeLines.nativeElement.style.width = tracksList.width + "px";
				this.timeLines.nativeElement.style.height = tracksList.height + "px";
			});
		}

		//Scrolls to the bottom when a track is added
		if(this.addingTrack) {
			this.addingTrack = false;
			this.tracksList.nativeElement.scrollTop = this.tracksList.nativeElement.scrollHeight;
			//Scroll the tracksDetails to the bottom
			this.tracksDetails.nativeElement.scrollTop = this.tracksList.nativeElement.scrollHeight;

			this.moveTimeLines();
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

		this.timeLines.nativeElement.style.width = this.tracksList.nativeElement.scrollWidth + "px";
	}
}

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, ElementRef, Input, OnChanges, ViewChild } from "@angular/core";
import { ClipService } from "src/app/services/clip.service";
import { KeyboardEventsService } from "src/app/services/keyboard-events.service";
import { TracksService } from "src/app/services/tracks.service";
import { ClipInstance, Track } from "src/app/utils/interfaces";

@Component({
	selector: "app-track-contents",
	templateUrl: "./track-contents.component.html",
	styleUrls: ["./track-contents.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackContentsComponent implements OnChanges {

	@Input() clips!: ClipInstance[];
	@Input() colour!: string;

	trackWidth: number = 0;

	selectedClip: ClipInstance | null = null;

	clipToResize: HTMLElement | null = null;

	constructor(
		private changeDetector: ChangeDetectorRef,
		private keys: KeyboardEventsService,
		public cs: ClipService,
		public tracksService: TracksService
	) {
		this.keys.keypress("keyup.delete").subscribe(() => {
			//Deletes the selected clip
			if(this.selectedClip) {
				if(this.clips.indexOf(this.selectedClip) == -1) {
					return;
				}
				this.clips.splice(this.clips.indexOf(this.selectedClip), 1);
				this.selectedClip = null;
				this.changeDetector.detectChanges();
			}
		});

		cs.clipSelectionUpdateSubject.subscribe((clip: ClipInstance | null) => {
			this.selectedClip = clip;
			
			this.changeDetector.detectChanges();
		});
	}

	ngOnChanges() {
		if(this.clips.length > 0) {
			this.trackWidth = 0;

			//Finds the clip with the highest start time (not necessarily the last clip in the array)
			let lastClip = this.clips.reduce((prev, current) => (prev.startTime > current.startTime) ? prev : current);

			//Sets the width of the track = to the end coords of the last clip
			this.trackWidth = (lastClip.startTime + lastClip.duration)*10;
		}
	}

	selectClip(clip: ClipInstance, event: Event) {
		//Prevents the track from being selected when a clip is clicked
		event.stopPropagation();
		this.cs.selectClip(clip);
	}

	dragStart(clip: ClipInstance, event: MouseEvent) {
		//Checks if the user is clicking on the title of the clip or the resize handle
		if((event.target as HTMLElement).classList.contains("clip-title")) {
			this.cs.setIsDraggingClip(true);
			this.cs.setDraggedClip(JSON.parse(JSON.stringify(clip)));

			this.cs.setPhantomClip(JSON.parse(JSON.stringify(clip)));

			//Keeps iterating up the DOM tree until it finds
			//the parent element with the class "tracks-list"
			let parentNode = event.target as HTMLElement;
			while(!parentNode.classList.contains("tracks-list")) {
				parentNode = parentNode.parentNode as HTMLElement;
			}
			
			//Gets the distance between the mouse and the start of the clip
			let x = event.clientX - parentNode.getBoundingClientRect().left;
			let clipStart = this.cs.getPhantomClip()!.startTime;
			//Calculates the difference between the mouse and the start of the clip
			//This ensures that the clip start is relative to its current position
			//and not the position of the mouse
			this.cs.setDraggedDistanceDiff(Math.floor(x/10) - clipStart);
		}else if((event.target as HTMLElement).classList.contains("resize-handle")) {

			this.cs.setClipBeingResized(clip);
			this.cs.setClipElementBeingResized((event.target as HTMLElement).parentElement);
		}
	}
}

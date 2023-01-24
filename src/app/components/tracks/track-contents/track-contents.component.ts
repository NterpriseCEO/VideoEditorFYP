import { ChangeDetectionStrategy, ChangeDetectorRef, Component, Input, OnChanges } from "@angular/core";
import { ClipService } from "src/app/services/clip.service";
import { KeyboardEventsService } from "src/app/services/keyboard-events.service";
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

	isDragging: boolean = false;

	draggedClip: ClipInstance | null = null;

	constructor(
		private changeDetector: ChangeDetectorRef,
		private keys: KeyboardEventsService,
		public cs: ClipService
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

		cs.lastDraggedClipSubject.subscribe(() => {
			this.isDragging = false;

			if(!this.draggedClip) {
				return;
			}
			
			//Sets the start time of the dragged clip to the start time of the phantom clip
			//after the drag has ended
			this.draggedClip!.startTime = this.cs.getPhantomClip()!.startTime;
			this.cs.setPhantomClip(null);
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

	setDraggedClip(clip: ClipInstance, event: MouseEvent) {
		this.cs.setIsDraggingClip(true);
		this.draggedClip = clip;
		this.cs.setDraggedClip(clip);

		this.cs.setPhantomClip(JSON.parse(JSON.stringify(clip)));

		//Gets the distance between the mouse and the start of the clip
		let parentNode = event.target as HTMLElement;
		while(!parentNode.classList.contains("tracks-list")) {
			parentNode = parentNode.parentNode as HTMLElement;
		}

		let x = event.clientX - parentNode.getBoundingClientRect().left;
		let clipStart = this.cs.getPhantomClip()!.startTime;
		this.cs.setDraggedDistanceDiff(Math.floor(x/10) - clipStart);
	}
}

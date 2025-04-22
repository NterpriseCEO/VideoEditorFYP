import { ChangeDetectionStrategy, ChangeDetectorRef, Component, EventEmitter, Input, OnChanges,OnDestroy,OnInit, Output } from "@angular/core";
import { ClipService } from "src/app/services/clip.service";
import { KeyboardEventsService } from "src/app/services/keyboard-events.service";
import { TracksService } from "src/app/services/tracks.service";
import { Clip, ClipInstance, Track } from "src/app/utils/interfaces";
import { TrackHelpers } from "../track-helpers";
import { Subscription } from "rxjs";

@Component({
	selector: "app-track-contents",
	templateUrl: "./track-contents.component.html",
	styleUrls: ["./track-contents.component.scss"]
})
export class TrackContentsComponent extends TrackHelpers implements OnChanges, OnInit, OnChanges, OnDestroy {

	@Input() clips!: ClipInstance[];
	@Input() trackIndex!: number;
	@Input() colour!: string;

	@Output() clipDeleted = new EventEmitter<null>();

	trackWidth: number = 0;

	selectedClip: ClipInstance | null = null;

	clipToResize: HTMLElement | null = null;

	keyboardEventsSubscription: any = [];
	clipSelectionUpdateSubject: Subscription = new Subscription();
	zoomSliderResizeSubject: Subscription = new Subscription();

	constructor(
		private keys: KeyboardEventsService,
		changeDetector: ChangeDetectorRef,
		cs: ClipService,
		tracksService: TracksService
	) {
		super(tracksService, changeDetector, cs);
	}

	ngOnInit() {
		this.listenForEvents();
	}

	ngOnChanges() {
		if(this.clips.length > 0) {
			this.trackWidth = 0;

			let lastClip = this.lastClip();

			this.trackWidth = (lastClip.startTime + lastClip.duration) / this.msPerPX();
		}
	}

	ngOnDestroy() {
		this.keyboardEventsSubscription.forEach((subscription: any) => subscription.unsubscribe());
		this.keyboardEventsSubscription = [];

		if(this.clipSelectionUpdateSubject) this.clipSelectionUpdateSubject.unsubscribe();
		if(this.zoomSliderResizeSubject) this.zoomSliderResizeSubject.unsubscribe();
	}

	listenForEvents() {
		this.keyboardEventsSubscription.push(this.keys.keypress("keyup.delete").subscribe(() => {
			//Deletes the selected clip
			if(this.selectedClip) {
				if(this.clips.indexOf(this.selectedClip) == -1) {
					return;
				}
				this.clips.splice(this.clips.indexOf(this.selectedClip), 1);
				this.selectedClip = null;
				this.changeDetector.detectChanges();

				this.clipDeleted.emit();
			}
		}));

		//Can toggle track mute with ctrl+m
		this.keyboardEventsSubscription.push(this.keys.keypress("keyup.control.m").subscribe(() => {
			this.tracksService.toggleTrackMute(this.tracksService.tracks[this.trackIndex]);
		}));

		this.clipSelectionUpdateSubject = this.cs.clipSelectionUpdateSubject.subscribe((clip: ClipInstance | null) => {
			this.selectedClip = clip;

			this.changeDetector.detectChanges();
		});

		this.zoomSliderResizeSubject = this.tracksService.zoomSliderResizeSubject.subscribe(() => {
			if(!this.clips.length) return;
			let lastClip = this.lastClip();

			this.trackWidth = (lastClip.startTime + lastClip.duration) / this.msPerPX();
		});
	}

	selectClip(event: Event, clip?: ClipInstance) {
		//Prevents the track from being selected when a clip is clicked
		event.stopPropagation();
		let index = 0;
		if(clip) {
			this.cs.selectClip(clip);
			//Find the index of the clip in the clips array
			index = this.clips.indexOf(clip);
		}
		window.api.emit("set-selected-clip-in-preview", {location: clip?.location, trackIndex: this.trackIndex, clipIndex: index});
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

			//Gets the distance between the mouse and the start of the clips panel
			let x = this.getMousePosition(event, parentNode);
			let clipStart = this.cs.getPhantomClip()!.startTime;
			//Calculates the difference between the mouse and the start of the clip
			//This ensures that the clip start is relative to its current position
			//and not the position of the mouse
			this.cs.setDraggedDistanceDiff(x - clipStart);
		}else if((event.target as HTMLElement).classList.contains("resize-handle")) {
			this.cs.setClipBeingResized(clip);
			this.cs.setClipElementBeingResized((event.target as HTMLElement).parentElement);
		}
	}

	//Finds the clip with the highest start time (not necessarily the last clip in the array)
	lastClip(): ClipInstance {
		return this.clips?.reduce((prev, current) => (prev.startTime > current.startTime) ? prev : current);
	}
}

import { Component, EventEmitter, Input, OnChanges, OnDestroy, OnInit, Output, SimpleChanges, ViewChild } from "@angular/core";
import { ProjectFileService } from "src/app/services/project-file-service.service";
import { TracksService } from "src/app/services/tracks.service";
import { Track } from "src/app/utils/interfaces";
import { getHexBrightness } from "src/app/utils/utils";
import { SourceSelectorComponent } from "../source-selector/source-selector.component";
import { DialogService } from "primeng/dynamicdialog";
import { TrackPropertiesPopupComponent } from "../track-properties-popup/track-properties-popup.component";
import { MenuItem } from "primeng/api";
import { TrackType } from "src/app/utils/constants";
import { OverlayPanel } from "primeng/overlaypanel";
import { Subscription } from "rxjs";

@Component({
	selector: "app-track-details",
	templateUrl: "./track-details.component.html",
	styleUrls: ["./track-details.component.scss"]
})
export class TrackDetailsComponent implements OnInit, OnChanges, OnDestroy {

	@ViewChild("sourceSelector") sourceSelector!: SourceSelectorComponent;
	@ViewChild("tracksDetails") tracksDetails!: any;
	@ViewChild("op") op!: OverlayPanel;

	@Input() track!: Track;

	@Output() onTrackDelete = new EventEmitter();

	isRecording: boolean = false;

	isEditingName: boolean = false;

	titleColour: string = "white";

	trackMuteSubject: Subscription = new Subscription();

	menuItems: MenuItem[] = [
		{
			label: "Toggle recording",
			command: this.toggleRecording.bind(this)
		},
		{
			label: "Change source",
			command: this.changeSource.bind(this)
		},
		{
			label: this.track?.muted ? "Unmute track" : "Mute track",
			command: () => this.tracksService.toggleTrackMute(this.track)
		},
		{
			label: "Toggle visibility",
			command: this.toggleVisibility.bind(this)
		},
		{
			label: "Change track colour",
			command: () => this.op.toggle(new MouseEvent("click"), this.tracksDetails.nativeElement)
		},
		{
			label: "Show all properties",
			command: this.showAllProperties.bind(this)
		}
	];

	constructor(
		private tracksService: TracksService,
		private pfService: ProjectFileService,
		public dialogService: DialogService
	) { }

	ngOnInit() {
		this.listenForEvents();
	}

	ngOnChanges(changes: SimpleChanges) {
		if(changes["track"]) {
			this.titleColour = getHexBrightness(changes["track"].currentValue?.colour) > 100 ? "black" : "white";
			
			//If the track variable is being set for the first time
			if(changes["track"].firstChange) {
				//Remove the "Change source" menu item if the track is not
				//a screen capture track
				if(this.track.type !== TrackType.SCREEN_CAPTURE) {
					this.menuItems.splice(1, 1);
				}
				//Remove the "Toggle recording" menu item if the track is a video track
				if(this.track.type === TrackType.VIDEO) {
					this.menuItems.splice(0, 1)
				}

				this.setMuteLabel(this.track?.muted ?? false);
			}
		}
	}

	ngOnDestroy() {
		if(this.trackMuteSubject) this.trackMuteSubject.unsubscribe();
	}

	listenForEvents() {
		this.trackMuteSubject = this.tracksService.trackMuteSubject.subscribe((track) => {
			if(track.id === this.track.id) {
				//Sets the mute label to the opposite of the track's muted state
				this.setMuteLabel(track.muted ?? false);
			}
		});
	}

	toggleRecording() {
		this.isRecording = !this.isRecording;

		this.tracksService.setCurrentlyRecordingTrack(this.track);

		window.api.emit("toggle-recording", { isRecording: this.isRecording, track: this.track });
	}

	changeSource() {
		this.sourceSelector.showDialog();
	}

	updateSource(event: Event) {
		this.tracksService.setTrackSource(this.track.id, event);
	}

	toggleVisibility() {
		this.tracksService.toggleTrackVisibility(this.track);

		//Updates the project file object
		this.pfService.updateTracks(this.tracksService.getTracks());
	}

	showAllProperties() {
		//Opens the track properties popup
		this.dialogService.open(TrackPropertiesPopupComponent, { header: "All properties" });
	}

	setMuteLabel(isMuted: boolean) {
		//Finds the "Mute track" menu item and sets its label to "Unmute track" or vice versa
		this.menuItems.filter(({ label }) => ["Mute track", "Unmute track"].includes(label!))[0]
			.label = isMuted ? "Unmute track" : "Mute track";
		
		this.menuItems = [...this.menuItems];
	}
}

import { Component, OnInit } from "@angular/core";
import { ClipService } from "src/app/services/clip.service";
import { KeyboardEventsService } from "src/app/services/keyboard-events.service";
import { ProjectFileService } from "src/app/services/project-file-service.service";
import { TracksService } from "src/app/services/tracks.service";

@Component({
	selector: "app-main-view",
	templateUrl: "./main-view.component.html",
	styleUrls: ["./main-view.component.scss"]
})
export class MainViewComponent implements OnInit {

	insertPanelVisible = true;
	tracksPanelIsVisible = true;
	tracksPropertiesPanelIsVisible = true;
	infoPanelIsVisible = true;
	previewWindowIsVisible = true;

	fileX: number = 0;
	fileY: number = 0;
	showFileRepresentation: boolean = false;

	constructor(
		private keys: KeyboardEventsService,
		private pfService: ProjectFileService,
		private trackService: TracksService,
		private cs: ClipService
	) {}

	ngOnInit() {
		//Reads the each panel's visibility from local storage
		let insertPanelVisible = localStorage.getItem("insertPanelVisible");
		let tracksPanelIsVisible = localStorage.getItem("tracksPanelIsVisible");
		let tracksPropertiesPanelIsVisible = localStorage.getItem("tracksPropertiesPanelIsVisible");
		let infoPanelIsVisible = localStorage.getItem("infoPanelIsVisible");

		this.insertPanelVisible = insertPanelVisible === null ? true : insertPanelVisible === "true";
		this.tracksPanelIsVisible = tracksPanelIsVisible === null ? true : tracksPanelIsVisible === "true";
		this.tracksPropertiesPanelIsVisible = tracksPropertiesPanelIsVisible === null ? true : tracksPropertiesPanelIsVisible === "true";
		this.infoPanelIsVisible = infoPanelIsVisible === null ? true : infoPanelIsVisible === "true";

		this.listenForEvents();
	}
	
	listenForEvents() {
		this.keys.keypress("keyup.control.s").subscribe(() => {
			this.pfService.saveProject();
		});
		this.keys.keypress("keyup.control.z").subscribe(() => {
			this.pfService.undo();
		});
		this.keys.keypress("keyup.control.y").subscribe(() => {
			this.pfService.redo();
		});

		//ctr+0 to 9 to select a track
		for(let i = 0; i < 10; i++) {
			this.keys.keypress(`keyup.control.${i}`).subscribe(() => {
				this.trackService.selectTrackByIndex(i);
			});
		}

		//up/down to move the between tracks
		this.keys.keypress("keyup.arrowup").subscribe(() => {
			this.trackService.selectPreviousTrack();
		});
		this.keys.keypress("keyup.arrowdown").subscribe(() => {
			this.trackService.selectNextTrack();
		});

		window.api.on("preview-exited", (_, __) => {
			this.previewWindowIsVisible = false;
		});
	}

	atLeastOnePanelIsVisible(): boolean {
		return this.insertPanelVisible ||
			this.tracksPanelIsVisible ||
			this.tracksPropertiesPanelIsVisible ||
			this.infoPanelIsVisible;
	}

	togglePanel(panel: string) {
		//Toggles the visibility of a given panel
		//and saves the new state to local storage
		this[panel] = !this[panel];

		localStorage.setItem(panel, this[panel].toString());
	}

	showPreviewWindow() {
		if(!this.previewWindowIsVisible) {
			window.api.emit("open-preview-window");
		}
		this.previewWindowIsVisible = true;
	}

	moveFileRepresentation(event: any) {
		this.fileX = event.x;
		this.fileY = event.y;
	}

	startAdd(event: MouseEvent) {
		//Only shows the clip draggin UI element
		//if the left mouse button is pressed
		if(event.button !== 0) return;
		this.showFileRepresentation = this.cs.getIsAddingClip();
	}

	cancelAdd() {
		//Sets the current clip to null
		//This will stop the clip from being addable to the timeline
		this.cs.setCurrentClip(null);
		this.showFileRepresentation = false;
	}
}

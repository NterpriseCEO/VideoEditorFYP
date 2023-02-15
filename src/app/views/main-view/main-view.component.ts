import { Component } from "@angular/core";
import { KeyboardEventsService } from "src/app/services/keyboard-events.service";
import { ProjectFileService } from "src/app/services/project-file-service.service";

@Component({
	selector: "app-main-view",
	templateUrl: "./main-view.component.html",
	styleUrls: ["./main-view.component.scss"]
})
export class MainViewComponent {

	insertPanelVisible = true;
	tracksPanelIsVisible = true;
	tracksPropertiesPanelIsVisible = true;
	infoPanelIsVisible = true;
	previewWindowIsVisible = true;

	constructor(private keys: KeyboardEventsService, private pfService: ProjectFileService) {
		//Reads the each panel"s visibility from local storage
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
}

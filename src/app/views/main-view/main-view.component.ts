import { Component } from "@angular/core";

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

	constructor() {
		//Reads the each panel"s visibility from local storage
		let insertPanelVisible = localStorage.getItem("insertPanelVisible");
		let tracksPanelIsVisible = localStorage.getItem("tracksPanelIsVisible");
		let tracksPropertiesPanelIsVisible = localStorage.getItem("tracksPropertiesPanelIsVisible");
		let infoPanelIsVisible = localStorage.getItem("infoPanelIsVisible");

		this.insertPanelVisible = insertPanelVisible === null ? true : insertPanelVisible === "true";
		this.tracksPanelIsVisible = tracksPanelIsVisible === null ? true : tracksPanelIsVisible === "true";
		this.tracksPropertiesPanelIsVisible = tracksPropertiesPanelIsVisible === null ? true : tracksPropertiesPanelIsVisible === "true";
		this.infoPanelIsVisible = infoPanelIsVisible === null ? true : infoPanelIsVisible === "true";
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
}

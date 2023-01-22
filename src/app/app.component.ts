import { Component } from "@angular/core";
import { ClipInsertionService } from "./services/clip-insertion.service";

declare global {
	interface Window {
		api?: any;
		getDisplayMedia?: any;
	}
}

@Component({
	selector: "app-root",
	templateUrl: "./app.component.html",
	styleUrls: ["./app.component.scss"]
})
export class AppComponent {

	title = "VideoEditor";

	fileX: number = 0;
	fileY: number = 0;
	showFileRepresentation: boolean = false;

	constructor(private cis: ClipInsertionService) {}

	moveFileRepresentation(event: any) {
		this.fileX = event.x;
		this.fileY = event.y;
	}


	startAdd() {
		this.showFileRepresentation = this.cis.getIsAddingClip();
	}

	cancelAdd() {
		//Sets the current clip to null
		//This will stop the clip from being addable to the timeline
		this.cis.setCurrentClip(null);
		this.showFileRepresentation = false;
	}
}
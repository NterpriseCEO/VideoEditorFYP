import { Component } from "@angular/core";
import { ClipService } from "./services/clip.service";

declare global {
	interface Window {
		api?: any;
		getDisplayMedia?: any;
	}
	// interface HTMLCanvasElement {
	// 	captureStream(frameRate?: number): MediaStream;
	// }
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

	constructor(private cs: ClipService) {}

	moveFileRepresentation(event: any) {
		this.fileX = event.x;
		this.fileY = event.y;
	}


	startAdd() {
		this.showFileRepresentation = this.cs.getIsAddingClip();
	}

	cancelAdd() {
		//Sets the current clip to null
		//This will stop the clip from being addable to the timeline
		this.cs.setCurrentClip(null);
		this.showFileRepresentation = false;
	}
}
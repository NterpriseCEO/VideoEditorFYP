import { Component, NgZone } from "@angular/core";
import { ClipService } from "./services/clip.service";
import { Router } from "@angular/router";
import { ProjectFileService } from "./services/project-file-service.service";
import { ConfirmationService, ConfirmEventType } from "primeng/api";
import { Title } from "@angular/platform-browser";

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

	constructor(
		private cs: ClipService,
		public router: Router,
		private pfService: ProjectFileService,
		private confirmationService: ConfirmationService,
		private ngZone: NgZone,
		private titleService: Title
	) {
		this.titleService.setTitle("GraphX");
		this.listenForEvents();
	}

	listenForEvents() {
		window.api.on("check-if-can-exit", () => this.ngZone.run(() => {
			//If there are no unsaved changes, exit the app

			if (!this.pfService.isProjectDirty()) {
				window.api.emit("exit");
				return;
			}

			this.confirmationService.confirm({
				message: "Do you want to save this project first?",
				icon: "pi pi-exclamation-triangle",
				accept: () => {
					this.pfService.saveProject();
					this.pfService.projectSavedSubject.subscribe(() => {
						window.api.emit("exit");
					});
				},
				reject: (type: ConfirmEventType) => {
					if(type === ConfirmEventType.REJECT) {
						window.api.emit("exit");
					}
				}
			});
		}));
	}

	moveFileRepresentation(event: any) {
		this.fileX = event.x;
		this.fileY = event.y;
	}

	startAdd() {
		this.showFileRepresentation = this.cs.getIsAddingClip();
	}

	isNotPopup() {
		return this.router.url !== "/mainview" &&
			this.router.url !== "/startup" &&
			this.router.url !== "/preview" &&
			this.router.url !== "/manual";
	}

	cancelAdd() {
		//Sets the current clip to null
		//This will stop the clip from being addable to the timeline
		this.cs.setCurrentClip(null);
		this.showFileRepresentation = false;
	}
}
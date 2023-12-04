import { Component, NgZone, OnInit } from "@angular/core";
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
export class AppComponent implements OnInit {

	title = "VideoEditor";

	constructor(
		public router: Router,
		private pfService: ProjectFileService,
		private confirmationService: ConfirmationService,
		private ngZone: NgZone,
		private titleService: Title
	) {}

	ngOnInit() {
		this.titleService.setTitle("GraphX");
		this.listenForEvents();
	}

	listenForEvents() {
		window.api.on("check-if-can-exit", () => this.ngZone.run(() => {
			//If there are no unsaved changes, exit the app
			if(!this.pfService.isProjectDirty() || this.router.url === "/startup") {
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

	isNotPopup() {
		return this.router.url !== "/mainview" &&
			this.router.url !== "/startup" &&
			this.router.url !== "/preview" &&
			!this.router.url.startsWith("/manual");
	}
}
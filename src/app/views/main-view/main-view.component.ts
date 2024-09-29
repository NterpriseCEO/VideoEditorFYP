import { AfterViewInit, Component, OnInit, ViewChild } from "@angular/core";
import { ConfirmationService, ConfirmEventType } from "primeng/api";
import { TabView } from "primeng/tabview";
import { ClipService } from "src/app/services/clip.service";
import { KeyboardEventsService } from "src/app/services/keyboard-events.service";
import { ProjectFileService } from "src/app/services/project-file-service.service";
import { TracksService } from "src/app/services/tracks.service";

@Component({
	selector: "app-main-view",
	templateUrl: "./main-view.component.html",
	styleUrls: ["./main-view.component.scss"]
})
export class MainViewComponent implements OnInit, AfterViewInit {
	
	@ViewChild("projectsTabs") projectsTabs: any;

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
		protected pfService: ProjectFileService,
		private trackService: TracksService,
		private cs: ClipService,
		private confirmationService: ConfirmationService
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

	ngAfterViewInit() {
		// Accesses the tabview component and adds a button to at the end of the tabs
		const nav_header = (this.projectsTabs.content.nativeElement as HTMLElement).firstChild;
		const button = document.createElement("button");
		button.innerHTML = "+";
		button.classList.add("p-button", "p-button-text");
		button.onclick = () => {
			this.addTab();
			// Unfocuses the button
			button.blur();
		};
		nav_header?.appendChild(button);
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
	addTab() {
		this.pfService.loadProject();
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
		window.api.emit("open-preview-window");
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

	closeProject(projectIndex: number) {
		if(this.pfService.isProjectDirty(projectIndex)) {
			this.confirmationService.confirm({
				message: "Do you want to save this project first?",
				icon: "pi pi-exclamation-triangle",
				accept: () => {
					// TODO: Adding saving check for multiple projects
					this.pfService.saveProject();
					this.pfService.projectSavedSubject.subscribe(() => {
						this.pfService.closeProject(projectIndex);
					});
				},
				reject: (type: ConfirmEventType) => {
					if(type === ConfirmEventType.REJECT) {
						this.pfService.closeProject(projectIndex);
					}
				}
			});
		}else {
			this.pfService.closeProject(projectIndex);
		}
	}
}

import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, ViewChild } from "@angular/core";
import { ConfirmationService, ConfirmEventType, MenuItem, PrimeIcons } from "primeng/api";
import { Router } from "@angular/router";

import { TracksService } from "src/app/services/tracks.service";
import { TrackType } from "src/app/utils/constants";
import { SourceSelectorComponent } from "../tracks/source-selector/source-selector.component";
import { ProjectFileService } from "src/app/services/project-file-service.service";

@Component({
	selector: "app-editor-toolbar",
	templateUrl: "./editor-toolbar.component.html",
	styleUrls: ["./editor-toolbar.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class EditorToollbarComponent {

	@ViewChild("sourceSelector") sourceSelector!: SourceSelectorComponent;

	title = "Editor Toolbar";

	items:MenuItem[] = [
		{
			label: "File",
			items: [
				{
					label: "New Project",
					icon: PrimeIcons.PLUS,
					command: () => {
						if(this.pfService.isProjectDirty()) {
							this.confirmationService.confirm({
								message: "Do you want to save this project first?",
								icon: "pi pi-exclamation-triangle",
								accept: () => {
									this.pfService.saveProject();
									this.pfService.projectSavedSubject.subscribe(() => {
										this.pfService.createBlankProject();
									});
								},
								reject: (type: ConfirmEventType) => {
									if(type === ConfirmEventType.REJECT) {
										this.pfService.createBlankProject();
									}
								}
							});
						}else {
							this.pfService.createBlankProject();
						}
					}
				},
				{
					label: "Add track",
					icon: PrimeIcons.PLUS,
					items: [
						{
							label: "Video",
							icon: PrimeIcons.PLUS,
							command: () => {
								this.tracksService.addTrack(TrackType.VIDEO);
							}
						},
						{
							label: "Webcam",
							icon: PrimeIcons.PLUS,
							command: () => {
								this.tracksService.addTrack(TrackType.WEBCAM);
							}
						},
						{
							label: "Screen capture",
							icon: PrimeIcons.PLUS,
							command: () => {
								this.sourceSelector.showDialog();
							}
						}
					]
				},
				{
					label: "Open Project",
					icon: PrimeIcons.FILE,
					command: () => {
						if(this.pfService.isProjectDirty()) {
							this.confirmationService.confirm({
								message: "Do you want to save this project first?",
								icon: "pi pi-exclamation-triangle",
								accept: () => {
									this.pfService.saveProject();
									this.pfService.projectSavedSubject.subscribe(() => {
										this.pfService.projectSavedSubject.unsubscribe();
										this.pfService.loadProject();
									});
								},
								reject: (type: ConfirmEventType) => {
									if(type === ConfirmEventType.REJECT) {
										this.pfService.loadProject();
									}
								}
							});
						}else {
							this.pfService.loadProject();
						}
					}
				},
				{
					label: "Save Project",
					icon: PrimeIcons.SAVE,
					command: () => {
						this.pfService.saveProject();
					}
				},
				{
					label: "Save Project As",
					icon: PrimeIcons.SAVE,
					command: () => {
						this.pfService.saveProjectAs();
					}
				},
				{
					label: "Exit to start view",
					icon: PrimeIcons.SIGN_OUT,
					command: () => {
						if(this.pfService.isProjectDirty()) {
							this.confirmationService.confirm({
								message: "Do you want to save this project first?",
								icon: "pi pi-exclamation-triangle",
								accept: () => {
									this.pfService.saveProject();
									this.pfService.projectSavedSubject.subscribe(() => {
										window.api.emit("exit-to-start-view");
										this.router.navigate(["/startup"]);
										this.pfService.projectSavedSubject.unsubscribe();
									});
								},
								reject: (type: ConfirmEventType) => {
									if(type === ConfirmEventType.REJECT) {
										window.api.emit("exit-to-start-view");
										this.router.navigate(["/startup"]);
									}
								}
							});
						}else {
							window.api.emit("exit-to-start-view");
							this.router.navigate(["/startup"]);
						}
					}
				},
				{
					label: "Exit",
					icon: PrimeIcons.SIGN_OUT,
					command: () => {
						if(this.pfService.isProjectDirty()) {
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
						}else {
							window.api.emit("exit");
						}
					}
				}
			]
		},
		{
			label: "Edit",
			items: [
				{
					label: "Undo",
					icon: PrimeIcons.UNDO,
					command: () => {
						this.pfService.undo();
					}
				},
				{
					label: "Redo",
					icon: PrimeIcons.REFRESH,
					command: () => {
						this.pfService.redo();
					}
				}
			]
		},
		{
			label: "Settings",
			icon: PrimeIcons.COG,
			command: () => {
				this.router.navigate([{ outlets: { primary: ["mainview"], panelOutlet: ["settings"] } }]);
			}
		},
		{
			label: "Exports",
			icon: "pi pi-fw pi-file-export",
			command: () => {
				this.router.navigate([{ outlets: { primary: ["mainview"], panelOutlet: ["exports"] } }]);
			}
		}
	];

	projectName: string = "Untitled project";

	isRecording: boolean = false;

	isPlaying: boolean = false;

	constructor(
		private tracksService: TracksService,
		private router: Router,
		private pfService: ProjectFileService,
		private confirmationService: ConfirmationService,
		private ngZone: NgZone,
		private changeDetector: ChangeDetectorRef,
	) {
		this.listenForEvents();
	}

	listenForEvents() {
		//Is triggered when a project is loaded
		this.pfService.loadProjectNameSubject.subscribe((name: string) => {
			this.projectName = name;
			this.changeDetector.detectChanges();
		});

		window.api.on("update-play-video-button", (_:any, data: any) => this.ngZone.run(() => {
			this.isPlaying = data.isPlaying;
			this.tracksService.isPlayingSubject.next([data.isPlaying, data.isFinishedPlaying]);
			this.changeDetector.detectChanges();
		}));
	}

	createScreenCaptureTrack(event: any) {
		this.tracksService.addTrack(TrackType.SCREEN_CAPTURE, event);
	}

	updateProjectName() {
		this.pfService.setProjectName(this.projectName);
	}

	toggleRecording() {
		this.isRecording = !this.isRecording;

		window.api.emit("toggle-recording-all", this.isRecording);
	}

	togglePlaying() {
		this.isPlaying = !this.isPlaying;
		this.tracksService.isPlayingSubject.next([this.isPlaying, false]);
		window.api.emit("toggle-playing", this.isPlaying);
	}

	rewind() {
		window.api.emit("rewind-to-start");
		this.tracksService.isPlayingSubject.next([false, true]);
	}
}

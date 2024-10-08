import { ChangeDetectionStrategy, ChangeDetectorRef, Component, NgZone, OnInit, ViewChild } from "@angular/core";
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
export class EditorToollbarComponent implements OnInit {

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
						if(this.pfService.areProjectsDirty()) {
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
							label: "Audio",
							icon: PrimeIcons.PLUS,
							command: () => {
								this.tracksService.addTrack(TrackType.AUDIO);
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
						},
						{
							label: "Image",
							icon: PrimeIcons.PLUS,
							command: () => {
								this.tracksService.addTrack(TrackType.IMAGE);
							}
						}
					]
				},
				{
					label: "Open Project",
					icon: PrimeIcons.FILE,
					command: () => {
						this.pfService.loadProject();
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
					label: "Zip Project",
					icon: PrimeIcons.DOWNLOAD,
					command: () => {
						this.pfService.zipProject();
					}
				},
				{
					label: "Unzip Project",
					icon: PrimeIcons.UPLOAD,
					command: () => {
						this.pfService.unzipProject();
					}
				},
				{
					label: "Exit to start view",
					icon: PrimeIcons.SIGN_OUT,
					command: () => {
						if(this.pfService.areProjectsDirty()) {
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
						if(this.pfService.areProjectsDirty()) {
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
		},
		{
			label: "Manual",
			icon: PrimeIcons.QUESTION,
			command: () => {
				window.api.emit("open-manual");
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
	) {}

	ngOnInit() {
		this.listenForEvents();
	}

	listenForEvents() {
		//Is triggered when a project is loaded
		this.pfService.loadProjectNameSubject.subscribe((name: string) => {
			this.projectName = name;
			this.changeDetector.detectChanges();
		});

		// Is triggered when the source selector is reqested to be shown
		// from inside the track service
		this.tracksService.sourceSelectorTriggerSubject.subscribe(() => {
			this.sourceSelector.showDialog();
			this.changeDetector.detectChanges();
		});

		window.api.on("update-play-video-button", (_:any, data: any) => this.ngZone.run(() => {
			this.isPlaying = data.isPlaying;
			this.tracksService.previewStateSubject.next({
				isPlaying: data.isPlaying,
				isFinishedPlaying: data.isFinishedPlaying,
				currentTime: data?.currentTime
			});
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
		//Checks if the preview window is open before toggling playing
		window.api.emit("toggle-playing", this.isPlaying);
		window.api.on("preview-window-is-open", (_, isOpen) => {
			if(!isOpen) {
				this.isPlaying = false;
			}
			this.tracksService.previewStateSubject.next({
				isPlaying: this.isPlaying,
				isFinishedPlaying: false
			});

			this.changeDetector.detectChanges();
		});
	}

	rewind() {
		window.api.emit("rewind-to-start");
		this.isPlaying = false;
		this.tracksService.previewStateSubject.next({
			isPlaying: false,
			isFinishedPlaying: true
		});
	}
}

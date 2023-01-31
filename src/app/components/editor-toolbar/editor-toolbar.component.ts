import { Component, ViewChild } from "@angular/core";
import { MenuItem, PrimeIcons } from "primeng/api";
import { TracksService } from "src/app/services/tracks.service";
import { TrackType } from "src/app/utils/constants";
import { SourceSelectorComponent } from "../tracks/source-selector/source-selector.component";

@Component({
	selector: "app-editor-toolbar",
	templateUrl: "./editor-toolbar.component.html",
	styleUrls: ["./editor-toolbar.component.scss"]
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
						alert("Creating a new project");
					}
				},
				{
					label: "Add track",
					icon: PrimeIcons.PLUS,
					command: () => {
						this.tracksService.addTrack(TrackType.VIDEO);
					},
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
						alert("Opening a project");
					}
				},
				{
					label: "Save Project",
					icon: PrimeIcons.SAVE,
					command: () => {
						alert("Saving the project");
					}
				},
				{
					label: "Save Project As",
					icon: PrimeIcons.SAVE,
					command: () => {
						alert("Saving the project as");
					}
				},
				{
					label: "Export Project",
					icon: "pi pi-fw pi-file-export",
					command: () => {
						alert("Exporting the project");
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
						alert("Undoing");
					}
				},
				{
					label: "Redo",
					icon: PrimeIcons.REFRESH,
					command: () => {
						alert("Redoing");
					}
				}
			]
		},
		{
			label: "View",
			items: [
				{
					label: "Blah",
					command: () => {
						alert("Blah");
					}
				},
				{
					label: "Blah",
					command: () => {
						alert("Blah");
					}
				},
				{
					label: "Blah",
					command: () => {
						alert("Blah");
					}
				}
			]
		}
	]

	constructor(private tracksService: TracksService) { }

	createScreenCaptureTrack(event: any) {
		this.tracksService.addTrack(TrackType.SCREEN_CAPTURE, event);
	}
}

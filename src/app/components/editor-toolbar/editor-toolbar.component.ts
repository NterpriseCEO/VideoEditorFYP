import { Component } from "@angular/core";
import { MenuItem, PrimeIcons } from "primeng/api";
import { TracksService } from "src/app/services/tracks.service";

@Component({
	selector: "app-editor-toolbar",
	templateUrl: "./editor-toolbar.component.html",
	styleUrls: ["./editor-toolbar.component.scss"]
})
export class EditorToollbarComponent {

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
						this.tracksService.addTrack();
					},
					items: [
						{
							label: "Video",
							icon: PrimeIcons.PLUS,
							command: () => {
								alert("Adding a video track");
							}
						},
						{
							label: "Webcam",
							icon: PrimeIcons.PLUS,
							command: () => {
								alert("Adding a webcam track");
							}
						},
						{
							label: "Screen capture",
							icon: PrimeIcons.PLUS,
							command: () => {
								alert("Adding a screen capture track");
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
}

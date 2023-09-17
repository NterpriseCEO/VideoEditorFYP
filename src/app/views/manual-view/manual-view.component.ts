import { Component, OnInit } from "@angular/core";
import { Title } from "@angular/platform-browser";
import { MenuItem, PrimeIcons } from "primeng/api";

@Component({
	selector: "app-manual-view",
	templateUrl: "./manual-view.component.html",
	styleUrls: ["./manual-view.component.scss"]
})
export class ManualViewComponent implements OnInit {

	activeManualPage: number = 0;

	manualPages: MenuItem[] = [
		{
			label: "Creating project files",
			icon: "pi pi-file-edit",
			command: () => {
				this.activeManualPage = 0;
				// this.router.navigate([{ outlets: { primary: ["manual"], manualOutlet: ["creating-files"] } }]);
			}
		},
		{
			label: "Navigating the main view",
			icon: PrimeIcons.MAP,
			command: () => {
				this.activeManualPage = 1;
				// this.router.navigate([{ outlets: { primary: ["manual"], manualOutlet: ["navigating-screen"] } }]);
			}
		},
		{
			label: "Navigating the video previewer",
			icon: PrimeIcons.CAMERA,
			command: () => {
				this.activeManualPage = 2;
			}
		},
		{
			label: "Adding tracks",
			icon: PrimeIcons.LIST,
			command: () => {
				this.activeManualPage = 3;
			}
		},
		{
			label: "Importing clips",
			icon: "pi pi-file-import",
			command: () => {
				this.activeManualPage = 4;
			}
		},
		{
			label: "Working with tracks",
			icon: PrimeIcons.LIST,
			command: () => {
				this.activeManualPage = 5;
			}
		},
		{
			label: "Working with filters",
			icon: PrimeIcons.SLIDERS_H,
			command: () => {
				this.activeManualPage = 6;
			}
		},
		{
			label: "The Project Exporter",
			icon: "pi pi-file-export",
			command: () => {
				this.activeManualPage = 7;
			}
		}
	];

	constructor(
		private titleService: Title
	) {}

	ngOnInit() {
		this.titleService.setTitle("GraphX Manual");
	}
}

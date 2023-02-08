import { Component } from "@angular/core";
import { MenuItem, PrimeIcons } from "primeng/api";

@Component({
	selector: "app-settings-view",
	templateUrl: "./settings-view.component.html",
	styleUrls: ["./settings-view.component.scss"]
})
export class SettingsViewComponent {

	activeSettingsPage: number = 0;

	settingsPages: MenuItem[] = [
		{
			label: "General",
			icon: PrimeIcons.COG,
			command: () => {
				this.activeSettingsPage = 0;
			}
		},
		{
			label: "Audio",
			icon: PrimeIcons.VOLUME_UP,
			command: () => {
				this.activeSettingsPage = 1;
			}
		},
		{
			label: "Video",
			icon: PrimeIcons.VIDEO,
			command: () => {
				this.activeSettingsPage = 2;
			}
		},
		{
			label: "Keyboard Shortcuts",
			icon: PrimeIcons.KEY,
			command: () => {
				this.activeSettingsPage = 3;
			}
		}
	];

	constructor() { }
}

import { Component, NgZone } from "@angular/core";
import { Router } from "@angular/router";
import { MenuItem } from "primeng/api";

@Component({
	selector: "app-startup-view",
	templateUrl: "./startup-view.component.html",
	styleUrls: ["./startup-view.component.scss"]
})
export class StartupViewComponent {

	recentProjects = [];

	items: MenuItem[] = [
		{
			label: "New Project",
			command: () => {
				this.createBlankProject();
			}
		},
		{
			label: "Open Project",
			command: () => {
				this.openProject();
			}
		}
	];

	constructor(
		private router: Router,
		private ngZone: NgZone
	) {
		//read recentProjects from local storage
		let recentProjects = localStorage.getItem("recentProjects");
		if (recentProjects) {
			this.recentProjects = JSON.parse(recentProjects);
		}
	}

	createBlankProject() {
		window.api.emit("create-blank-project", {
			name: "Untitled Project",
			dateCreated: new Date(),
			lastModifiedDate: new Date(),
			location: "",
			clips: [],
			tracks: []
		});

		window.api.once("project-created", (_:any, location: string) => this.ngZone.run(() => {
			this.openProjectFromLocation(location);
		}));
	}

	openProject() {
		window.api.emit("open-preview-window");
		this.router.navigate(["/mainview"]);
		window.api.emit("load-project");
	}

	openProjectFromLocation(location: string) {
		window.api.emit("open-preview-window");
		this.router.navigate(["/mainview"]);
		window.api.emit("load-project-from-location", location);
	}

	openManual() {
		window.api.emit("open-manual")
	}

	sayNoMessage() {
		alert("This doesn't exist yet!");
	}
}

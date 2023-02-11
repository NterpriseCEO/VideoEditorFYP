import { Component } from "@angular/core";
import { Router } from "@angular/router";

@Component({
	selector: "app-startup-view",
	templateUrl: "./startup-view.component.html",
	styleUrls: ["./startup-view.component.scss"]
})
export class StartupViewComponent {

	recentProjects = [];

	constructor(
		private router: Router
	) {
		//read recentProjects from local storage
		let recentProjects = localStorage.getItem("recentProjects");
		if (recentProjects) {
			this.recentProjects = JSON.parse(recentProjects);
		}
	}

	openEditor() {
		window.api.emit("open-preview-window");
		this.router.navigate(["/mainview"]);
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
}

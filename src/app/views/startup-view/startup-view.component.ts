import { Component } from "@angular/core";
import { Router } from "@angular/router";

@Component({
	selector: "app-startup-view",
	templateUrl: "./startup-view.component.html",
	styleUrls: ["./startup-view.component.scss"]
})
export class StartupViewComponent {

	recentProjects = [
		{
			name: "Project 1",
			date: "2020-01-01",
			location: "C:\\Users\\User\\Documents\\Project 1C:\\Users\\User\\Documents\\Project 1"
		},
		{
			name: "Project 2",
			date: "2020-01-01",
			location: "C:\\Users\\User\\Documents\\Project 2"
		},
		{
			name: "Project 3",
			date: "2020-01-01",
			location: "C:\\Users\\User\\Documents\\Project 3"
		},
		{
			name: "Project 4",
			date: "2020-01-01",
			location: "C:\\Users\\User\\Documents\\Project 4"
		},
		{
			name: "Project 5",
			date: "2020-01-01",
			location: "C:\\Users\\User\\Documents\\Project 5"
		}
	];

	constructor(
		private router: Router
	) { }

	openEditor() {
		window.api.emit("open-preview-window");
		this.router.navigate(["/mainview"]);
	}

	openProject() {
		window.api.emit("open-preview-window");
		this.router.navigate(["/mainview"]);
		window.api.emit("load-project");
	}
}

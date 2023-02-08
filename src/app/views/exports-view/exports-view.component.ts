import { Component } from "@angular/core";

@Component({
	selector: "app-exports-view",
	templateUrl: "./exports-view.component.html",
	styleUrls: ["./exports-view.component.scss"]
})
export class ExportsViewComponent {

	recentExports = [
		{
			file: "Export1.mp4",
			date: "2020-01-01",
			location: "C:\\Users\\User\\Documents\\Project 1"
		},
		{
			file: "Export2.mp4",
			date: "2020-01-01",
			location: "C:\\Users\\User\\Documents\\Project 2"
		},
		{
			file: "Export3.mp4",
			date: "2020-01-01",
			location: "C:\\Users\\User\\Documents\\Project 3"
		},
		{
			file: "Export4.mp4",
			date: "2020-01-01",
			location: "C:\\Users\\User\\Documents\\Project 4"
		},
		{
			file: "Export5.mp4",
			date: "2020-01-01",
			location: "C:\\Users\\User\\Documents\\Project 5"
		},
	];

	exportProgress = 0;

	interval: any;

	constructor() {
		this.interval = setInterval(() => {
			if (this.exportProgress < 100) {
				this.exportProgress++;
			}else {
				this.exportProgress = 0;
			}
		}, 1000);
	}

	ngOnDestroy() {
		clearInterval(this.interval);
	}
}

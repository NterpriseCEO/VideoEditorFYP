import { Component } from "@angular/core";
import { Title } from "@angular/platform-browser";

@Component({
	selector: "app-manual-view",
	templateUrl: "./manual-view.component.html",
	styleUrls: ["./manual-view.component.scss"]
})
export class ManualViewComponent {

	constructor(private titleService: Title) {
		this.titleService.setTitle("GraphX Manual");
	}
}

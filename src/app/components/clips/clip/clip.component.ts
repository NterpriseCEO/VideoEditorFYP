import { Component, Input } from "@angular/core";

@Component({
	selector: "app-clip",
	templateUrl: "./clip.component.html",
	styleUrls: ["./clip.component.scss"]
})
export class ClipComponent {

	@Input() colour!: string;

	constructor() { }
}

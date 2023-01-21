import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { getHexBrightness } from "src/app/utils/utils";

@Component({
	selector: "app-clip",
	templateUrl: "./clip.component.html",
	styleUrls: ["./clip.component.scss"]
})
export class ClipComponent implements OnChanges {

	@Input() colour!: string;

	titleColour: string = "white";

	constructor() { }

	ngOnChanges(changes: SimpleChanges): void {
		if(changes["colour"]) {
			this.titleColour = getHexBrightness(this.colour) > 100 ? "black" : "white";
		}
	}
}

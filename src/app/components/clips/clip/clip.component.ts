import { Component, Input, OnChanges, SimpleChanges } from "@angular/core";
import { ClipInstance } from "src/app/utils/interfaces";
import { getHexBrightness } from "src/app/utils/utils";

@Component({
	selector: "app-clip",
	templateUrl: "./clip.component.html",
	styleUrls: ["./clip.component.scss"]
})
export class ClipComponent implements OnChanges {

	@Input() colour!: string;
	@Input() clip!: ClipInstance;

	titleColour: string = "white";

	brokenImage: string = "assets/clip-icon.png";

	constructor() { }

	ngOnChanges(changes: SimpleChanges): void {
		if(changes["colour"]) {
			this.titleColour = getHexBrightness(this.colour) > 100 ? "black" : "white";
		}
	}
}

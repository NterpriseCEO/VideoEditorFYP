import { ChangeDetectionStrategy, Component, EventEmitter, Input, Output, ViewChild } from "@angular/core";
import { ClipInstance, Track } from "src/app/utils/interfaces";

@Component({
	selector: "app-track-contents",
	templateUrl: "./track-contents.component.html",
	styleUrls: ["./track-contents.component.scss"],
	changeDetection: ChangeDetectionStrategy.OnPush
})
export class TrackContentsComponent {

	@Input() clips!: ClipInstance[];
	@Input() colour!: string;

	randomList: number[] = [];

	constructor() {
		//fill randomList with a random amount of numbers
		for(let i = 0; i < Math.floor(Math.random() * 3)+2; i++) {
			this.randomList.push(Math.floor(Math.random() * 3))+2;
		}
	}
}

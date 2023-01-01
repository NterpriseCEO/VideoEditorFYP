import { Component, EventEmitter, Input, OnInit, Output } from "@angular/core";

@Component({
	selector: "app-track",
	templateUrl: "./track.component.html",
	styleUrls: ["./track.component.scss"]
})
export class TrackComponent {

	@Input() trackName!: string;

	//Output ontrackDelete event
	@Output() onTrackDelete = new EventEmitter();

	constructor() { }

}

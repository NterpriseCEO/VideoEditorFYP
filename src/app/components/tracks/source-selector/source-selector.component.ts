import { Component, EventEmitter, Input, NgZone, OnInit, Output } from "@angular/core";

@Component({
	selector: "app-source-selector",
	templateUrl: "./source-selector.component.html",
	styleUrls: ["./source-selector.component.scss"]
})
export class SourceSelectorComponent implements OnInit {

	@Input() showButton: boolean = false;

	@Output() sourceSelected = new EventEmitter();

	display: boolean = false;

	screenShareSources: any[] = [];

	constructor(private ngZone: NgZone) {}

	ngOnInit() {
		this.getScreenShareSources();
	}

	getScreenShareSources() {
		window.api.emit("get-screenshare-options");
		window.api.on("screenshare-options", (_, sources) => this.ngZone.run(() => {
			this.screenShareSources = sources;
		}));
	}

	showDialog() {
		this.getScreenShareSources();
		this.display = true;
	}

	selectSource(source: string, sourceId: string = "") {
		//Sends the new source to the main process and on to the preview window
		this.sourceSelected.emit({source: source, sourceId: sourceId});
		this.display = false;
	}
}

import { Component, EventEmitter, Input, Output } from "@angular/core";

@Component({
	selector: "app-info-panel",
	templateUrl: "./info-panel.component.html",
	styleUrls: ["./info-panel.component.scss"]
})
export class InfoPanelComponent {

	@Input() isVisible: boolean = true;
	@Output() isVisibleChange = new EventEmitter<boolean>();

	constructor() { }

	toggleInfoPanel() {
		this.isVisible = !this.isVisible;
		this.isVisibleChange.emit(this.isVisible);
	}
}

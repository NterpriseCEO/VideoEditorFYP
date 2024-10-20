import { AfterViewInit, Component, EventEmitter, Input, OnDestroy, Output } from "@angular/core";
import panels from "./panel-descriptors.json";
import { fromEvent, Subscription } from "rxjs";

@Component({
	selector: "app-info-panel",
	templateUrl: "./info-panel.component.html",
	styleUrls: ["./info-panel.component.scss"]
})
export class InfoPanelComponent implements AfterViewInit, OnDestroy{

	@Input() isVisible: boolean = true;
	@Output() isVisibleChange = new EventEmitter<boolean>();

	title: string = panels[0].title;
	description: string = panels[0].description;

	hoverEvents: Subscription[] = [];

	constructor() {}

	ngAfterViewInit() {
		panels.forEach(panel => {
			console.log(panel.selector);
			
			this.hoverEvents.push(fromEvent(document.querySelectorAll(panel.selector), "mouseover").subscribe(() => {
				this.title = panel.title;
				this.description = panel.description;
			}));
		});
	}

	toggleInfoPanel() {
		this.isVisible = !this.isVisible;
		this.isVisibleChange.emit(this.isVisible);
	}

	ngOnDestroy() {
		this.hoverEvents.forEach(event => event.unsubscribe());
	}
}

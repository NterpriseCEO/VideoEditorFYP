import { Component } from '@angular/core';

@Component({
	selector: 'app-main-view',
	templateUrl: './main-view.component.html',
	styleUrls: ['./main-view.component.scss']
})
export class MainViewComponent {

	importsPanelIsVisible = true;
	filterSelectPanelIsVisible = true;
	tracksPanelIsVisible = true;
	tracksPropertiesPanelIsVisible = true;
	infoPanelIsVisible = true;

	constructor() {}

	atLeastOnePanelIsVisible(): boolean {
		return this.importsPanelIsVisible ||
			this.filterSelectPanelIsVisible ||
			this.tracksPanelIsVisible ||
			this.tracksPropertiesPanelIsVisible ||
			this.infoPanelIsVisible;
	}
}

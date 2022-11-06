import { Component, OnInit } from '@angular/core';
import { FilterLibrary } from 'src/app/utils/constants';
import { Filter } from 'src/app/utils/interfaces';

@Component({
	selector: 'app-track-properties-panel',
	templateUrl: './track-properties-panel.component.html',
	styleUrls: ['./track-properties-panel.component.scss']
})
export class TrackPropertiesPanelComponent {

	selectedSource: string = "webcam";

	filters: Filter[] = [
		{name: "zoomBlur", properties: [231.99996948242188, 293, 1], enabled: false, type: FilterLibrary.GLFX},
		{name: "bulgePinch", properties: [320, 239.5, 200, 1], enabled: false, type: FilterLibrary.GLFX},
		{name: "edgeWork", properties: [10], enabled: true, type: FilterLibrary.GLFX},
		{name: "oil", properties: [5, 32], enabled: true, type: FilterLibrary.IMAGE_FILTERS},
		{name: "invert", properties: [], enabled: true, type: FilterLibrary.IMAGE_FILTERS},
		{name: "sepia", properties: [1], enabled: true, type: FilterLibrary.GLFX},
		{name: "vignette", properties: [0.5, 0.5], enabled: true, type: FilterLibrary.GLFX},
		{name: "colorHalftone", properties: [320, 239.5, 0.25, 4], enabled: true, type: FilterLibrary.GLFX},
		{name: "twirl", properties: [0.5, 0.5, 200, 360], enabled: true, type: FilterLibrary.IMAGE_FILTERS},
	];
	enabledFilters: Filter[] = [];

	constructor() {
		this.enabledFilters = this.filters.filter(filter => filter.enabled);
		window.api.emit('set-filters', this.enabledFilters);
	}

	setEnabledFilters() {
		//Gets a list of all the filters that are enabled
		this.enabledFilters = this.filters.filter(filter => filter.enabled);
		window.api.emit('set-filters', this.enabledFilters);
	}

	changeSource() {
		window.api.emit("change-source", this.selectedSource);
	}
}

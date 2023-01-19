//tracks module file
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";

import { PanelModule } from "primeng/panel";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { ToolbarModule } from "primeng/toolbar";
import { DragDropModule } from "primeng/dragdrop";
import { TooltipModule } from "primeng/tooltip";
import { TabViewModule } from "primeng/tabview";
import { InputTextModule } from "primeng/inputtext";
import { InplaceModule } from "primeng/inplace";
import { OverlayPanelModule } from "primeng/overlaypanel";
import { ColorPickerModule } from "primeng/colorpicker";
import { DataViewModule } from "primeng/dataview";

import { FiltersModule } from "../filters/filters.module";

import { TracksPanelComponent } from "./tracks-panel/tracks-panel.component";
import { SourceSelectorComponent } from "./source-selector/source-selector.component";
import { TrackPropertiesPanelComponent } from "./track-properties-panel/track-properties-panel.component";
import { TrackComponent } from "./track/track.component";

@NgModule({
	declarations: [
		TracksPanelComponent,
		SourceSelectorComponent,
		TrackPropertiesPanelComponent,
		TrackComponent
	],
	imports: [
		BrowserModule,
		PanelModule,
		DialogModule,
		ButtonModule,
		ToolbarModule,
		DragDropModule,
		TooltipModule,
		TabViewModule,
		InputTextModule,
		FiltersModule,
		InplaceModule,
		FormsModule,
		OverlayPanelModule,
		ColorPickerModule,
		DataViewModule
	],
	exports: [TracksPanelComponent, TrackPropertiesPanelComponent],
})
export class TracksModule { }
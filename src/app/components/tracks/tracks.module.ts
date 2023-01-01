//tracks module file
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { PanelModule } from "primeng/panel";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { DataViewModule } from "primeng/dataview";
import { ToolbarModule } from "primeng/toolbar";
import { DragDropModule } from "primeng/dragdrop";
import { TooltipModule } from "primeng/tooltip";
import { TabViewModule } from "primeng/tabview";
import { InputTextModule } from "primeng/inputtext";
import { DropdownModule } from "primeng/dropdown";

import { TracksPanelComponent } from "./tracks-panel/tracks-panel.component";
import { SourceSelectorComponent } from "./source-selector/source-selector.component";
import { TrackPropertiesPanelComponent } from "./track-properties-panel/track-properties-panel.component";
import { TrackComponent } from "./track/track.component";
import { ImportsPanelComponent } from "./imports-panel/imports-panel.component";

@NgModule({
	declarations: [
		TracksPanelComponent,
		SourceSelectorComponent,
		TrackPropertiesPanelComponent,
  		TrackComponent,
    	ImportsPanelComponent
	],
	imports: [
		BrowserModule,
		PanelModule,
		DialogModule,
		ButtonModule,
		DataViewModule,
		ToolbarModule,
		DragDropModule,
		TooltipModule,
		TabViewModule,
		DataViewModule,
		InputTextModule,
		DropdownModule
	],
	exports: [TracksPanelComponent, TrackPropertiesPanelComponent, ImportsPanelComponent],
})
export class TracksModule { }
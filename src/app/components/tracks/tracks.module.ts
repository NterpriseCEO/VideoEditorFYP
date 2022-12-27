//tracks module file
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { ScrollPanelModule } from 'primeng/scrollpanel';

import { PanelModule } from "primeng/panel";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { TabViewModule } from "primeng/tabview";
import { DataViewModule } from "primeng/dataview";
import { CardModule } from "primeng/card";
import { ToolbarModule } from 'primeng/toolbar';
import  { DragDropModule } from 'primeng/dragdrop';
import { TooltipModule } from 'primeng/tooltip';

import { TracksPanelComponent } from "./tracks-panel/tracks-panel.component";
import { SourceSelectorComponent } from "./source-selector/source-selector.component";
import { TrackPropertiesPanelComponent } from "./track-properties-panel/track-properties-panel.component";

@NgModule({
	declarations: [
		TracksPanelComponent,
		SourceSelectorComponent,
		TrackPropertiesPanelComponent
	],
	imports: [
		BrowserModule,
		PanelModule,
		DialogModule,
		ButtonModule,
		TabViewModule,
		DataViewModule,
		CardModule,
		ScrollPanelModule,
		ToolbarModule,
		DragDropModule,
		TooltipModule
	],
	exports: [TracksPanelComponent, TrackPropertiesPanelComponent],
})
export class TracksModule { }
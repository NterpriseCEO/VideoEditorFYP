//tracks module file
import { NgModule } from "@angular/core";
import { TracksPanelComponent } from "./tracks-panel/tracks-panel.component";
import { BrowserModule } from "@angular/platform-browser";

import { PanelModule } from "primeng/panel";
import { DialogModule } from "primeng/dialog";
import { ButtonModule } from "primeng/button";
import { TabViewModule } from "primeng/tabview";
import { DataViewModule } from "primeng/dataview";
import { CardModule } from "primeng/card";

import { SourceSelectorComponent } from "./source-selector/source-selector.component";

@NgModule({
	declarations: [
		TracksPanelComponent,
		SourceSelectorComponent
	],
	imports: [
		BrowserModule,
		PanelModule,
		DialogModule,
		ButtonModule,
		TabViewModule,
		DataViewModule,
		CardModule
	],
	exports: [TracksPanelComponent],
})
export class TracksModule { }
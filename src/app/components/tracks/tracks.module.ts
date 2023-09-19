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
import { ContextMenuModule } from "primeng/contextmenu";
import { DialogService, DynamicDialogModule } from 'primeng/dynamicdialog';

import { FiltersModule } from "../filters/filters.module";
import { ClipsModule } from "../clips/clips.module";

import { TracksPanelComponent } from "./tracks-panel/tracks-panel.component";
import { SourceSelectorComponent } from "./source-selector/source-selector.component";
import { TrackPropertiesPanelComponent } from "./track-properties-panel/track-properties-panel.component";
import { TrackContentsComponent } from "./track-contents/track-contents.component";
import { TrackDetailsComponent } from "./track-details/track-details.component";
import { TrackPropertiesPopupComponent } from './track-properties-popup/track-properties-popup.component';

@NgModule({
	declarations: [
		TracksPanelComponent,
		SourceSelectorComponent,
		TrackPropertiesPanelComponent,
		TrackContentsComponent,
		TrackDetailsComponent,
  		TrackPropertiesPopupComponent
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
		DataViewModule,
		ContextMenuModule,
		ClipsModule
	],
	exports: [
		TracksPanelComponent,
		TrackPropertiesPanelComponent,
		SourceSelectorComponent,
		TrackPropertiesPopupComponent
	],
	providers: [
		DialogService
	]
})
export class TracksModule { }
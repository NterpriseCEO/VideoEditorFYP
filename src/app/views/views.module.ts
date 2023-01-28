//tracks module file
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";

import { MenubarModule } from "primeng/menubar";
import { SplitterModule } from "primeng/splitter";
import { ToolbarModule } from "primeng/toolbar";
import { ButtonModule } from "primeng/button";
import { TabViewModule } from "primeng/tabview";
import { SliderModule } from "primeng/slider";

import { FiltersModule } from "../components/filters/filters.module";
import { TracksModule } from "../components/tracks/tracks.module";
import { ClipsModule } from "../components/clips/clips.module";

import { MainViewComponent } from "./main-view/main-view.component";
import { PreviewComponent } from "./preview/preview.component";
import { CustomSplitterComponent } from "../components/ui-components/custom-splitter/custom-splitter.component";
import { InfoPanelComponent } from "../components/info-panel/info-panel.component";
import { EditorToolbarModule } from "../components/editor-toolbar/editor-toolbar.module";

@NgModule({
	declarations: [
		MainViewComponent,
		PreviewComponent,
		CustomSplitterComponent,
		InfoPanelComponent
	],
	imports: [
		BrowserModule,
		MenubarModule,
		SplitterModule,
		FiltersModule,
		TracksModule,
		ToolbarModule,
		ButtonModule,
		TabViewModule,
		SliderModule,
		FormsModule,
		ClipsModule,
		EditorToolbarModule
	],
	exports: [MainViewComponent, PreviewComponent],
})
export class ViewsModule { }
//tracks module file
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";

import { MenubarModule } from "primeng/menubar";
import { SplitterModule } from "primeng/splitter";
import { ToolbarModule } from "primeng/toolbar";
import { ButtonModule } from "primeng/button";
import { ScrollPanelModule } from "primeng/scrollpanel";

import { FiltersModule } from "../components/filters/filters-module.module";
import { TracksModule } from "../components/tracks/tracks.module";

import { MainViewComponent } from "./main-view/main-view.component";
import { PreviewComponent } from "./preview/preview.component";
import { VideoPreviewComponent } from "../components/video-preview/video-preview.component";
import { EditorToollbarComponent } from "../components/editor-toolbar/editor-toolbar.component";
import { CustomSplitterComponent } from "../components/ui-components/custom-splitter/custom-splitter.component";

@NgModule({
	declarations: [
		MainViewComponent,
		PreviewComponent,
		VideoPreviewComponent,
		EditorToollbarComponent,
		CustomSplitterComponent
	],
	imports: [
		BrowserModule,
		MenubarModule,
		SplitterModule,
		FiltersModule,
		TracksModule,
		ToolbarModule,
		ButtonModule,
		ScrollPanelModule
	],
	exports: [MainViewComponent, PreviewComponent],
})
export class ViewsModule { }
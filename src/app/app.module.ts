import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { AppRoutingModule } from "./app-routing.module";
import { FormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MenubarModule } from "primeng/menubar";
import { PanelModule } from "primeng/panel";

import { AppComponent } from "./app.component";
import { EditorToollbarComponent } from "./components/editor-toolbar/editor-toolbar.component";
import { VideoPreviewComponent } from "./components/video-preview/video-preview.component";
import { TracksPanelComponent } from "./components/tracks/tracks-panel/tracks-panel.component";
import { TrackPropertiesPanelComponent } from "./components/track-properties-panel/track-properties-panel.component";
import { PreviewComponent } from "./views/preview/preview.component";
import { MainViewComponent } from "./views/main-view/main-view.component";
import { SourceSelectorComponent } from "./components/tracks/source-selector/source-selector.component";
import { TracksModule } from "./components/tracks/tracks.module";

@NgModule({
	declarations: [
		AppComponent,
		EditorToollbarComponent,
		VideoPreviewComponent,
		// TracksPanelComponent,
		TrackPropertiesPanelComponent,
		PreviewComponent,
		MainViewComponent,
		// SourceSelectorComponent
	],
	imports: [
		BrowserModule,
		AppRoutingModule,
		MenubarModule,
		PanelModule,
		BrowserAnimationsModule,
		FormsModule,
		TracksModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule { }

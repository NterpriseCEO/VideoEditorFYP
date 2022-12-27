import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { AppRoutingModule } from "./app-routing.module";
import { FormsModule } from "@angular/forms";
import { BrowserAnimationsModule } from "@angular/platform-browser/animations";
import { MenubarModule } from "primeng/menubar";
import { PanelModule } from "primeng/panel";
import { SplitterModule } from 'primeng/splitter';

import { AppComponent } from "./app.component";
import { EditorToollbarComponent } from "./components/editor-toolbar/editor-toolbar.component";
import { VideoPreviewComponent } from "./components/video-preview/video-preview.component";
import { PreviewComponent } from "./views/preview/preview.component";
import { MainViewComponent } from "./views/main-view/main-view.component";
import { TracksModule } from "./components/tracks/tracks.module";
import { ButtonModule } from "primeng/button";

@NgModule({
	declarations: [
		AppComponent,
		EditorToollbarComponent,
		VideoPreviewComponent,
		// TracksPanelComponent,
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
		TracksModule,
		ButtonModule,
		SplitterModule
	],
	providers: [],
	bootstrap: [AppComponent]
})
export class AppModule { }

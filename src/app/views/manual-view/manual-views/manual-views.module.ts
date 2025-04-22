//tracks module file
import { NgModule } from "@angular/core";
import { BrowserModule } from "@angular/platform-browser";
import { FormsModule } from "@angular/forms";

import { CreatingFilesManualComponent } from "./creating-files-manual/creating-files-manual.component";
import { AddingTracksManualComponent } from "./adding-tracks-manual/adding-tracks-manual.component";
import { ModifyingTracksComponent } from "./modifying-tracks/modifying-tracks.component";
import { NavigatingTheMainScreenManualComponent } from "./navigating-the-main-screen-manual/navigating-the-main-screen-manual.component";
import { NavigatingVideoPreviewComponent } from "./navigating-video-preview/navigating-video-preview.component";
import { ImportingClipsComponent } from "./importing-clips/importing-clips.component";
import { WorkingWithFiltersComponent } from "./working-with-filters/working-with-filters.component";
import { ProjectExporterComponent } from "./project-exporter/project-exporter.component";

@NgModule({
	declarations: [
		CreatingFilesManualComponent,
		AddingTracksManualComponent,
		ModifyingTracksComponent,
		NavigatingTheMainScreenManualComponent,
		NavigatingVideoPreviewComponent,
		ImportingClipsComponent,
		WorkingWithFiltersComponent,
		ProjectExporterComponent
	],
	imports: [
		BrowserModule,
		FormsModule
	],
	exports: [
		CreatingFilesManualComponent,
		AddingTracksManualComponent,
		ModifyingTracksComponent,
		NavigatingTheMainScreenManualComponent,
		NavigatingVideoPreviewComponent,
		ImportingClipsComponent,
		WorkingWithFiltersComponent,
		ProjectExporterComponent
	],
})
export class ManualViewsModule { }
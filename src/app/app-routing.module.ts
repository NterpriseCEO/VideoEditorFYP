import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { ExportsViewComponent } from "./views/exports-view/exports-view.component";
import { MainViewComponent } from "./views/main-view/main-view.component";
import { PreviewComponent } from "./views/preview/preview.component";
import { SettingsViewComponent } from "./views/settings-view/settings-view.component";
import { StartupViewComponent } from "./views/startup-view/startup-view.component";
import { ManualViewComponent } from "./views/manual-view/manual-view.component";
import { CreatingFilesManualComponent } from "./views/manual-view/manual-views/creating-files-manual/creating-files-manual.component";
import { AddingTracksManualComponent } from "./views/manual-view/manual-views/adding-tracks-manual/adding-tracks-manual.component";
import { NavigatingVideoPreviewComponent } from "./views/manual-view/manual-views/navigating-video-preview/navigating-video-preview.component";
import { NavigatingTheMainScreenManualComponent } from "./views/manual-view/manual-views/navigating-the-main-screen-manual/navigating-the-main-screen-manual.component";
import { ImportingClipsComponent } from "./views/manual-view/manual-views/importing-clips/importing-clips.component";
import { ModifyingTracksComponent } from "./views/manual-view/manual-views/modifying-tracks/modifying-tracks.component";
import { WorkingWithFiltersComponent } from "./views/manual-view/manual-views/working-with-filters/working-with-filters.component";
import { ProjectExporterComponent } from "./views/manual-view/manual-views/project-exporter/project-exporter.component";

const routes: Routes = [
	{ path: "startup", component: StartupViewComponent},
	// { path: "startup", loadChildren: () => import("./views/views.module").then(m => m.ViewsModule) },
	{ path: "mainview", component: MainViewComponent },
	{ path: "preview", component: PreviewComponent },
	{ path: "settings", component: SettingsViewComponent, outlet: "panelOutlet" },
	{ path: "exports", component: ExportsViewComponent, outlet: "panelOutlet" },
	{ path: "manual", component: ManualViewComponent, children: [
		{ path: "", component: CreatingFilesManualComponent, outlet: "manualOutlet" },
		{ path: "creating-files", component: CreatingFilesManualComponent, outlet: "manualOutlet" },
		{ path: "navigating-the-main-screen", component: NavigatingTheMainScreenManualComponent, outlet: "manualOutlet" },
		{ path: "navigating-the-previewer", component: NavigatingVideoPreviewComponent, outlet: "manualOutlet" },
		{ path: "adding-tracks", component: AddingTracksManualComponent, outlet: "manualOutlet" },
		{ path: "importing-clips", component: ImportingClipsComponent, outlet: "manualOutlet" },
		{ path: "working-with-tracks", component: ModifyingTracksComponent, outlet: "manualOutlet" },
		{ path: "working-with-filters", component: WorkingWithFiltersComponent, outlet: "manualOutlet" },
		{ path: "exporting-projects", component: ProjectExporterComponent, outlet: "manualOutlet" }
	]},
];

@NgModule({
	imports: [RouterModule.forRoot(routes, { useHash: false })],
	exports: [RouterModule]
})
export class AppRoutingModule { }

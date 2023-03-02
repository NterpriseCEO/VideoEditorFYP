import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { environment } from "src/environments/environment";
import { ExportsViewComponent } from "./views/exports-view/exports-view.component";
import { MainViewComponent } from "./views/main-view/main-view.component";
import { PreviewComponent } from "./views/preview/preview.component";
import { SettingsViewComponent } from "./views/settings-view/settings-view.component";
import { StartupViewComponent } from "./views/startup-view/startup-view.component";
import { ManualViewComponent } from "./views/manual-view/manual-view.component";

const routes: Routes = [
	{ path: "startup", component: StartupViewComponent},
	// { path: "startup", loadChildren: () => import("./views/views.module").then(m => m.ViewsModule) },
	{ path: "mainview", component: MainViewComponent },
	{ path: "preview", component: PreviewComponent },
	{ path: "settings", component: SettingsViewComponent, outlet: "panelOutlet" },
	{ path: "exports", component: ExportsViewComponent, outlet: "panelOutlet" },
	{ path: "manual", component: ManualViewComponent}
];

@NgModule({
	imports: [RouterModule.forRoot(routes, { useHash: true })],
	exports: [RouterModule]
})
export class AppRoutingModule { }

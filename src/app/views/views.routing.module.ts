import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { environment } from "src/environments/environment";
import { ExportsViewComponent } from "./exports-view/exports-view.component";
import { MainViewComponent } from "./main-view/main-view.component";
import { PreviewComponent } from "./preview/preview.component";
import { SettingsViewComponent } from "./settings-view/settings-view.component";
import { StartupViewComponent } from "./startup-view/startup-view.component";

const routes: Routes = [
	{ path: "startup", component: StartupViewComponent},
	// { path: "startup", loadChildren: () => import("./views/views.module").then(m => m.ViewsModule) },
	{ path: "mainview", component: MainViewComponent },
	{ path: "preview", component: PreviewComponent },
	{ path: "settings", component: SettingsViewComponent, outlet: "panelOutlet" },
	{ path: "exports", component: ExportsViewComponent, outlet: "panelOutlet" }
];

@NgModule({
	imports: [RouterModule.forRoot(routes, { useHash: environment.production })],
	exports: [RouterModule]
})
export class ViewsRoutingModule { }

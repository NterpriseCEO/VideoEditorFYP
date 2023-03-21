import { NgModule } from "@angular/core";
import { RouterModule, Routes } from "@angular/router";
import { environment } from "src/environments/environment";

const routes: Routes = [
	// { path: "startup", component: StartupViewComponent},
	// // { path: "startup", loadChildren: () => import("./views/views.module").then(m => m.ViewsModule) },
	// { path: "mainview", component: MainViewComponent },
	// { path: "preview", component: PreviewComponent },
	// { path: "settings", component: SettingsViewComponent, outlet: "panelOutlet" },
	// { path: "exports", component: ExportsViewComponent, outlet: "panelOutlet" }
];

@NgModule({
	imports: [RouterModule.forRoot(routes, { useHash: environment.production })],
	exports: [RouterModule]
})
export class ViewsRoutingModule { }

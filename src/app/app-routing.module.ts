import { NgModule } from '@angular/core';
import { RouterModule, Routes } from '@angular/router';
import { MainViewComponent } from './views/main-view/main-view.component';
import { PreviewComponent } from './views/preview/preview.component';

const routes: Routes = [
	{ path: 'mainview', component: MainViewComponent },
	{ path: 'preview', component: PreviewComponent },
];

@NgModule({
	imports: [RouterModule.forRoot(routes)],
	exports: [RouterModule]
})
export class AppRoutingModule { }

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ProjectExporterComponent } from './project-exporter.component';

describe('ProjectExplorerComponent', () => {
  let component: ProjectExporterComponent;
  let fixture: ComponentFixture<ProjectExporterComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ProjectExporterComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ProjectExporterComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { ImportsPanelComponent } from './imports-panel.component';

describe('ImportsPanelComponent', () => {
  let component: ImportsPanelComponent;
  let fixture: ComponentFixture<ImportsPanelComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ ImportsPanelComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(ImportsPanelComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

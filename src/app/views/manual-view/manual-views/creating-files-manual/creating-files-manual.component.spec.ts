import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatingFilesManualComponent } from './creating-files-manual.component';

describe('CreatingFilesManualComponent', () => {
  let component: CreatingFilesManualComponent;
  let fixture: ComponentFixture<CreatingFilesManualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ CreatingFilesManualComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatingFilesManualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

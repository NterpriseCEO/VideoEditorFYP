import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigatingVideoPreviewComponent } from './navigating-video-preview.component';

describe('NavigatingVideoPreviewComponent', () => {
  let component: NavigatingVideoPreviewComponent;
  let fixture: ComponentFixture<NavigatingVideoPreviewComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NavigatingVideoPreviewComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavigatingVideoPreviewComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

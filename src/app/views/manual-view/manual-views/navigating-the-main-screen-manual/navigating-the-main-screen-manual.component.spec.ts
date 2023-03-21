import { ComponentFixture, TestBed } from '@angular/core/testing';

import { NavigatingTheMainScreenManualComponent } from './navigating-the-main-screen-manual.component';

describe('NavigatingTheMainScreenManualComponent', () => {
  let component: NavigatingTheMainScreenManualComponent;
  let fixture: ComponentFixture<NavigatingTheMainScreenManualComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [ NavigatingTheMainScreenManualComponent ]
    })
    .compileComponents();

    fixture = TestBed.createComponent(NavigatingTheMainScreenManualComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

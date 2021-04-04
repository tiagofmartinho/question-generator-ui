import { ComponentFixture, TestBed } from '@angular/core/testing';

import { AnswerSubmissionComponent } from './answer-submission.component';

describe('AnswerSubmissionComponent', () => {
  let component: AnswerSubmissionComponent;
  let fixture: ComponentFixture<AnswerSubmissionComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      declarations: [AnswerSubmissionComponent],
    }).compileComponents();
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(AnswerSubmissionComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

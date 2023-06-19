import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';

import { ManageFaqsRoutingModule } from "./manage-faqs-menu-routing.module";
import { TranslateModule } from '@ngx-translate/core';

import { QuestionAskedNotAnsweredComponent } from './Question_Asked_Not_Answered/questionAskedNotAnswered.component';

import { CustomFormsModule } from 'ng2-validation';
import { NgbModule } from '@ng-bootstrap/ng-bootstrap';

import {MatSelectModule, MatInputModule, MatDatepickerModule, MatNativeDateModule} from '@angular/material';

@NgModule({
    exports: [
        TranslateModule
    ],
    imports: [
        CommonModule,
        ManageFaqsRoutingModule,
        FormsModule,
        TranslateModule,
        CustomFormsModule,
        NgbModule,
        MatSelectModule,
        MatInputModule,
        MatDatepickerModule,
        MatNativeDateModule,
        ReactiveFormsModule
    ],
    declarations: [
        QuestionAskedNotAnsweredComponent
    ]
})
export class ManageFaqsModule { }

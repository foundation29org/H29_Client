import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { MatSelectModule } from '@angular/material';
import { TranslateModule } from '@ngx-translate/core';

import { NgbModalModule, NgbDatepickerModule, NgbTimepickerModule } from '@ng-bootstrap/ng-bootstrap';
import { CalendarModule, CalendarDateFormatter } from 'angular-calendar';
import { CalendarRoutingModule } from "./calendar-routing.module";


import { CalendarsComponent } from "./calendar.component";
import { DateTimePickerComponent } from './date-time-picker.component';

import { CustomFormsModule } from 'ng2-validation';

@NgModule({
    exports: [
        TranslateModule
    ],
    imports: [
        CommonModule,
        CalendarRoutingModule,
        CalendarModule.forRoot(),
        NgbModalModule.forRoot(),
        NgbDatepickerModule.forRoot(),
        NgbTimepickerModule.forRoot(),
        TranslateModule,
        FormsModule,
        ReactiveFormsModule,
        MatSelectModule,
        CustomFormsModule
    ],
    declarations: [
        CalendarsComponent,
        DateTimePickerComponent
    ]
})
export class CalendarsModule { }

import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { FormsModule } from '@angular/forms';

import { DashboardRoutingModule } from './dashboard-routing.module';
import { TranslateModule } from '@ngx-translate/core';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { MatchHeightModule } from 'app/shared/directives/match-height.directive';

import { NgxChartsModule } from '@swimlane/ngx-charts';
import { Dashboard1Component } from './dashboard1/dashboard1.component';


@NgModule({
    imports: [
        CommonModule,
        FormsModule,
        DashboardRoutingModule,
        NgbModule,
        MatchHeightModule,
        TranslateModule,
        NgxChartsModule
    ],
    exports: [TranslateModule],
    declarations: [
        Dashboard1Component
    ],
    providers: [],
})
export class DashboardModule { }

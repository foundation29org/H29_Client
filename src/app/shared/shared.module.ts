import { NgModule } from '@angular/core';
import { CommonModule } from "@angular/common";
import { RouterModule } from "@angular/router";

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { TranslateModule } from '@ngx-translate/core';

import { FooterComponent } from "./footer/footer.component";
import { NavbarComponent } from "./navbar/navbar.component";
import { NavbarComponentNolog } from "./navbar-nolog/navbar-nolog.component";
import { SidebarComponent } from "./sidebar/sidebar.component";
import { ToggleFullscreenDirective } from "./directives/toggle-fullscreen.directive";
import { CustomizerComponent } from './customizer/customizer.component';
import {AlertsService} from './services/alerts.service';

@NgModule({
    exports: [
        CommonModule,
        FooterComponent,
        NavbarComponent,
        NavbarComponentNolog,
        SidebarComponent,
        ToggleFullscreenDirective,
        NgbModule,
        TranslateModule,
        CustomizerComponent
    ],
    imports: [
        RouterModule,
        CommonModule,
        NgbModule,
        TranslateModule

    ],
    declarations: [
        FooterComponent,
        NavbarComponent,
        NavbarComponentNolog,
        SidebarComponent,
        ToggleFullscreenDirective,
        CustomizerComponent
    ]
})
export class SharedModule { }

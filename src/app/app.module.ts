
import * as $ from 'jquery';
import { NgModule } from '@angular/core';
import { BrowserAnimationsModule } from '@angular/platform-browser/animations';

import { NgbModule } from '@ng-bootstrap/ng-bootstrap';
import { AppRoutingModule } from './app-routing.module';
import { SharedModule } from "./shared/shared.module";
import { ToastModule, ToastOptions } from 'ng2-toastr/ng2-toastr';
import { AgmCoreModule } from '@agm/core';
import { HTTP_INTERCEPTORS, HttpClientModule, HttpClient } from '@angular/common/http';
import { TranslateModule, TranslateLoader } from '@ngx-translate/core';
import { TranslateHttpLoader } from '@ngx-translate/http-loader';

import { AppComponent } from './app.component';
import { ContentLayoutComponent } from "./layouts/content/content-layout.component";
import { FullLayoutComponent } from "./layouts/full/full-layout.component";

import { CustomOption } from "./shared/configs/toastr/custom-option";

import { AuthService } from './shared/auth/auth.service';
import { TokenService } from './shared/auth/token.service';
import { AuthGuard } from './shared/auth/auth-guard.service';
import { RoleGuard } from './shared/auth/role-guard.service';
import { AuthInterceptor } from './shared/auth/auth.interceptor';
import { DatePipe } from '@angular/common';
import { DateService } from 'app/shared/services/date.service';
import { SearchFilterPipe} from 'app/shared/services/search-filter.service';
import { SortService} from 'app/shared/services/sort.service';
import { SearchService } from 'app/shared/services/search.service';
import { EventsService} from 'app/shared/services/events.service';
import { DialogService } from 'app/shared/services/dialog.service';
import { Data} from 'app/shared/services/data.service';
import { environment } from 'environments/environment';
import { BlobStorageService } from 'app/shared/services/blob-storage.service';
import { BlobStorageMedicalCareService } from 'app/shared/services/blob-storage-medical-care.service';
import { BlobStorageSupportService } from 'app/shared/services/blob-storage-support.service';

import { Angulartics2Module } from 'angulartics2';
import { Angulartics2GoogleAnalytics } from 'angulartics2/ga';

import {AlertsService} from "app/shared/services/alerts.service"

export function createTranslateLoader(http: HttpClient) {
    return new TranslateHttpLoader(http, environment.api+'/assets/i18n/', '.json');
    //return new TranslateHttpLoader(http, './assets/i18n/', '.json');
  }

@NgModule({
    declarations: [
        AppComponent,
        FullLayoutComponent,
        ContentLayoutComponent,
        SearchFilterPipe
    ],
    imports: [
        BrowserAnimationsModule,
        AppRoutingModule,
        SharedModule,
        HttpClientModule,
        ToastModule.forRoot(),
        NgbModule.forRoot(),
        TranslateModule.forRoot({
            loader: {
                provide: TranslateLoader,
                useFactory: (createTranslateLoader),
                deps: [HttpClient]
              }
        }),
        AgmCoreModule.forRoot({
            apiKey: 'AIzaSyBr5_picK8YJK7fFR2CPzTVMj6GG1TtRGo'
        }),
        Angulartics2Module.forRoot([Angulartics2GoogleAnalytics])

    ],
    providers: [
        //Toastr and auth providers
        { provide: ToastOptions, useClass: CustomOption },
        AuthService,
        TokenService,
        AuthGuard,
        RoleGuard,
        {
          provide : HTTP_INTERCEPTORS,
          useClass: AuthInterceptor,
          multi   : true
        },
        DatePipe,
        DateService,
        SearchFilterPipe,
        SortService,
        SearchService,
        EventsService,
        DialogService,
        Data,
        BlobStorageService,
        BlobStorageMedicalCareService,
        BlobStorageSupportService,
        AlertsService
    ],
    bootstrap: [AppComponent]
})
export class AppModule { }

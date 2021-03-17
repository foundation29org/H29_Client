import { Component, OnInit, OnDestroy } from '@angular/core';
import { environment } from 'environments/environment';
import { globalvars } from 'app/shared/global-variables';
import { HttpClient } from "@angular/common/http";
import { ROUTES, ROUTESADMIN, ROUTESSUPERADMIN, ROUTESDIABETES, ROUTESUNDIAGNOSED, ROUTESDUCHENNE, ROUTESINTERNATIONAL } from './sidebar-routes.config';
import { RouteInfo } from "./sidebar.metadata";
import { Router, ActivatedRoute } from "@angular/router";
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { EventsService} from 'app/shared/services/events.service';
import { Subscription } from 'rxjs/Subscription';

declare var $: any;

@Component({
    selector: 'app-sidebar',
    templateUrl: './sidebar.component.html',
})

export class SidebarComponent implements OnInit, OnDestroy {
    public menuItems: any[];
    group: string = 'None';
    urlLogo: string = 'assets/img/health29-compr-small.png';
    urlLogo2: string = 'assets/img/health29-medium.png';
    modules: any = [];
    duchennenetherlands: string = globalvars.duchennenetherlands;
    duchenneinternational: string = globalvars.duchenneinternational;
    private subscription: Subscription = new Subscription();

    constructor(private router: Router, private route: ActivatedRoute, public translate: TranslateService, private authService: AuthService, private eventsService: EventsService, private http: HttpClient, private authGuard: AuthGuard) {
      this.group = this.authService.getGroup();
      //logo
      if(this.group  == this.duchennenetherlands || this.group  == this.duchenneinternational){
        this.urlLogo = 'assets/img/logo-dark.png';
        this.urlLogo2 = 'assets/img/duchenne-medium.png';
      }

      //observar si hay cambios para cargar otro menú

    }

    ngOnDestroy() {
      this.subscription.unsubscribe();
    }

    ngOnInit() {
        $.getScript('./assets/js/app-sidebar.js');

        this.loadDataUser();


        //evento que escucha si ha habido un error de conexión
        this.eventsService.on('changemodules', function(modules) {
            this.modules = modules;
            this.loadMenu();
          }.bind(this));

    }

    loadDataUser(){
      this.subscription.add( this.http.get(environment.api+'/api/users/'+this.authService.getIdUser())
      .subscribe( (res : any) => {
        this.modules = res.user.modules;
        this.loadMenu();
       }, (err) => {
         console.log(err);
         this.loadMenu();
         if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
           this.authGuard.testtoken();
         }else{
           //this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
         }
       }));
    }

    loadMenu(){
      this.menuItems = [];
      if(this.authService.getRole() == 'Admin'){
        //cargar menú del Admin
        this.menuItems = JSON.parse(JSON.stringify(ROUTESADMIN.filter(menuItem => menuItem)));
      }else if(this.authService.getRole() == 'SuperAdmin'){
        //cargar menú del Admin
        this.menuItems = JSON.parse(JSON.stringify(ROUTESSUPERADMIN.filter(menuItem => menuItem)));
      }else{
        //cargar menú del usuario
        if(this.authService.getGroup() == 'Diabetes'){
          this.menuItems = JSON.parse(JSON.stringify(ROUTESDIABETES.filter(menuItem => menuItem)));
        }else if(this.authService.getGroup() == 'Undiagnosed'){
          this.menuItems = JSON.parse(JSON.stringify(ROUTESUNDIAGNOSED.filter(menuItem => menuItem)));
        }else if(this.authService.getGroup() == this.duchennenetherlands){
          this.menuItems = JSON.parse(JSON.stringify(ROUTESDUCHENNE.filter(menuItem => menuItem)));
        }else if(this.authService.getGroup() == this.duchenneinternational){
          this.menuItems = JSON.parse(JSON.stringify(ROUTESINTERNATIONAL.filter(menuItem => menuItem)));
        }else{
          this.menuItems = JSON.parse(JSON.stringify(ROUTES.filter(menuItem => menuItem)));
        }
        //
        for(var i = 0; i < this.modules.length; i++) {
          if(this.modules[i]=="epilepsy"){
            var enc= false;
            for(var j = 0; j < this.menuItems[2].submenu.length && !enc; j++) {
              if(this.menuItems[2].submenu[j].path=='/user/calendar'){
                enc= true;
              }
            }
            if(!enc){
              this.menuItems[2].submenu.push({ path: '/user/calendar', title: 'modules.epilepsy', icon: '', class: '', badge: '', badgeClass: '', isExternalLink: false, submenu: [] });
            }
          }
        }


      }

    }

    //NGX Wizard - skip url change
    ngxWizardFunction(path: string) {
        if (path.indexOf('forms/ngx') !== -1)
            this.router.navigate(['forms/ngx/wizard'], { skipLocationChange: false });
    }
}

import { Component, ViewContainerRef, OnInit, OnDestroy } from '@angular/core';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { AuthService } from 'app/shared/auth/auth.service';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/filter';
import 'rxjs/add/operator/map';
import 'rxjs/add/operator/mergeMap'
import { Subscription } from 'rxjs/Subscription';
import { Router, NavigationEnd, ActivatedRoute, NavigationExtras } from '@angular/router';
import { Title } from '@angular/platform-browser';
import { TranslateService } from '@ngx-translate/core';
import { LangService } from 'app/shared/services/lang.service';
import swal from 'sweetalert2';
import { EventsService} from 'app/shared/services/events.service';

import { Angulartics2GoogleAnalytics } from 'angulartics2/ga';
declare var device;
declare let cordova: any;

declare global {
    interface Navigator {
      app: {
          exitApp: () => any; // Or whatever is the type of the exitApp function
      },
      splashscreen:any
    }
}
declare var IRoot;


@Component({
    selector: 'app-root',
    templateUrl: './app.component.html',
    providers: [LangService]
})
export class AppComponent implements OnInit, OnDestroy{

  loggerSubscription:Subscription;
  secondsInactive:number;
  inactiveSecondsToLogout:number = 60000; // 10 minutoes *2 = 20 minutos  600
  actualPage: string = '';
  isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
  hasLocalLang: boolean = false;
    //Set toastr container ref configuration for toastr positioning on screen
    constructor(public toastr: ToastsManager, vRef: ViewContainerRef, private authGuard: AuthGuard, private authService: AuthService, private router: Router, private activatedRoute: ActivatedRoute, private titleService: Title, public translate: TranslateService, angulartics2GoogleAnalytics: Angulartics2GoogleAnalytics, private langService:LangService, private eventsService: EventsService) {
        this.toastr.setRootViewContainerRef(vRef);

        if(sessionStorage.getItem('lang')){
          this.translate.use(sessionStorage.getItem('lang'));
          this.hasLocalLang = true;
        }else{
          this.translate.use('en');
          this.hasLocalLang = false;
        }

        this.loadLanguages();

         if (this.isApp){
          document.addEventListener("deviceready", this.onDeviceReady.bind(this), false);
         }

    }

    loadLanguages() {
        this.langService.getLangs()
        .subscribe( (res : any) => {
          if(!this.hasLocalLang){
            const browserLang: string = this.translate.getBrowserLang();
            for(let lang of res) {
              if(browserLang.match(lang.code)){
                this.translate.use(lang.code);
              }
            }
          }

         }, (err) => {
           console.log(err);
         })
    }



     onDeviceReady() {
       setTimeout(function() {
            navigator.splashscreen.hide();
        }, 2000);
       if(device.platform == 'android' || device.platform == 'Android'){
         document.addEventListener("backbutton", this.onBackKeyDown.bind(this), false);
       }else if(device.platform == 'iOS'){

       }
       if (typeof (IRoot) !== 'undefined' && IRoot) {
            IRoot.isRooted((data) => {
                if (data && data == 1) {
                    this.router.navigate(['/error']);
                } else {
                    console.log("This is not routed device");
                }
            }, (data) => {
                    console.log("routed device detection failed case", data);
                });
        }
       /*if (typeof cordova !== 'undefined' && cordova.plugins.JailBreakCheck) {
          cordova.plugins.JailBreakCheck.isJailBreak((value)=> {
              if (value === 'true') {
                  this.router.navigate(['/error']);
              }
          });
      }*/
       //Configurar el evento cuando la app pase a background
       document.addEventListener("pause", onPause, false);
       document.addEventListener("resume", onResume, false);

       function onPause(){
         navigator.splashscreen.show();
       }

       function onResume(){
         setTimeout(function() {
            navigator.splashscreen.hide();
        }, 2000);
       }
     }

     onBackKeyDown(){
       if(this.actualPage.indexOf('menu.Dashboard')!=-1){
       //if(this.actualPage == 'menu.Dashboard' || this.actualPage == 'menu.Dashboard Admin'){
         swal({
             title: this.translate.instant("generics.Are you sure?"),
             text:  this.translate.instant("generics.Exit the application without logging off"),
             type: 'warning',
             showCancelButton: true,
             confirmButtonColor: '#0CC27E',
             cancelButtonColor: '#FF586B',
             confirmButtonText: this.translate.instant("generics.Yes"),
             cancelButtonText: this.translate.instant("generics.No, cancel"),
             showLoaderOnConfirm: true,
             allowOutsideClick: false
         }).then((result) => {
           if (result.value) {
             navigator.app.exitApp();
           }
               //window.history.back();
               /*this.authService.logout();
               this.router.navigate([this.authService.getLoginUrl()]);*/

         }).catch(swal.noop);

       }else{
         if(this.authService.isAuthenticated()){
           window.history.back();
         }
       }
     }

     ngOnInit(){

       //evento que escucha si ha habido un error de conexión
       this.eventsService.on('http-error', function(error) {
             console.group("HttpErrorHandler");
             console.log(error.status, "status code detected.");
             console.log(error);
             console.groupEnd();
             var msg1 = 'No internet connection';
             var msg2 = 'Trying to connect ...';

             if(sessionStorage.getItem('lang')){
               var actuallang= sessionStorage.getItem('lang');
               if(actuallang == 'es'){
                 msg1 = 'Sin conexión a Internet';
                 msg2 = 'Intentando conectar ...';
               }else if(actuallang == 'pt'){
                 msg1 = 'Sem conexão à internet';
                 msg2 = 'Tentando se conectar ...';
               }else if(actuallang == 'de'){
                 msg1 = 'Keine Internetverbindung';
                 msg2 = 'Versucht zu verbinden ...';
               }else if(actuallang == 'nl'){
                 msg1 = 'Geen internet verbinding';
                 msg2 = 'Proberen te verbinden ...';
               }
             }
             if(error.message){
               if(error == 'The user does not exist'){
                 this.authService.logout();
                 this.router.navigate(['/login']);
                 swal({
                   type: 'warning',
                   title: this.translate.instant("errors.The user does not exist"),
                   html: this.translate.instant("errors.The session has been closed")
                 })
               }
             }else{

                 swal({
                     title: msg1,
                     text: msg2,
                     type: 'warning',
                     showCancelButton: false,
                     confirmButtonColor: '#0CC27E',
                     confirmButtonText: 'OK',
                     showLoaderOnConfirm: true,
                     allowOutsideClick: false
                 }).then((result) => {
                   if (result.value) {
                     //location.reload();
                     //navigator.app.exitApp();
                     this.router.navigateByUrl('/', {skipLocationChange: true}).then(() =>
                     this.router.navigate([this.router.url]));
                   }

                 }).catch(swal.noop);



             }



         }.bind(this));

         this.eventsService.on('changelang', function(lang) {
             this.reloadPage();
           }.bind(this));


      this.secondsInactive=0;

      //every time you change your route
      this.router.events
      .filter((event) => event instanceof NavigationEnd)
      .map(() => this.activatedRoute)
      .map((route) => {
        while (route.firstChild) route = route.firstChild;
        return route;
      })
      .filter((route) => route.outlet === 'primary')
      .mergeMap((route) => route.data)
      .subscribe((event) => {
        this.titleService.setTitle(this.translate.instant(event['title']));
        this.secondsInactive=0;
        //para los anchor de la misma páginano hacer scroll hasta arriba
        if(this.actualPage != event['title']){
          window.scrollTo(0, 0)
        }
        this.actualPage = event['title'];
      });

      if (!this.isApp){
        //we check the time it takes without changing the route
        this.loggerSubscription =  Observable.interval(1000 * this.inactiveSecondsToLogout).subscribe(() => {
          this.secondsInactive+=this.inactiveSecondsToLogout;
          if(this.authService.getToken()){
            var role = this.authService.getRole();
            if(role){
              if(role == 'Admmin'){
                this.inactiveSecondsToLogout = 1800;
              }else{
                this.inactiveSecondsToLogout = 60000;
              }
              if(this.secondsInactive>this.inactiveSecondsToLogout){
                //this.authGuard.testtoken()
                this.authGuard.inactive()
              }
            }
          }
        });
      }

     }

     // when the component is destroyed, unsubscribe to prevent memory leaks
     ngOnDestroy(){
       this.loggerSubscription.unsubscribe();
     }

     reloadPage(){
       //location.reload();
       this.router.navigate(['/loading'], {queryParams: {url: this.router.url}});
     }


}

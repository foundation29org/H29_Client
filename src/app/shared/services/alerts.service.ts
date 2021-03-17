import { Injectable, Output } from '@angular/core';
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import { observableToBeFn } from 'rxjs/testing/TestScheduler';

import { HttpClient } from "@angular/common/http";
import { environment } from 'environments/environment';
import { Subscription } from 'rxjs/Subscription';
import { AuthService } from 'app/shared/auth/auth.service';
import { TranslateService } from '@ngx-translate/core';

import { SortService} from 'app/shared/services/sort.service';
import * as Rx from 'rxjs/Rx';



@Injectable()
export class AlertsService {
    private subscription: Subscription = new Subscription();
    patientId: any;
    public listAlertsNotRead:any;
    public listAlertsNotReadForBotLaunched:any;
    public listAlertsNotReadForBotNotLaunched:any;
    public listAlertsRead:any;
    public alertsLoaded:boolean=false;
    private sectionsAndProms=[];
    dateNow;

    listeners: any;
    eventsSubject: any;
    events: any;

    public constructor(public translate : TranslateService, private authService: AuthService, private http: HttpClient,private sortService: SortService) {
        //this.loadPromsSections();
        this.dateNow=new Date();
        this.listeners = {};
        this.eventsSubject = new Rx.Subject();

        this.events = Rx.Observable.from(this.eventsSubject);

        this.events.subscribe(({name, msg}) => {
            if (this.listeners[name]) {
                for (let listener of this.listeners[name]) {
                    listener(msg);
                }
            }
        });
        
    }

    on(name, listener) {
        if (!this.listeners[name]) {
            this.listeners[name] = [];
        }

        this.listeners[name].push(listener);
    }

    broadcast(name, msg) {
        this.eventsSubject.next({
            name,
            msg
        });
    }

    //cargar las secciones para verificar si hay anclas a secciones deshabilitadas
    loadPromsSections(groupId,res1){
        var paramssend = this.authService.getLang()+'-code-'+groupId;
        return this.http.get(environment.api+'/api/translationstructureproms/'+paramssend)
        .map( (res2 : any) =>{
            if(res2.message){
                this.sectionsAndProms = res1;   
                return true;                         
            }else{
                this.sectionsAndProms = res2.structureProm.data;
                return true; 
            }
        

        }, (err) => {
            console.log(err);
            return false; 
        });

    }

    
    // Cargar las alertas no leidas para un paciente
    loadAlertsNotReadAndTranslateName(patientList,showNabvar){
        if(showNabvar==true){
            this.alertsLoaded=false;
        }
        this.listAlertsNotRead =[];
        var list=[];
        var list2=[];
        var lang = this.authService.getLang();
        var params=patientList.sub+"-code-"+lang;
        return this.http.get(environment.api+'/api/alerts/alertsNotReadAndTranslatedName/'+params)
        .map((res1:any)=>{
            //alert("RESULTDO ALERTS NOT READ AND TRANSLATED NAME")
            this.listAlertsNotRead=res1;
            if(showNabvar==true){
                this.alertsLoaded=true;
            }
            return res1
        }, (err) => {
            console.log(err);
            //alert("FALL!!!!RESULTDO ALERTS NOT READ AND TRANSLATED NAME")

            //return false;
        });        

    }

    // Leer las alertas no leidas para un paciente
    getListAlertsNotRead():any{
        return this.listAlertsNotRead;
    }

    // Cargar las alertas leidas para un paciente
    loadAlertsReadAndTranslateName(patientList,showNabvar){
        if(showNabvar==true){
            this.alertsLoaded=false;
        }
        
        this.listAlertsRead =[];
        var lang = this.authService.getLang();
        var params=patientList.sub+"-code-"+lang;
        return this.http.get(environment.api+'/api/alerts/alertsReadAndTranslatedName/'+params)
        .map((res1:any)=>{
            this.listAlertsRead=res1;
            if(showNabvar==true){
                this.alertsLoaded=true;
            }
            return res1
        }, (err) => {
            console.log(err);
            return false;
        });        
        
    }

    // Leer las alertas  leidas para un paciente
    getListAlertsRead():any{
        return this.listAlertsRead;
    }


    
    // Actualizar las UserAlert de un paciente a state=Read
    updateStateToReadOfUserAlerts(patientId,listAterts){
        //guardar las userAlerts como leídas y recargar las listas
        //userAlertList[i].res2.state="Read";
        // get user alerts by ID for this patient
        this.alertsLoaded=false;
        
        return this.http.post(environment.api+'/api/useralerts/updatetoReadSelectedUserAlerts/'+patientId,listAterts)
        .map( (res1 : any) => {
            this.alertsLoaded=true;
            return true;
        }, (err) => {
            console.log(err);
            this.alertsLoaded=true;
            return false;
        });
        
    }

    // Actualizar las UserAlert de un paciente a launch=true
    updateLaunchToTrueOfUserAlerts(patientId){
        //guardar las userAlerts como leídas y recargar las listas
        //userAlertList[i].res2.state="Read";
        // get user alerts by ID for this patient
        this.alertsLoaded=false;
        return this.http.post(environment.api+'/api/useralerts/updateToLaunch/'+patientId,'')
            .map( (res1 : any) => {
                this.alertsLoaded=true;
            return true;
        }, (err) => {
            this.alertsLoaded=true;
            console.log(err);
        });
        
    }


    
}

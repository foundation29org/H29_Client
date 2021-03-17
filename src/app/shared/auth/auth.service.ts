import { Router } from '@angular/router';
import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { HttpClient, HttpHeaders } from "@angular/common/http";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import * as decode from 'jwt-decode';
import { ICurrentPatient } from './ICurrentPatient.interface';
import { timer } from 'rxjs/observable/timer';
import { Subject, Subscription } from 'rxjs';

@Injectable()
export class AuthService {
  private token: string;
  private loginUrl: string = '/login';
  private redirectUrl: string = '/user/dashboard/dashboard1';
  private isloggedIn: boolean = false;
  private message: string;
  private iduser: string;
  private role: string;
  private group: string;
  private lang: string;
  private expToken: number = null;
  private currentPatient: ICurrentPatient = null;
  private patientList: Array<ICurrentPatient> = null;
  private tock=0;
  private cancelWaitingAuthy:Boolean=false;

  private isApp: boolean = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
  private subscription: Subscription = new Subscription();

  constructor(private http: HttpClient) {
  }


  getEnvironment():boolean{
    if(sessionStorage.getItem('token')){
      this.setLang(sessionStorage.getItem('lang'));
      this.setAuthenticated(sessionStorage.getItem('token'));
      const tokenPayload = decode(sessionStorage.getItem('token'));
      this.setIdUser(tokenPayload.sub);
      this.setExpToken(tokenPayload.exp);
      this.setRole(tokenPayload.role);

      if(tokenPayload.role == 'Admin'){
        this.setRedirectUrl('/admin/dashboard-admin')
      }else if(tokenPayload.role == 'SuperAdmin'){
        // is role superadmin
        this.setRedirectUrl('/superadmin/dashboard-superadmin')
      }else{
        // is role user
        this.setRedirectUrl('/user/dashboard/dashboard1')
      }
      this.setGroup(tokenPayload.group);

      return true;
    }else{
      return false;
    }
  }

  setEnvironment(token:string):void{
    this.setAuthenticated(token);
    // decode the token to get its payload
    const tokenPayload = decode(token);
    this.setIdUser(tokenPayload.sub);
    this.setExpToken(tokenPayload.exp);
    this.setRole(tokenPayload.role);
    if(tokenPayload.role == 'Admin'){
      this.setRedirectUrl('/admin/dashboard-admin')
    }else if(tokenPayload.role == 'SuperAdmin'){
      // is role superadmin
      this.setRedirectUrl('/superadmin/dashboard-superadmin')
    }else{
      // is role user
      this.setRedirectUrl('/user/dashboard/dashboard1')
    }
    this.setGroup(tokenPayload.group);
    //save sessionStorage
    sessionStorage.setItem('token', token)
  }

  signinUser(formValue: any){
    //your code for signing up the new user
    return this.http.post(environment.api+'/api/signin',formValue)
      .map( (res : any) => {
          if(res.message == "You have successfully logged in"){
            //entrar en la app
            this.setLang(res.lang);
            sessionStorage.setItem('lang', res.lang)
            this.setEnvironment(res.token);
            this.setMessage(res.message);
            return {logged:this.isloggedIn,reason:""};

          }else if(res.type=="2FA request approval"){
            return {logged:this.isloggedIn,reason:"2FA"};
          }
          else if(res.type=="Update Phone"){
            return {logged:this.isloggedIn,reason:"Update Phone"};
          }
          else{
            this.isloggedIn = false;
            this.setMessage(res.message);
            return {logged:this.isloggedIn,reason:"Response error"};
          }

       }, (err) => {
         console.log(err);
         //this.isLoginFailed = true;
         this.setMessage("Login failed");
         this.isloggedIn = false;
         //return this.isloggedIn;
         return {logged:this.isloggedIn,reason:"Response error"};
       }
    );
  }

  sendApprovalRequest(email:any,device:any){
    var deviceInformation={deviceInformation:device.info}
    var params=email;
    return this.http.post(environment.api+'/api/signin/requestApproval/'+params,deviceInformation)
    .map( (res : any) => {
      if(res.type=="2FA approved"){
        return {logged:this.isloggedIn,reason:"2FA request approved",token:res.token};
      }


    }, (err) => {
      console.log(err);
      //this.isLoginFailed = true;
      this.setMessage("Login failed");
      this.isloggedIn = false;
      //return this.isloggedIn;
      return {logged:this.isloggedIn,reason:"Response error"};
    });
  }

  secondFactor(token: string,email:string,device:any, password:any) {
    this.cancelWaitingAuthy=false;
    const tick: Observable<number> = timer(1000, 1000);
    return Observable.create(subject => {
      this.tock = 0;
      const timerSubscription = tick.subscribe(() => {
        let params=token+"-code-"+email+"-code-"+device.id;
        this.http.get(environment.api+'/api/signin/status2FA/'+params).subscribe( (response:any) => {
          this.tock++;
          if (response.status == 'approved') {
            var data = {email: email, password: password};
            this.http.post(environment.api+'/api/signin/isLogged2FA/', data).subscribe( (res:any) => {
              if(res.message=='You have successfully logged in'){
                this.setLang(res.lang);
                sessionStorage.setItem('lang', res.lang)
                this.setEnvironment(res.token);
                this.setMessage(res.message);
                this.isloggedIn=true;
                this.closeSecondFactorObservables(subject, true, timerSubscription);
              }else{
                this.isloggedIn=false;
                this.setMessage("Login failed");
                this.closeSecondFactorObservables(subject, false, timerSubscription);
              }

            });

          }
          else if (response.status == 'denied') {
            this.isloggedIn=false;
            this.setMessage("Authy access denied");
            this.closeSecondFactorObservables(subject, false, timerSubscription);
          }
          else if (this.tock == 60) {
            this.isloggedIn=false;
            this.setMessage("Authy time out");
            this.closeSecondFactorObservables(subject, false, timerSubscription);
          }
          else if(this.cancelWaitingAuthy==true){
            this.isloggedIn=false;
            this.setMessage("Cancel Authy");
            this.closeSecondFactorObservables(subject, false, timerSubscription);
          }
        });
      });

    });
  }
  closeSecondFactorObservables(subject: Subject<any>, result: boolean, timerSubscription: Subscription) {
    subject.next(result);
    subject.complete();
    timerSubscription.unsubscribe();
    this.tock=0;
  }

  getTock(){
    return this.tock;
  }

  stopPetition(){
    this.cancelWaitingAuthy=true;
  }

  logout() {
    this.token = null;
    this.role = null;
    this.group = null;
    this.lang = null;
    this.expToken = null;
    this.isloggedIn = false;
    this.message = null;
    this.currentPatient = null;
    this.patientList = null;
    //if(!this.getIsApp()){
      sessionStorage.clear();
    //}
  }

  getToken() {
    return this.token;
  }

  isAuthenticated() {
    // here you can check if user is authenticated or not through his token
    return this.isloggedIn;
  }
  //este metodo sobraría si se usa el metodo signinUser
  setAuthenticated(token) {
    // here you can check if user is authenticated or not through his token
    this.isloggedIn=true;
    this.token=token;
  }
  getLoginUrl(): string {
		return this.loginUrl;
	}
  getRedirectUrl(): string {
		return this.redirectUrl;
	}
	setRedirectUrl(url: string): void {
		this.redirectUrl = url;
	}
  setMessage(message: string): void {
		this.message = message;
	}
  getMessage(): string {
		return this.message;
	}
  setRole(role: string): void {
    this.role = role;
  }
  getRole(): string {
    return this.role;
  }
  setGroup(group: string): void {
    this.group = group;
  }
  getGroup(): string {
    return this.group;
  }
  setExpToken(expToken: number): void {
    this.expToken = expToken;
  }
  getExpToken(): number {
    return this.expToken;
  }
  setIdUser(iduser: string): void {
    this.iduser = iduser;
  }
  getIdUser(): string {
    return this.iduser;
  }
  setCurrentPatient(currentPatient: ICurrentPatient): void {
    this.currentPatient = currentPatient;
  }
  getCurrentPatient(): ICurrentPatient {
    return this.currentPatient;
  }
  setPatientList(patientList: Array<ICurrentPatient>): void {
    this.patientList = patientList;
  }
  getPatientList(): Array<ICurrentPatient> {
    return this.patientList;
  }
  setLang(lang: string): void {
    this.lang = lang;
    sessionStorage.setItem('lang', this.lang);
  }
  getLang(): string {
    return this.lang;
  }
  getIsApp(): boolean {
    return this.isApp;
  }
}

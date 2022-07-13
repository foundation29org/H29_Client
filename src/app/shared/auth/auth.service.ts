import { Injectable } from '@angular/core';
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { Observable } from 'rxjs/Observable';
import 'rxjs/add/observable/of';
import 'rxjs/add/operator/map';
import * as decode from 'jwt-decode';
import { ICurrentPatient } from './ICurrentPatient.interface';
import { Subscription } from 'rxjs';

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
  private subgroup: string;
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
      this.setMessage(sessionStorage.getItem('msg'));

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
      this.setSubgroup(tokenPayload.subgroup);

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
    this.setSubgroup(tokenPayload.subgroup);
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
            var msg = "";
            if(res.showPopup){
              msg = "showPopup";
              this.setMessage(msg);
            }
            return {logged:this.isloggedIn,reason:msg};

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

  signin2FA(email,password,deviceId,deviceInformation){
    this.cancelWaitingAuthy=false;
    return Observable.create(subject => {
      var body = {
        "email": email,
        "password": password,
        "deviceInformation": deviceInformation,
        "deviceId":deviceId
      }
      this.http.post(environment.api+'/api/signin2FA',body).timeout(60000).catch(err => {
          this.isloggedIn=false;
          this.setMessage("Authy time out");
          subject.next(false);
          subject.complete();
          return Observable.throw(err);
        }).subscribe( (response:any) => {
        if(response.message == "You have successfully logged in"){
          if (response.token!=null){
            this.setLang(response.lang);
            sessionStorage.setItem('lang', response.lang)
            this.setEnvironment(response.token);
            this.setMessage(response.message);
            this.isloggedIn=true;
            subject.next(true);
            subject.complete();
          }
          
        }
        else if(response.message == "Authentication denied"){
          this.isloggedIn=false;
          this.setMessage("Authy access denied");
          subject.next(false);
          subject.complete();
        }
        else if(this.cancelWaitingAuthy==true){
          this.isloggedIn=false;
          this.setMessage("Cancel Authy");
          this.subscription.unsubscribe();
          subject.next(false);
          subject.complete();
        }
      });
    });
  }

  stopPetition(){
    this.cancelWaitingAuthy=true;
  }

  logout() {
    this.token = null;
    this.role = null;
    this.group = null;
    this.subgroup = null;
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
    sessionStorage.setItem('msg', message)
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
  setSubgroup(subgroup: string): void {
    this.subgroup = subgroup;
  }
  getSubgroup(): string {
    return this.subgroup;
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

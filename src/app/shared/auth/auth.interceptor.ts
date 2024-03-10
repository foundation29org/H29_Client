import { Injectable, Injector } from '@angular/core';
import { Router } from '@angular/router';
import { HttpClient, HttpEvent, HttpInterceptor, HttpHandler, HttpRequest, HttpResponse, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs/Rx';
import 'rxjs/add/observable/throw'
import 'rxjs/add/operator/catch';

import { AuthService } from './auth.service';
import { TokenService } from './token.service';
import { environment } from 'environments/environment';

import { EventsService} from 'app/shared/services/events.service';

import { from } from 'rxjs/observable/from';
import { isRegExp } from 'util';

var isApp:boolean=false;
type HttpMethod = 'get' | 'post' | 'put' | 'patch' | 'head' | 'delete' | 'upload' | 'download';
declare let cordova: any;
var serverTrusted:boolean = false;

@Injectable()
export class AuthInterceptor implements HttpInterceptor {
    constructor(private inj: Injector, private router: Router) {
      isApp = document.URL.indexOf( 'http://' ) === -1 && document.URL.indexOf( 'https://' ) === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
      serverTrusted = false;
    }

    intercept(req: HttpRequest<any>, next: HttpHandler): Observable<HttpEvent<any>> {
        var eventsService = this.inj.get(EventsService);
        let authService = this.inj.get(AuthService); //authservice is an angular service

        // Get the auth header from the service.
        const Authorization = authService.getToken();

        if((!isApp && (authService.getToken()==undefined)) || ((req.url.indexOf("assets")!==-1)&& (authService.getToken()==undefined))){
          const authReq = req.clone({ headers: req.headers});
          return next.handle(authReq)
        }
        else if(isApp && (authService.getToken()==undefined) && (req.url.indexOf("assets")==-1)){
          const authReq = req.clone({ headers: req.headers});
          if(serverTrusted){
            return from(this.handleNativeRequest(authReq,false,authService,eventsService)).catch((error)=>{
              this.manageErrors(error,isExternalReq,authService,eventsService);
              return Observable.throw(error);
            }) as any;

          }
          else if(!serverTrusted){
            serverTrusted=true;
            cordova.plugin.http.setServerTrustMode('pinned', function() {
              return from(this.handleNativeRequest(authReq,false,authService,eventsService)).catch((error)=>{
                this.manageErrors(error,isExternalReq,authService,eventsService);
                return Observable.throw(error);
              }) as any;
            }.bind(this), function(error) {
              this.manageErrors(error,false,authService,eventsService);
              serverTrusted=false;
              return Observable.throw(error);
            }.bind(this));
          }
        }
        // Clone the request to add the new header.
        var token =  authService.getToken();
        var type = 'Bearer'

        var isExternalReq = false;

        // Add headers to petition

        //var authReq = req.clone({ headers: req.headers.set('authorization',  `${type} ${token}`) });
        var authReq = req.clone({});
        if(req.url.indexOf(environment.api)!==-1){
          authReq = req.clone({ headers: req.headers.set('authorization',  `${type} ${token}`) });
          let tokenService = this.inj.get(TokenService);
          if(!tokenService.isTokenValid()){
            authService.logout();
            this.router.navigate([authService.getLoginUrl()]);
          }
        }

        //si hace llamada a https://api.microsofttranslator.com, no meter la authorization
        if(req.url.indexOf('https://api.cognitive.microsoft.com/sts/v1.0/issueToken')!==-1){
          isExternalReq = true;
          authReq = req.clone({ headers: req.headers.set('Ocp-Apim-Subscription-Key',  environment.keyCognitiveMicrosoft ), responseType: 'text'});
        }

        if(req.url.indexOf('https://api.microsofttranslator.com')!==-1){
          isExternalReq = true;
          authReq = req.clone({ responseType: 'text' });
        }
        if(req.url.indexOf('https://api.cognitive.microsofttranslator.com')!==-1){
          isExternalReq = true;
          authReq = req.clone({ headers: req.headers.set('Ocp-Apim-Subscription-Key',  environment.keyCognitiveMicrosoft ) });
        }

        if(req.url.indexOf('healthbot')!==-1){
          isExternalReq = true;
          const headers = new HttpHeaders({
            'Content-Type':  'text/html; charset=utf-8',
            'Access-Control-Allow-Methods': 'GET'
          });
          authReq = req.clone({ headers, responseType: 'text'});//'Content-Type',  'application/json'
        }

        //get genes
        if(req.url.indexOf('api/contribution/SearchGenes')!==-1){
          isExternalReq = true;
          const headers = new HttpHeaders({
            'existingGenes':'[]'
          });
          authReq = req.clone({ headers});//'Content-Type',  'application/json'
        }

        if(isApp && (req.url.indexOf("assets")==-1)){
          if(serverTrusted){
            //return from(this.handleNativeRequest(authReq,isExternalReq,authService,eventsService))
            return from(this.handleNativeRequest(authReq,isExternalReq,authService,eventsService)).catch((error)=>{
              this.manageErrors(error,isExternalReq,authService,eventsService);
              return Observable.throw(error);
            }) as any;
          }
          else{
            cordova.plugin.http.setServerTrustMode('pinned', function() {
              serverTrusted=true;
              return from(this.handleNativeRequest(authReq,isExternalReq,authService,eventsService)).catch((error)=>{
                this.manageErrors(error,isExternalReq,authService,eventsService);
                return Observable.throw(error);
              }) as any;
            }.bind(this), function(error) {
              console.log('error :('+error+')');
              this.manageErrors(error,isExternalReq,authService,eventsService);
              serverTrusted=false;
              return Observable.throw(error);
            }.bind(this));
          }
        }
        else if(isApp && (req.url.indexOf("assets")==-1)){
          return from(this.handleNativeRequest(authReq,isExternalReq,authService,eventsService)).catch((error)=>{
            this.manageErrors(error,isExternalReq,authService,eventsService);
            return Observable.throw(error);
          }) as any;
        }

        else if(!isApp || (req.url.indexOf("assets")!==-1)){
          // se podría controlar antes sin realizar la petición por si no hay conexión a internet con esto: navigator.onLine
          // Pass on the cloned request instead of the original request.
          return next.handle(authReq)
          .catch((error, caught) => {
            this.manageErrors(error,isExternalReq,authService,eventsService);
            return Observable.throw(error);
          }) as any;
        }

    }

    private async handleNativeRequest(request: HttpRequest<any>,isExternalReq,authService,eventsService): Promise<HttpResponse<any>> {

      try {
        const responseTotal = await this.sendRequestForApps(request,isExternalReq,authService,eventsService);
        return responseTotal;

      } catch (error) {
        if (!error.status) {
          return Promise.reject(error);
        }
        const response = new HttpResponse({
          body: error.error,
          status: error.status,
          headers: error.headers,
          url: error.url,
        });
        this.manageErrors(response,isExternalReq,authService,eventsService);
        return Promise.reject(response)
      }
    }

    private sendRequestForApps(request,isExternalReq,authService,eventsService): Promise<HttpResponse<any>> {

      if(request.url.indexOf('healthbot')!==-1){
        const headers = new HttpHeaders({
          'Content-Type':  'text/html; charset=utf-8',
          'Access-Control-Allow-Methods': 'GET',
          'origin':environment.api.split(":")[0]+":"+environment.api.split(":")[1]
        });
        request = request.clone({ headers, responseType: 'text'})

        // Url without port
        let urlWithParamsWithoutPort=request.urlWithParams.split(":")[0]+":"+request.urlWithParams.split(":")[1]
        let urlWithParamsWithoutPort_methodAndParams=request.urlWithParams.split("/")[3]
        request.urlWithParams=urlWithParamsWithoutPort+"/"+urlWithParamsWithoutPort_methodAndParams;
      }

      const headerKeys = request.headers.keys();
      const header = {};
      headerKeys.forEach((key) => {
        header[key] = request.headers.get(key);
      });

      const method = <HttpMethod> request.method.toLowerCase();
      const nativeHttp = cordova.plugin.http;

      return new Promise((resolve,reject)=>{
        // Configure options:
        // Serialize
        var serializer='json'
        // Options
        var options= {};
        options= {
          method: method,
          data: request.body,
          headers: header,
          serializer:serializer
        }

        if((request.urlWithParams.includes(environment.api)==true)&&(request.urlWithParams.includes("qna")==false)) {
          request.urlWithParams = encodeURI(request.urlWithParams)
        }

        // Send request
        nativeHttp.sendRequest(request.urlWithParams, options,(response)=>{
          let body;
          try {
            body = JSON.parse(response.data);
          } catch (error) {
            console.log(error)
            body = response.data;
          }
          const responseTotal = new HttpResponse({
            body: body,
            status: response.status,
            headers: response.headers,
            url: response.url,
          });
          // return response
          return resolve(responseTotal);

        },(response)=>{
          console.log(response)
          let bodyError;
          try {
            bodyError =  JSON.parse(response.error);
          } catch (error) {
            bodyError = response.error;
          }
          const responseTotal = new HttpResponse({
            body:bodyError,
            status: response.status,
            headers: response.headers,
            url: response.url,
          });
          this.manageErrors(responseTotal,isExternalReq,authService,eventsService);
          return reject(responseTotal);
        });

      })


    }

    private manageErrors(error,isExternalReq,authService,eventsService){
      if (error.status === 403 && !isExternalReq && error.statusText == 'Forbidden') {
          authService.logout();
          this.router.navigate(['/login']);
      }
      if (error.status === 401) {
        if(!isExternalReq){
          //logout users, redirect to login page
          authService.logout();
          this.router.navigate(['/login']);
        }
      }
      if (error.status === 404 || error.status === 0) {
        if(!isExternalReq){
          var returnMessage = error.message;
          if(error.error.message){
            returnMessage = error.error;
          }
          eventsService.broadcast('http-error', returnMessage);
        }else{
          eventsService.broadcast('http-error-external', 'no external conexion');
        }
      }
      if (error.status === 419) {
        if(!isExternalReq){
          authService.logout();
          this.router.navigate(['/login']);
        }
      }
    }
}

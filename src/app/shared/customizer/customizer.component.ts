import { Component, OnInit, OnDestroy, ViewChild, ElementRef, Injector } from '@angular/core';
import { Router } from "@angular/router";
import { HttpClient } from "@angular/common/http";
import * as BotChat from "botframework-webchat";
import { AuthService } from 'app/shared/auth/auth.service';
import { environment } from 'environments/environment';
import { TranslateService } from '@ngx-translate/core';
import { EventsService} from 'app/shared/services/events.service';
import { Subscription } from 'rxjs/Subscription';
import { AlertsService } from 'app/shared/services/alerts.service';
import { PatientService } from '../services/patient.service';

interface Window {
    WebChat?: any;
}

declare var window: Window;
//declare var doOnClick:Boolean;

//declare var require: any;

@Component({
  selector: 'app-customizer',
  templateUrl: './customizer.component.html',
  styleUrls: ['./customizer.component.scss'],
  providers: [PatientService]
})
export class CustomizerComponent implements OnInit, OnDestroy {

  status: number = -1;
  statusText: string = '';
  response: string = '';
  userName: string = '';

  group: string;
  groupId: string;
  patientId: string;
  nameundiagnosed: string = 'Undiagnosed';
  user: any = [];

  doExit=false;
  notificationScenarioShown:boolean=false;
  @ViewChild("botWindow") botWindowElement: ElementRef;
  private subscription: Subscription = new Subscription();


  constructor(private router: Router,private authService: AuthService, private http: HttpClient, public translate: TranslateService, private eventsService: EventsService,private patientService: PatientService, private alertService:AlertsService,private inj: Injector){
    this.group = this.authService.getGroup();
    this.notificationScenarioShown = false;
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnInit() {
    // Customizer JS File
    $.getScript('./assets/js/customizer.js');

    this.initEnvironment();
    this.notificationScenarioShown=false;
  }

  reloadPage(){
    //location.reload();
    /*this.router.navigateByUrl('/user/dashboard/dashboard1', {skipLocationChange: true}).then(() =>
    this.router.navigate([this.router.url]));*/
    this.initEnvironment();
  }

  wait(ms){
    var start = new Date().getTime();
    var end = start;
    while(end < start + ms) {
      end = new Date().getTime();
    }
  }

  initEnvironment(){
    this.subscription.add( this.http.get(environment.api+'/api/users/'+this.authService.getIdUser())
    .subscribe( (res : any) => {
      this.user = res.user;
      this.subscription.add( this.http.get(environment.api+'/api/group/'+this.authService.getGroup())
      .subscribe( (resGroup : any) => {
        this.groupId = resGroup._id;
        this.chatRequested();

      }, (err) => {
        console.log(err);
      }));
     }, (err) => {
       console.log(err);
     }));
  }

  chatRequested() {
    var paramssend = { userName: this.user.userName, userId: this.authService.getIdUser(), token: this.authService.getToken(), groupId: this.groupId, lang: this.user.lang, knowledgeBaseID: ''}; //http://healthbotcontainersamplef666.scm.azurewebsites.net:80/chatBot
    this.subscription.add( this.http.get(environment.healthbot+':443/chatBot',{params: paramssend})
    .subscribe( (res : any) => {
      this.initBotConversation(res);
     }, (err) => {
       console.log(err);
     }));

  }

  initBotConversation(token) {
      if (this.status >= 400) {
          alert(this.statusText);
          return;
      }
      // extract the data from the JWT
      const jsonWebToken = token;
      const tokenPayload = JSON.parse(atob(jsonWebToken.split('.')[1]));
      const user = {
          id: tokenPayload.userId,
          name: tokenPayload.userName
      };
      let domain = 'https://europe.directline.botframework.com/v3/directline';
      const botConnection = new BotChat.DirectLine({
          //secret: botSecret,
          token: tokenPayload.connectorToken,
          domain: domain
      });
      this.startChat(user, botConnection);

      //var cron1=this.cron;

      var eventsAlert = this.inj.get(AlertsService);
      var doOnclick=false;
      this.doExit==false
      var loadingNotifications=false;


      $(document).ready(function(){
        $('#customizer-toggle-icon').click(function(){
          doOnclick=!doOnclick;
        }.bind(this))
      })

      var header = document.getElementsByClassName("wc-header");
      var headerStringTranslate=this.translate.instant("generics.Assistant")
      header[0].innerHTML = "<span>"+headerStringTranslate+"</span>"
      console.log(botConnection)
      console.log(jsonWebToken)
      //botConnection.postActivity({type: "message", text: "begin inithealth29", from: user}).subscribe(function (id) {console.log("success")});
      botConnection.activity$.subscribe(function (activity: any) {
        console.log(activity)
      })
      this.subscription.add( botConnection.postActivity({type: "event", value: jsonWebToken, from: user, name: "InitAuthenticatedConversation"}).subscribe(function (id) {
          if(this.group == this.nameundiagnosed){
            this.subscription.add( botConnection.postActivity({type: "message", text: "begin undiagnosed", from: user}).subscribe(function (id) {console.log("success undiagnosed")}));
          }else{
              var botName=undefined;
             this.subscription.add( botConnection.postActivity({type: "message", text: "begin inithealth29", from: user}).subscribe(function (id) {console.log("success")}));
             this.subscription.add( botConnection.activity$.filter(function (activity) {
                if(activity.type === "message" && activity.text === "This conversation has timed out"){
                  var x = document.getElementsByClassName("format-markdown");

                  for (var element=0;element<x.length;element++){
                    var stringElement=x[element].firstElementChild.childNodes[0].textContent;

                    if(stringElement =="This conversation has timed out"){
                      var tempElement=x[element].firstElementChild.childNodes[0];
                      tempElement.textContent = this.translate.instant("generics.TimeOut");
                      $(x[element].firstElementChild.childNodes[0]).replaceWith(tempElement.textContent);
                    }
                  }
                }
                else if(activity.type === "message" && ((activity.text === "Sorry, it seems I can't answer this.")||(activity.text === "Parece que no puedo responder a esto."))){
                  var x = document.getElementsByClassName("format-markdown");

                  for (var element=0;element<x.length;element++){
                    var stringElement=x[element].firstElementChild.childNodes[0].textContent;

                    if((stringElement =="Sorry, it seems I can’t answer this.")||(stringElement =="Parece que no puedo responder a esto.")){
                      var tempElement=x[element].firstElementChild.childNodes[0];
                      tempElement.textContent = this.translate.instant("generics.NotUnderstand");
                      $(x[element].firstElementChild.childNodes[0]).replaceWith(tempElement.textContent);
                    }
                  }
                }

                else if((activity.text ==="I didn't understand. Please choose an option from the list.")||
                (activity.text ==="No se pudo reconocer su respuesta. Por favor seleccione una opción de la lista.")){
                  var x = document.getElementsByClassName("format-markdown");
                  for (var element=0;element<x.length;element++){
                    var stringElement=x[element].firstElementChild.childNodes[0].textContent;
                    if((stringElement =="I didn’t understand. Please choose an option from the list.")||
                    (stringElement=="No se pudo reconocer su respuesta. Por favor seleccione una opción de la lista.")){
                      var tempElement=x[element].firstElementChild.childNodes[0];
                      tempElement.textContent = this.translate.instant("generics.Understand");
                      $(x[element].firstElementChild.childNodes[0]).replaceWith(tempElement.textContent);
                    }
                  }

                }

                else if(activity.type === "text" && activity.value === "openDialog"){
                  if((doOnclick==false)&&(this.doExit==false)){
                    $('#customizer-toggle-icon').click();
                  }
                  else if(this.doExit==true){
                    this.doExit=false;
                  }

                }

                else if ((activity.value === "exit")||(activity.text == "Exit from chat")){
                  this.doExit=true;
                  this.wait(3000);
                  $('.wc-message-group-content').empty();
                  $('.customizer').width('360px');
                  $('.customizer-maximize').show();
                  $('.customizer-minimize').hide();
                  $('.customizer').removeClass('open');
                  $('.wc-message-groups').append( $('.wc-message-group-content'));

                  if(loadingNotifications==false){
                    this.subscription.add( botConnection.postActivity({type: "message", text: "begin inithealth29", from: user}).subscribe(function (id) {
                      console.log("success")
                    }));
                  }
                  else{
                    //this.wait(7000)
                    loadingNotifications=false;
                  }

                }

                else if(activity.type === "message" && ((activity.text === "Oops. Something went wrong and we need to start over.")||(activity.text === "Oops. Ocurrió un problema. Por favor vuelva a intentar."))){
                  var x = document.getElementsByClassName("format-markdown");
                  for (var element=0;element<x.length;element++){
                    var stringElement=x[element].firstElementChild.childNodes[0].textContent;
                    if((stringElement =="Oops. Something went wrong and we need to start over.")||
                    (stringElement == "Oops. Ocurrió un problema. Por favor vuelva a intentar.")){
                      var tempElement=x[element].firstElementChild.childNodes[0];
                      tempElement.textContent = this.translate.instant("generics.It seems that something is not working well");
                      $(x[element].firstElementChild.childNodes[0]).replaceWith(function () {
                        return tempElement.textContent;
                      });
                      this.wait(2000)
                      //this.reloadPage()
                    }
                  }


                }

                else if(activity.type === "endOfConversation"){
                  this.wait(2000);
                  $('.customizer').removeClass('open');
                  $.getScript('./assets/js/customizer.js');
                  this.ngOnInit();
                }

                return (activity.type === "event" && activity.name === "redirect")
              }.bind(this))
              .subscribe(function (activity) {
                if(activity.type === "message" && activity.text === "This conversation has timed out"){
                  var x = document.getElementsByClassName("format-markdown");

                  for (var element=0;element<x.length;element++){
                    var stringElement=x[element].firstElementChild.childNodes[0].textContent;

                    if(stringElement =="This conversation has timeout"){
                      var tempElement=x[element].firstElementChild.childNodes[0];
                      tempElement.textContent = this.translate.instant("generics.TimeOut");
                      $(x[element].firstElementChild.childNodes[0]).replaceWith(tempElement.textContent);
                    }
                  }
                }

                else{
                  if(activity.value=='faqs'){
                    this.router.navigate(['/user/faq']);
                  }else if(activity.value=='symptoms'){
                    //this.router.navigate(['/user/phenotype']);
                  }else if(activity.value=='gene'){
                    this.router.navigate(['/user/genotype']);
                  //}else if((activity.value=='proms')||(activity.value=='respiratorySection')||(activity.value=='heartSection')||(activity.value=='physicaloutcomesSection')){
                  }else if(activity.value=='proms'){
                    this.router.navigate(['/user/clinicinfo/courseofthedisease']);
                  //}else if ((activity.value=='respiratoryTests')||(activity.value=='heartTests')){
                  }else if (activity.value=='visits'){
                    this.router.navigate(['/user/clinicinfo/medicalcare']);
                  }else if (activity.value=='weightSection'){
                    this.router.navigate(['/user/clinicinfo/anthropometry']);
                  }else if (activity.value=='vaccinationsSection'){
                    this.router.navigate(['/user/clinicinfo/vaccinations']);
                  }else if(activity.value=='notification'){
                    loadingNotifications=true;
                    this.router.navigate(['/notifications-menu'])
                  }else if(activity.value=='drugs'){
                    this.router.navigate(['/user/clinicinfo/medication']);
                  }else if(activity.value=='home'){
                    this.router.navigate(['/user/dashboard/dashboard1']);
                  }else if(activity.value=='fillPersonalData'){
                    this.router.navigate(['/user/basicinfo/personalinfo']);
                  }

                }



              }.bind(this)));

        }


    }.bind(this)));

  }

  startChat(user, botConnection) {
    const botContainer = document.getElementById('botContainer');
    $('#botContainer').empty();
    botContainer.classList.add("wc-display");
    BotChat.App({
        botConnection: botConnection,
        user: user,
        locale: this.user.lang,
        bot: {id: ''},
        resize: 'detect'
        // sendTyping: true,    // defaults to false. set to true to send 'typing' activities to bot (and other users) when user is typing
    }, botContainer);
  }

}

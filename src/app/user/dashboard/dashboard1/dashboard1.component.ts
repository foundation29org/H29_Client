import { Component, OnDestroy, OnInit, ElementRef } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { globalvars } from 'app/shared/global-variables';
import { TranslateService } from '@ngx-translate/core';
import { AuthService } from 'app/shared/auth/auth.service';
import { DomSanitizer } from '@angular/platform-browser';
import { Router } from '@angular/router';
import { environment } from 'environments/environment';
import { Subscription } from 'rxjs/Subscription';
import swal from 'sweetalert2';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { OpenAiService } from 'app/shared/services/openAi.service';

declare let cordova: any;

@Component({
  selector: 'app-dashboard1',
  templateUrl: './dashboard1.component.html',
  styleUrls: ['./dashboard1.component.scss'],
  providers: [OpenAiService]
})

export class Dashboard1Component implements OnInit, OnDestroy {
  group: string;
  subgroup: string;
  nameduchenneInter: string = globalvars.duchenneinternational;
  namediabetes: string = 'Diabetes';
  nameundiagnosed: string = 'Undiagnosed';

  userId: string = '';
  isApp: boolean = document.URL.indexOf('http://') === -1 && document.URL.indexOf('https://') === -1 && location.hostname != "localhost" && location.hostname != "127.0.0.1";
  lang: string = 'en';
  urlimg: string = 'assets/img/Duchenne_en.jpg';
  private subscription: Subscription = new Subscription();

  emergencyNotes: string = '';
  isEditing: boolean = false;
  loadedEmergency = false;

  query: string = '';
  queryCopy: string = '';
  callinglangchainraito: boolean = false;
  responseLangchain: string = '';

  groupId: string;

  constructor(private http: HttpClient, public translate: TranslateService, private authService: AuthService, private sanitizer: DomSanitizer, private router: Router, public toastr: ToastsManager, private openAiService: OpenAiService, private elRef: ElementRef) {
    this.group = this.authService.getGroup();
    this.subgroup = this.authService.getSubgroup();
    this.userId = this.authService.getIdUser();
    this.lang = this.authService.getLang();
    this.urlimg = 'assets/img/Duchenne_' + this.lang + '.jpg';
    window.scrollTo(0, 0)
  }

  goToExternalUrl(url) {
    if (this.isApp) {
      cordova.InAppBrowser.open(url, "_system", { location: "yes", closebuttoncaption: "Done" });
    } else {
      window.open(url, '_blank');
    }
  };

  ngOnInit(): void {
    this.initHome()
  }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  async initHome() {
    if (this.authService.getCurrentPatient() == null) {
      await this.getPatientId();
    }
    //this.getEmergencyNotes();
    this.getGroupId();
  }


  async getPatientId() {
    return new Promise((resolve, reject) => {
      this.subscription.add(
        this.http.get(environment.api + '/api/patients-all/' + this.authService.getIdUser())
          .subscribe(
            (res: any) => {
              if (res.listpatients.length > 0) {
                this.authService.setPatientList(res.listpatients);
                this.authService.setCurrentPatient(res.listpatients[0]);
              }
              resolve(res); // Resuelve la promesa cuando se obtiene la respuesta
            },
            (err) => {
              reject(err); // Rechaza la promesa en caso de error
            }
          )
      );
    });
  }

  adjustTextareaHeight(): void {
    setTimeout(() => {
      const textareaEl = this.elRef.nativeElement.querySelector('textarea');
      if (textareaEl) {
        textareaEl.style.height = 'auto';
        textareaEl.style.height = `${textareaEl.scrollHeight}px`;
      }
    });
  }

  toggleEdit(): void {
    this.isEditing = !this.isEditing;
    if (this.isEditing) {
      this.adjustTextareaHeight();
    }
  }

  getEmergencyNotes() {
    this.subscription.add(this.http.get(environment.api + '/api/patient/emergencynotes/' + this.authService.getCurrentPatient().sub)
      .subscribe((res: any) => {
        this.emergencyNotes = res.emergencyNotes;
        this.loadedEmergency = true;
      }
      ));
  }

  setEmergencyNotes(){
    this.subscription.add(this.http.post(environment.api + '/api/patient/emergencynotes/' + this.authService.getCurrentPatient().sub, {emergencyNotes: this.emergencyNotes})
      .subscribe((res: any) => {
        console.log('Emergency notes updated successfully');
        this.isEditing = false;
      }
      ));
  }

  getGroupId() {
    this.subscription.add( this.http.get(environment.api+'/api/group/'+this.authService.getGroup())
      .subscribe( (resGroup : any) => {
        this.groupId = resGroup._id;
      }, (err) => {
        console.log(err);
      }));
  }

  search(){
    console.log(this.query)
    this.callinglangchainraito = true;
    var query = {"question": this.query, "lang": this.authService.getLang()};
    this.responseLangchain = '';
    this.subscription.add(this.openAiService.postOpenAi3(query)
      .subscribe((res: any) => {
        console.log(res)
        this.queryCopy = this.query;
        this.query = '';
        this.responseLangchain = res.data;
        this.callinglangchainraito = false;
        
      }, (err) => {
        this.callinglangchainraito = false;
        console.log(err);
        this.toastr.error('', this.translate.instant("generics.error try again"));
        
    }));

  }

  sendFeedback(valueVote){
    var data = {"answer": this.responseLangchain,"userQuestion":this.queryCopy,"value": valueVote};
    var info = {
      "lang":this.lang,
      "data":data,
      "type": "qna",
      "user":this.authService.getIdUser()
    }
    this.subscription.add(this.http.post((environment.api+'/api/bot/'+ this.groupId), info)
      .subscribe( (res : any) => {
        swal({
          type: 'success',
          html: this.translate.instant("faqs.thanksvote")
        })
      }, (err) => {
        console.log(err);
      }));
  }

}

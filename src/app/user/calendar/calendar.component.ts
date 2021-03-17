import { Component, ChangeDetectionStrategy, ViewChild, TemplateRef, OnInit, OnDestroy } from '@angular/core';
import { startOfDay, endOfDay, subDays, addDays, endOfMonth, isSameDay, isSameMonth, addHours } from 'date-fns';
import { Router } from "@angular/router";
import { environment } from 'environments/environment';
import { HttpClient } from "@angular/common/http";
import { AuthService } from 'app/shared/auth/auth.service';
import { AuthGuard } from 'app/shared/auth/auth-guard.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import swal from 'sweetalert2';
import { Subject } from 'rxjs/Subject';
import { NgbModal } from '@ng-bootstrap/ng-bootstrap';
import { CalendarEvent, CalendarEventAction, CalendarEventTimesChangedEvent } from 'angular-calendar';
import { TranslateService } from '@ngx-translate/core';
import { Subscription } from 'rxjs/Subscription';

interface MyEvent extends CalendarEvent {
  _id: any;
  GUID: any;
  type: any;
  duracion: any;
  disparadores: any;
  disparadorEnfermo: any;
  disparadorOtro: any;
  disparadorNotas: any;
  descripcion: any;
  descripcionRigidez: any;
  descripcionContraccion: any;
  descripcionOtro: any;
  descipcionNotas: any;
  postCrisis: any;
  postCrisisOtro: any;
  postCrisisNotas: any;
  estadoAnimo: any;
  estadoConsciencia: any;
}

const colors: any = {
  red: {
    primary: '#ad2121',
    secondary: '#FAE3E3'
  },
  blue: {
    primary: '#1e90ff',
    secondary: '#D1E8FF'
  },
  yellow: {
    primary: '#e3bc08',
    secondary: '#FDF1BA'
  }
};

@Component({
  selector: 'app-calendar',
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './calendar.component.html',
  styleUrls: ['./calendar.component.scss']
})

export class CalendarsComponent implements OnInit, OnDestroy{
  @ViewChild('modalContent') modalContent: TemplateRef<any>;
  @ViewChild('modalGraphContent') modalGraphContent: TemplateRef<any>;

  view: string = 'month';

  newEvent: MyEvent;
  lastEvent: MyEvent;

  viewDate: Date = new Date();

  modalData: {
    action: string;
    event: MyEvent;
  };

  actions: CalendarEventAction[] = [
    {
      label: '<i class="fa fa-fw fa-pencil"></i>',
      onClick: ({ event }: { event: MyEvent }): void => {
        this.handleEvent('Edit this event', event);
      }
    },
    {
      label: '<i class="fa fa-fw fa-times"></i>',
      onClick: ({ event }: { event: MyEvent }): void => {
        this.events = this.events.filter(iEvent => iEvent !== event);
        this.eliminarSeizure(event);
      //this.handleEvent('This event is deleted!', event);
      }
    }
  ];

  refresh: Subject<any> = new Subject();

  events: MyEvent[] = [];

  activeDayIsOpen: boolean = true;
  loading: boolean = false;
  saving: boolean = false;

  private subscription: Subscription = new Subscription();

  constructor(private http: HttpClient, private router: Router, private authService: AuthService, private authGuard: AuthGuard, private modal: NgbModal, public translate: TranslateService, public toastr: ToastsManager) { }

  ngOnDestroy() {
    this.subscription.unsubscribe();
  }

  ngOnInit() {

    this.loadData();
    //this.loadSampleData();
  }

  loadData(){
    this.events = [];
    this.loading = true;
    this.subscription.add( this.http.get(environment.api+'/api/patients-all/'+this.authService.getIdUser())
    .subscribe( (res : any) => {
      if(res.listpatients.length>0){
        this.authService.setPatientList(res.listpatients);
        this.authService.setCurrentPatient(res.listpatients[0]);
        this.subscription.add( this.http.get(environment.api+'/api/seizures/'+res.listpatients[0].sub)
        .subscribe( (res : any) => {
          if(res.message){
            //no tiene información
            this.events = [];
          }else{
            if(res.length>0){
              for(var i = 0; i < res.length; i++) {
                res[i].start = new Date(res[i].start);
                res[i].end = new Date(res[i].end);
                res[i].actions = this.actions;
              }
              this.events = res;
              this.refresh.next();
              this.lastEvent = JSON.parse(JSON.stringify(res[0]));
              this.lastEvent._id =null;
            }else{
              this.events = [];
            }

          }
          this.loading = false;
         }, (err) => {
           console.log(err);
           this.loading = false;
         }));
      }else{
        swal(this.translate.instant("generics.Warning"), this.translate.instant("personalinfo.Fill personal info"), "warning");
        this.router.navigate(['/user/basicinfo/personalinfo']);
      }
     }, (err) => {
       console.log(err);
       this.loading = false;
     }));
  }

  loadSampleData(){
    this.events = [
      {
        _id: '1',
        GUID: '',
        type: null,
        duracion: {hours: 0, minutes: 0, seconds:0},
        disparadores:[],
  		  disparadorEnfermo:"",
  		  disparadorOtro:"",
  		  disparadorNotas:"",
  		  descripcion:[],
  		  descripcionRigidez:"",
  		  descripcionContraccion:"",
  		  descripcionOtro:"",
  		  descipcionNotas:"",
  		  postCrisis:[],
  		  postCrisisOtro:"",
  		  postCrisisNotas:"",
  		  estadoAnimo:"",
  		  estadoConsciencia:"",
        start: subDays(startOfDay(new Date()), 1),
        end: addDays(new Date(), 1),
        title: 'A 3 day event',
        color: colors.red,
        actions: this.actions
      },
      {
        _id: '2',
        GUID: '',
        type: null,
        duracion: {hours: 0, minutes: 0, seconds:0},
        disparadores:[],
  		  disparadorEnfermo:"",
  		  disparadorOtro:"",
  		  disparadorNotas:"",
  		  descripcion:[],
  		  descripcionRigidez:"",
  		  descripcionContraccion:"",
  		  descripcionOtro:"",
  		  descipcionNotas:"",
  		  postCrisis:[],
  		  postCrisisOtro:"",
  		  postCrisisNotas:"",
  		  estadoAnimo:"",
  		  estadoConsciencia:"",
        start: startOfDay(new Date()),
        title: 'An event with no end date',
        color: colors.yellow,
        actions: this.actions
      },
      {
        _id: '3',
        GUID: '',
        type: null,
        duracion: {hours: 0, minutes: 0, seconds:0},
        disparadores:[],
  		  disparadorEnfermo:"",
  		  disparadorOtro:"",
  		  disparadorNotas:"",
  		  descripcion:[],
  		  descripcionRigidez:"",
  		  descripcionContraccion:"",
  		  descripcionOtro:"",
  		  descipcionNotas:"",
  		  postCrisis:[],
  		  postCrisisOtro:"",
  		  postCrisisNotas:"",
  		  estadoAnimo:"",
  		  estadoConsciencia:"",
        start: subDays(endOfMonth(new Date()), 3),
        end: addDays(endOfMonth(new Date()), 3),
        title: 'A long event that spans 2 months',
        color: colors.blue
      },
      {
        _id: '4',
        GUID: '',
        type: null,
        duracion: {hours: 0, minutes: 0, seconds:0},
        disparadores:[],
  		  disparadorEnfermo:"",
  		  disparadorOtro:"",
  		  disparadorNotas:"",
  		  descripcion:[],
  		  descripcionRigidez:"",
  		  descripcionContraccion:"",
  		  descripcionOtro:"",
  		  descipcionNotas:"",
  		  postCrisis:[],
  		  postCrisisOtro:"",
  		  postCrisisNotas:"",
  		  estadoAnimo:"",
  		  estadoConsciencia:"",
        start: addHours(startOfDay(new Date()), 2),
        end: new Date(),
        title: 'A draggable and resizable event',
        color: colors.yellow,
        actions: this.actions,
        resizable: {
          beforeStart: true,
          afterEnd: true
        },
        draggable: false
      }
    ];
  }

  dayClicked({ date, events }: { date: Date; events: MyEvent[] }): void {
    if (isSameMonth(date, this.viewDate)) {
      if (
        (isSameDay(this.viewDate, date) && this.activeDayIsOpen === true) ||
        events.length === 0
      ) {
        this.activeDayIsOpen = false;
      } else {
        this.activeDayIsOpen = true;
        this.viewDate = date;
      }
    }
  }

  handleEvent(action: string, event: MyEvent): void {
    this.modalData = { event, action };
    this.modal.open(this.modalContent, { size: 'lg' });
  }

  addEvent(): void {
    if(this.lastEvent!=undefined){
      this.newEvent = JSON.parse(JSON.stringify(this.lastEvent));
    }else{
      this.newEvent = {
        _id: null,
        GUID: '',
        type: null,
        duracion: {hours: 0, minutes: 0, seconds:0},
        disparadores:[],
  		  disparadorEnfermo:"",
  		  disparadorOtro:"",
  		  disparadorNotas:"",
  		  descripcion:[],
  		  descripcionRigidez:"",
  		  descripcionContraccion:"",
  		  descripcionOtro:"",
  		  descipcionNotas:"",
  		  postCrisis:[],
  		  postCrisisOtro:"",
  		  postCrisisNotas:"",
  		  estadoAnimo:"",
  		  estadoConsciencia:"",
        title: 'New event',
        start: startOfDay(new Date()),
        end: endOfDay(new Date()),
        color: colors.red,
        actions: this.actions,
      }
    }

    this.events.push(this.newEvent);

    // this.refresh.next();
    this.handleEvent('Add new event', this.newEvent);
     this.refresh.next();
  }

  saveData(param){
    this.lastEvent = JSON.parse(JSON.stringify(param));
    this.lastEvent._id =null;
    if(this.authGuard.testtoken()){
      this.saving = true;
      delete param.actions;
      if(param._id==null){
        delete param._id;
        this.subscription.add( this.http.post(environment.api+'/api/seizures/'+this.authService.getCurrentPatient().sub, param)
        .subscribe( (res : any) => {
          //this.idSocialInfo = res.socialInfo._id;
          //this.socialInfo = res.socialInfo;
          this.saving = false;
          //this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });
         }, (err) => {
           console.log(err);
           this.saving = false;
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             //this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
           }
         }));
      }else{
        this.subscription.add( this.http.put(environment.api+'/api/seizures/'+param._id, param)
        .subscribe( (res : any) => {
          //this.idSocialInfo = res.socialInfo._id;
          //this.socialInfo = res.socialInfo;
          this.saving = false;
          //this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });
         }, (err) => {
           console.log(err.error);
           this.saving = false;
           if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
             this.authGuard.testtoken();
           }else{
             //this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
           }
         }));
      }
    }
  }

  onImport(event) {
    var file = event.srcElement.files[0];
    if (file) {
        var reader = new FileReader();
        reader.readAsText(file, "UTF-8");
        reader.onload = (evt:any) => {
          var seizuresToUpload=JSON.parse(evt.target.result);
          this.uploadSeizures(seizuresToUpload.Seizures);
        }
        reader.onerror = function (evt) {
            console.log('error reading file');
        }
    }
  }

  uploadSeizures(seizurelist){
    var listToUpload = [];

    for(var i = 0; i < seizurelist.length; i++) {
      //inicio variables

      var newEvent = {
        GUID: '',
        type: null,
        duracion: {hours: 0, minutes: 0, seconds:0},
        disparadores:[],
  		  disparadorEnfermo:"",
  		  disparadorOtro:"",
  		  disparadorNotas:"",
  		  descripcion:[],
  		  descripcionRigidez:"",
  		  descripcionContraccion:"",
  		  descripcionOtro:"",
  		  descipcionNotas:"",
  		  postCrisis:[],
  		  postCrisisOtro:"",
  		  postCrisisNotas:"",
  		  estadoAnimo:"",
  		  estadoConsciencia:"",
        title: 'New event',
        start: startOfDay(new Date()),
        end: endOfDay(new Date()),
        color: colors.red
      }
			var cogerhora = seizurelist[i].Date_Time.split(' ');


			var cogerhoraexacta=cogerhora[1].split(':')
			//$scope.crisisaimportar.hora=cogerhoraexacta[0]+":"+cogerhoraexacta[1];


			//$scope.crisisaimportar.duracion=seizurelist[i].length_hr+":"+seizurelist[i].length_min+":"+seizurelist[i].length_sec;



			var disparadores=[];
			disparadores.push(seizurelist[i].triggerchangeinmed);
			disparadores.push(seizurelist[i].triggertired);
			disparadores.push(seizurelist[i].triggerdiet);
			disparadores.push(seizurelist[i].triggerAlcDruguse);
			disparadores.push(seizurelist[i].triggerlight);
			disparadores.push(seizurelist[i].triggerstress);
			disparadores.push(seizurelist[i].triggeroverheated);
			disparadores.push(seizurelist[i].triggerhormonal);
			newEvent.disparadores = this.obtenerDisparadoresImportar(disparadores);


			newEvent.disparadorEnfermo = this.parsearacentos(seizurelist[i].triggersickdescript);//no va

			newEvent.disparadorOtro = this.parsearacentos(seizurelist[i].triggerothervalue);//no va

			newEvent.disparadorNotas = this.parsearacentos(seizurelist[i].triggernotes);//no va

			var descripcion=[];
			descripcion.push(seizurelist[i].descriptaura);
			descripcion.push(seizurelist[i].descriptawareness);
			descripcion.push(seizurelist[i].descripturinebowel);
			descripcion.push(seizurelist[i].descriptlosscomm);
			descripcion.push(seizurelist[i].descriptautomove);
			newEvent.descripcion = this.obtenerDescripcionesImportar(descripcion);


			newEvent.descripcionRigidez = this.obtenerParteCuerpo(seizurelist[i].descriptmuscstiffvalue);

			newEvent.descripcionContraccion = this.obtenerParteCuerpo(seizurelist[i].descriptmustwitval);

			newEvent.descripcionOtro = this.parsearacentos(seizurelist[i].descriptothervalue);//no va


			newEvent.descipcionNotas = this.parsearacentos(seizurelist[i].descriptnotes);//no va

			var postCrisis=[];
			postCrisis.push(seizurelist[i].postlosscommuni);
			postCrisis.push(seizurelist[i].posteventrecalection);
			postCrisis.push(seizurelist[i].postmusweakness);
			postCrisis.push(seizurelist[i].postsleepy);
			newEvent.postCrisis = this.obtenerPostCrisisImportar(postCrisis);

			newEvent.postCrisisOtro = this.parsearacentos(seizurelist[i].postothervalue);

			newEvent.postCrisisNotas = this.parsearacentos(seizurelist[i].postnotes);

			newEvent.estadoAnimo = seizurelist[i].triggermood;//obtener en castellano

      var parsedate = cogerhora[0]+"T00:00:00.000Z";
      newEvent.GUID= seizurelist[i].GUID.trim();
      newEvent.type = this.obtenerTipoConvImportar(seizurelist[i].type);
      if(parseInt(seizurelist[i].length_min)>=60){
				newEvent.duracion.hours=(parseInt(seizurelist[i].length_hr)+1);
        newEvent.duracion.minutes=(parseInt(seizurelist[i].length_min)-60);
        newEvent.duracion.seconds=(parseInt(seizurelist[i].length_sec));
			}else{
				newEvent.duracion.hours=seizurelist[i].length_hr;
        newEvent.duracion.minutes=seizurelist[i].length_min;
        newEvent.duracion.seconds=seizurelist[i].length_sec;
			}
      newEvent.start=new Date(parsedate);
      newEvent.end=new Date(parsedate);
      //newEvent.start=cogerhora[0]+"T"+cogerhoraexacta[0]+":"+cogerhoraexacta[1]+":00.0000000Z";//cambiar dia por mes?
      newEvent.title = 'Imported '+ i;

			listToUpload.push(newEvent);
    }

    //guardar en la base de datos listToUpload
    this.saveMassiveSeizures(listToUpload);

    for(var i = 0; i < listToUpload.length; i++) {
      this.events.push(listToUpload[i]);
    }
    this.refresh.next();
    if(listToUpload.length>0){
      this.toastr.success('', 'Imported seizures: '+ listToUpload.length, { showCloseButton: true });
    }else{
      this.toastr.success('', 'It has not imported any seizure because they were all imported, or there were none in the file.', { showCloseButton: true });
    }

  }

  obtenerTipoConvImportar(formatotraducion){
    var resultado=formatotraducion;
    if(formatotraducion=="Unknown"){
              resultado="Unknown";
      }else if(formatotraducion=="Simple Partial"){
             resultado="Simple Focal";
      }else if(formatotraducion=="Complex Partial"){
             resultado="Complex Focal";
      }else if(formatotraducion=="Secondarily Generalized"){
             resultado="Secondarily Generalized";
      }else if(formatotraducion=="Tonic"){
             resultado="Tonic";
      }else if(formatotraducion=="Clonic"){
             resultado="Clonic";
      }else if(formatotraducion=="Tonic Clonic"){
             resultado="Tonic–clonic";
      }else if(formatotraducion=="Myoclonic"){
             resultado="Myoclonic";
      }else if(formatotraducion=="Myoclonic Cluster"){
             resultado="Myoclonic Cluster";
      }else if(formatotraducion=="Atonic"){
             resultado="Atonic";
      }else if(formatotraducion=="Absence"){
             resultado="Absence";
      }else if(formatotraducion=="Atypical Absence"){
             resultado="Atypical Absence";
      }else if(formatotraducion=="Infantile Spasms (cluster)"){
             resultado="Infantile Spasms";
      }else if(formatotraducion=="Status"){
             resultado="Status";
      }else if(formatotraducion=="Other"){
             resultado="Other";
      }else{
             resultado="Other";
      }
      return resultado;
  }

  obtenerDisparadoresImportar(arraydisparadores){
    var resultado  = [];
        var numeroDisparadores=arraydisparadores.length;
         for (var i = 0; i<numeroDisparadores;i++){
             if(arraydisparadores[i]=='Changes in Medication (including late or missed)'){
                resultado.push("Changes in Medication (including late or missed)");
             }else if(arraydisparadores[i]=='Irregular Diet'){
                resultado.push("Irregular Diet");
             }else if(arraydisparadores[i]=='Bright or flashing lights'){
                resultado.push("Bright or flashing lights");
             }else if(arraydisparadores[i]=='Fever or overheated'){
                resultado.push("Fever or overheated");
             }else if(arraydisparadores[i]=='Overtired or irregular sleep'){
                resultado.push("Overtired or irregular sleep");
             }else if(arraydisparadores[i]=='Alcohol or drug use'){
                resultado.push("Alcohol or drug use");
             }else if(arraydisparadores[i]=='Emotional Stress'){
                resultado.push("Emotional Stress");
             }else if(arraydisparadores[i]=='Hormonal fluctuations'){
                resultado.push("Hormonal fluctuations");
             }
         }
    return resultado;
  }

  parsearacentos(textoparsear){
    var foo=textoparsear;

    if(foo.indexOf('\r')!=-1){
     foo=foo.replace("\r", ' ');
    }
    if(foo.indexOf('\n')!=-1){
     foo=foo.replace("\n", ' ');
    }

    //á
    if(foo.indexOf('\u00e1')!=-1){
     foo=foo.replace("\u00e1", 'á');
    }
    //é
    if(foo.indexOf('\u00e9')!=-1){
     foo=foo.replace("\u00e9", 'é');
    }
    //í
    if(foo.indexOf('\u00ed')!=-1){
     foo=foo.replace("\u00ed", 'í');
    }
    //ó
    if(foo.indexOf('\u00f3')!=-1){
     foo=foo.replace("\u00f3", 'ó');
    }
    //ú
    if(foo.indexOf('\u00fa')!=-1){
     foo=foo.replace("\u00fa", 'ú');
    }
    //Á
    if(foo.indexOf('\u00c1')!=-1){
     foo=foo.replace("\u00c1", 'Á');
    }
    //É
    if(foo.indexOf('\u00c9')!=-1){
     foo=foo.replace("\u00c9", 'É');
    }
    //Ó
    if(foo.indexOf('\u00d3')!=-1){
     foo=foo.replace("\u00d3", 'Ó');
    }
    //Ú
    if(foo.indexOf('\u00da')!=-1){
     foo=foo.replace("\u00da", 'Ú');
    }
    //ñ
    if(foo.indexOf('\u00f1')!=-1){
     foo=foo.replace("\u00f1", 'ñ');
    }
    //Ñ
    if(foo.indexOf('\u00d1')!=-1){
     foo=foo.replace("\u00d1", 'Ñ');
    }
    return foo;
}

  obtenerDescripcionesImportar(arraydisparadores){
    var resultado  = [];
        var numeroDisparadores=arraydisparadores.length;
         for (var i = 0; i<numeroDisparadores;i++){
             if(arraydisparadores[i]=='Had an aura'){
                resultado.push("Had an aura");
             }else if(arraydisparadores[i]=='Change in awareness'){
                resultado.push("Change in awareness");
             }else if(arraydisparadores[i]=='Loss of ability to communicate'){
                resultado.push("Loss of ability to communicate");
             }else if(arraydisparadores[i]=='Loss of urine or bowel control'){
                resultado.push("Loss of urine or bowel control");
             }else if(arraydisparadores[i]=='Automatic repeated movements'){
                resultado.push("Automatic repeated movements");
             }
         }
    return resultado;
  }

  obtenerParteCuerpo(formatotraducion){
      var resultado=formatotraducion;
      if(formatotraducion=="right arm"){
             resultado="Right arm";
      }else if(formatotraducion=="right leg"){
             resultado="Right leg";
      }else if(formatotraducion=="right side"){
             resultado="Right side";
      }else if(formatotraducion=="left arm"){
             resultado="Left arm";
      }else if(formatotraducion=="left leg"){
             resultado="Left leg";
      }else if(formatotraducion=="left side"){
             resultado="Left side";
      }else if(formatotraducion=="whole body"){
             resultado="Whole body";
      }

      return resultado;
  }

  obtenerPostCrisisImportar(arraydescripciones){
    var resultado  = [];

        var numeroDisparadores=arraydescripciones.length;
         for (var i = 0; i<numeroDisparadores;i++){
             if(arraydescripciones[i]=='Unable to communicate'){
                resultado.push("Unable to communicate");
             }else if(arraydescripciones[i]=='Muscle weakness'){
                resultado.push("Muscle weakness");
             }else if(arraydescripciones[i]=='Remembers event'){
                resultado.push("Remembers event");
             }else if(arraydescripciones[i]=='Sleepy'){
                resultado.push("Sleepy");
             }
         }
    return resultado;
  }

  saveMassiveSeizures(listToUpload){
    this.subscription.add( this.http.post(environment.api+'/api/massiveseizures/'+this.authService.getCurrentPatient().sub, listToUpload)
    .subscribe( (res : any) => {
      //this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });
     }, (err) => {
       console.log(err);
       if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
         this.authGuard.testtoken();
       }else{
         //this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
       }
     }));
  }

  eliminarSeizure(event){
    this.subscription.add( this.http.delete(environment.api+'/api/seizures/'+event._id)
    .subscribe( (res : any) => {
      //this.toastr.success('', this.msgDataSavedOk, { showCloseButton: true });
     }, (err) => {
       console.log(err);
       if(err.error.message=='Token expired' || err.error.message=='Invalid Token'){
         this.authGuard.testtoken();
       }else{
         //this.toastr.error('', this.msgDataSavedFail, { showCloseButton: true });
       }
     }));
  }

  clearData(data){
    var emptydata = {
      _id: data._id,
      GUID: '',
      type: null,
      duracion: {hours: 0, minutes: 0, seconds:0},
      disparadores:[],
      disparadorEnfermo:"",
      disparadorOtro:"",
      disparadorNotas:"",
      descripcion:[],
      descripcionRigidez:"",
      descripcionContraccion:"",
      descripcionOtro:"",
      descipcionNotas:"",
      postCrisis:[],
      postCrisisOtro:"",
      postCrisisNotas:"",
      estadoAnimo:"",
      estadoConsciencia:"",
      title: 'New event',
      start: startOfDay(new Date()),
      end: endOfDay(new Date()),
      color: colors.red,
      actions: this.actions,
    }
    this.modalData.event=emptydata;
    this.refresh.next();
  }

  openStats(){
    this.modal.open(this.modalGraphContent, { size: 'lg' });
  }
}
//Calendar event handler ends

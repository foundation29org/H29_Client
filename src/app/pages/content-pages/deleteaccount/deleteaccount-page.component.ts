import { Component, OnInit } from '@angular/core';
import { TranslateService } from '@ngx-translate/core';
import { EventsService} from 'app/shared/services/events.service';

@Component({
    selector: 'app-deleteaccount-page',
    templateUrl: './deleteaccount-page.component.html',
    styleUrls: ['./deleteaccount-page.component.scss']
})

export class DeleteAccountPageComponent implements OnInit{
  lang: string = 'en';
  urlimg: string = 'assets/img/delete/en.png';
  constructor(private eventsService: EventsService, public translate: TranslateService) {
    this.lang = this.translate.store.currentLang;
    this.urlimg = 'assets/img/delete/' + this.lang + '.png';
   }

  ngOnInit() {
    this.eventsService.on('changelang', function (lang) {
      this.lang = lang;
      this.urlimg = 'assets/img/delete/' + this.lang + '.png';
    }.bind(this));
  }
}

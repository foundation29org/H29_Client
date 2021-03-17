import { Component } from '@angular/core';
import { Router , ActivatedRoute} from "@angular/router";
import {Location} from '@angular/common';

@Component({
    selector: 'app-loading-page',
    templateUrl: './loading-page.component.html',
    styleUrls: ['./loading-page.component.scss']
})

export class LoadingPageComponent{
  url: string = '';
  constructor(private router: Router, private route: ActivatedRoute, private _location: Location) {
    if(this.urlParam('url')!=null){
      this.url = decodeURIComponent(this.urlParam('url'))
      this.router.navigate([this.url]);
    }

   }

   urlParam(name){
     var results = new RegExp('[\?&|#]' + name + '=([^&#]*)').exec(window.location.href);
     if (results==null){
        return null;
     }
     else{
        return decodeURI(results[1]) || '';
     }
   }

}

import { CanActivate, ActivatedRouteSnapshot, Router, ActivatedRoute } from '@angular/router';
import { Injectable } from '@angular/core';
import { AuthService } from './auth.service';
import { ToastsManager } from 'ng2-toastr/ng2-toastr';
import { TranslateService } from '@ngx-translate/core';

@Injectable()
export class RoleGuard implements CanActivate {

  constructor(public authService: AuthService, public router: Router, private route: ActivatedRoute,  public toastr: ToastsManager, public translate: TranslateService) {}

  canActivate(route: ActivatedRouteSnapshot):boolean {
    const expectedRole = route.data.expectedRole;
    if (!this.authService.isAuthenticated() || expectedRole.indexOf(this.authService.getRole()) == -1) {
      this.toastr.error('', this.translate.instant("generics.notpermission"), { showCloseButton: true });
      if(this.authService.getRole()=='Admin'){
        //poner la url de home del admin
        this.authService.setRedirectUrl('/admin/dashboard-admin');
      }else if(this.authService.getRole() == 'SuperAdmin'){
        // is role superadmin
        this.authService.setRedirectUrl('/superadmin/dashboard-superadmin')
      }else{
        this.authService.setRedirectUrl('/user/dashboard/dashboard1');
      }

      this.router.navigate([this.authService.getLoginUrl()]);
      //  this.router.navigate(["/login"]);
        this.authService.logout();
        return false;
    }

    return true;
  }
}

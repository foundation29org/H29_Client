import { Routes, RouterModule } from '@angular/router';
import { RoleGuard } from 'app/shared/auth/role-guard.service';
//import { AuthGuard } from 'app/shared/auth/auth-guard.service';

//Route for content layout with sidebar, navbar and footer.

export const Full_ROUTES: Routes = [
  {
    path: 'admin',
    loadChildren: './admin/admin.module#AdminModule',
    canActivate: [RoleGuard],
    data: { expectedRole: ['Admin'] }
  },
  {
    path: 'superadmin',
    loadChildren: './superadmin/superadmin.module#SuperAdminModule',
    canActivate: [RoleGuard],
    data: { expectedRole: ['SuperAdmin'] }
  },
  {
    path: 'user',
    loadChildren: './user/user.module#UserModule',
    canActivate: [RoleGuard],
    data: { expectedRole: ['User'] }
  },
  {
    path: '',
    loadChildren: './pages/full-pages/full-pages.module#FullPagesModule'
  }
];

import { NgModule, Optional, SkipSelf } from '@angular/core';
import { HttpClientModule } from '@angular/common/http';
import { Auth } from './auth/auth';
import { ApiService } from './services/api.service';
import { AuthGuard } from './auth/auth-guard';

@NgModule({
  imports: [
    HttpClientModule
  ],
  providers: [
    Auth,
    ApiService,
    AuthGuard
    // Interceptors should be provided here in a typical Module setup as well.
  ]
})
export class CoreModule {
  constructor(@Optional() @SkipSelf() parentModule: CoreModule) {
    if (parentModule) {
      throw new Error('CoreModule is already loaded. Import it only in the AppModule!');
    }
  }
}

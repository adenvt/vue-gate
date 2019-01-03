import { PluginFunction } from 'vue'

declare module 'vue-gate' {
  type AuthFunction = () => Object;
  type Auth = Object | AuthFunction;

  export interface GateOptions {
    auth: Auth,
    policies: Object[],
    alias?: Object,
  }

  export default class Gate {
    constructor (options: GateOptions);

    policy (type: string, action: string, ...params: any[]): boolean;

    allow (action: string, type: string, ...params: any[]): boolean;
    deny (action: string, type: string, ...params: any[]): boolean;

    can (action: string, type: string, ...params: any[]): boolean;
    cannot (action: string, type: string, ...params: any[]): boolean;

    guard (to: any, ...params: any[]): boolean;

    static install: PluginFunction<never>;
  }
}

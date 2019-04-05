import * as https from 'https';

import { app } from 'electron';
import { LoadConfigJson, serverOptions } from './config-refactor';
import * as Koa from 'koa';
import { processRequest } from './utils-refactor';

const userConfigs: MajsoulPlus.UserConfig = LoadConfigJson();
const mods: MajsoulPlus.Mod[] = [];
const server = new Koa();

server.use(processRequest(mods));

const httpsServer = https.createServer(serverOptions, server.callback());

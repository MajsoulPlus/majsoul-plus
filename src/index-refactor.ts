import { app } from 'electron';
import { LoadConfigJson } from './config-refactor';

const userConfigs: MajsoulPlus.Config = LoadConfigJson();

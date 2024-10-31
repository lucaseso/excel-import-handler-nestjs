import { Request } from "express";
import { Readable } from "stream";

export interface RequestExcel extends Request {
  excelStream: Readable
}
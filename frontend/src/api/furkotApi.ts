import { TripStep } from "@/types/trip";
import axios from "axios";

export class FurkotApi {
  public static async getRoute(): Promise<TripStep[]> {
    return (await axios.get<TripStep[]>("/route.json")).data;
  }
}

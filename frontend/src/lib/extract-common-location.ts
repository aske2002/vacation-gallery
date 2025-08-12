import { PhotoType } from "vacation-gallery-common";
import { Photo } from "./photo-sorting";

export function findCommonDenominatorAndBroader(items: Photo[]): string[] {
  const idSpecificityOrder: (keyof Photo["location"])[] = [
    "city",
    "state",
    "country",
    "landmark",
  ];

  for (let i = 0; i < idSpecificityOrder.length; i++) {
    const key = idSpecificityOrder[i];

    const keyValues = items.map((item) => item.location?.[key]);

    if (
      keyValues.every((val) => typeof val === "string") &&
      keyValues.every((val) => val === keyValues[0])
    ) {
      // We found the smallest common denominator. Now collect broader fields that are also common
      const result: string[] = [];

      for (let j = i; j < idSpecificityOrder.length; j++) {
        const field = idSpecificityOrder[j];
        const values = items.map((item) => item.location?.[field]);

        if (
          values.every((val) => typeof val === "string") &&
          values.every((val) => val === values[0])
        ) {
          result.push(values[0] as string);
        } else {
          break; // Stop collecting if a broader field is not common
        }
      }

      return result.filter((val) => val !== undefined && val !== "");
    }
  }

  return []; // No common denominator found
}

import { PhotoEditableMetadata } from "../photo";
export type UploadPhotoRequest = PhotoEditableMetadata & {
    fileName: string;
};
export type UpdatePhotoRequest = {
    id: string;
    data: PhotoEditableMetadata;
};

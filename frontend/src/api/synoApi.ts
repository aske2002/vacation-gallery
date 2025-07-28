import { CredentialsResponse, TokenResponse } from "@/hooks/useAuth";
import { Album, AlbumItem, ApiResponse, ListApiResponse } from "@/types/api";
import Axios, { AxiosRequestConfig } from "axios";

function createFormData(params: Record<string, any>) {
  const formData = new FormData();
  formData.append("api", params.api);
  formData.append("method", params.method);
  formData.append("version", params.version);
  Object.entries(params).forEach(([key, value]) => {
    if (["api", "method", "version"].includes(key)) return;
    if (value instanceof Blob || value instanceof File) {
      formData.append(key, value);
    } else {
      formData.append(key, JSON.stringify(value));
    }
  });
  return formData;
}

export class Api {
  public static readonly album = "BFfObrJi4";
  private static readonly axiosinstance = Axios.create({
    baseURL: import.meta.env.PROD ? undefined : "https://photo.igloo.dk",
    headers: {
      "X-Requested-With": "XMLHttpRequest",
    },
  });

  public static addInterceptor = ({
    request,
    response,
  }: {
    request?: {
      onFulfilled?: Parameters<
        (typeof Api.axiosinstance)["interceptors"]["request"]["use"]
      >[0];
      onRejected?: Parameters<
        (typeof Api.axiosinstance)["interceptors"]["request"]["use"]
      >[1];
    };
    response?: {
      onFulfilled?: Parameters<
        (typeof Api.axiosinstance)["interceptors"]["response"]["use"]
      >[0];
      onRejected?: Parameters<
        (typeof Api.axiosinstance)["interceptors"]["response"]["use"]
      >[1];
    };
  }) => {
    if (request) {
      this.axiosinstance.interceptors.request.use(
        request.onFulfilled,
        request.onRejected
      );
    }
    if (response) {
      this.axiosinstance.interceptors.response.use(
        response.onFulfilled,
        response.onRejected
      );
    }
  };

  private static async get<T>(
    url: string,
    params?: Record<string, any>,
    options?: AxiosRequestConfig<any>
  ) {
    return await this.axiosinstance.get<T>(url, {
      ...options,
      params: {
        ...options?.params,
        ...params,
      },
    });
  }

  private static async post<T>(
    url: string,
    data?: Record<string, any>,
    options?: AxiosRequestConfig<any>
  ) {
    return await this.axiosinstance.post<T>(url, data, options);
  }

  public static async getToken() {
    return await this.get<ApiResponse<TokenResponse>>(
      "/webapi/auth.cgi",
      {
        api: "SYNO.API.Auth",
        version: "6",
        method: "token",
        _dc: Date.now(),
      },
      {
        withCredentials: true,
        headers: {
          Accept: "*/*",
          "Accept-Encoding": "gzip, deflate, br",
          "Accept-Language": "en-US,en;q=0.9",
          "sec-fetch-site": "same-origin",
          Referer: "https://photo.igloo.dk/?launchApp=SYNO.Foto.AppInstance",
        },
      }
    );
  }

  public static async delete(photos: number[], sessionId: string) {
    return await this.get<ApiResponse<any>>("/webapi/entry.cgi", {
      _sid: sessionId,
      api: "SYNO.Foto.Browse.Item",
      version: "1",
      method: "delete",
      id: JSON.stringify(photos),
    });
  }

  public static async setDescription(
    photo: number,
    description: string,
    sessionId: string
  ) {
    return await this.get<ApiResponse<any>>("/webapi/entry.cgi", {
      _sid: sessionId,
      api: "SYNO.Foto.Browse.Item",
      version: "1",
      method: "set",
      id: JSON.stringify([photo]),
      description: JSON.stringify(description),
    });
  }

  public static async login(username: string, password: string) {
    return await this.get<ApiResponse<CredentialsResponse>>(
      "/webapi/entry.cgi",
      {
        api: "SYNO.API.Auth",
        version: "6",
        method: "login",
        format: "sid",
        enable_syno_token: "no",
        enable_device_token: true,
        account: username,
        passwd: password,
      },
      {}
    );
  }

  public static async getApiInfo() {
    return await this.get<ApiResponse<any>>("/webapi/entry.cgi", {
      api: "SYNO.API.Info",
      version: "1",
      method: "query",
      query: "all",
    });
  }

  public static async getAlbum() {
    const albums = await this.browseAlbum();
    const album = albums.data.list.at(0);
    if (!album) {
      throw new Error("The shared album could not be found");
    }
    return album;
  }

  public static async uploadFile(
    file: File & { lastModifiedDate?: Date },
    albumId: number,
    sessionId: string
  ) {
    return await this.post<ApiResponse<any>>(
      "/webapi/entry.cgi",
      createFormData({
        api: "SYNO.Foto.Upload.Item",
        version: 1,
        method: "upload",
        folder: ["PhotoLibrary"],
        album_id: albumId,
        _sid: sessionId,
        mtime: Math.round(
          (file.lastModifiedDate?.getTime() || file.lastModified) / 1e3
        ),
        name: file.name,
        duplicate: "ignore",
        file: file,
      }),
      {
        params: {
          _sid: sessionId,
        },
      }
    );
  }

  public static async browseAlbum() {
    const formData = new URLSearchParams();
    formData.append("api", "SYNO.Foto.Browse.Album");
    formData.append("version", "1");
    formData.append("method", "get");
    formData.append("passphrase", this.album);
    formData.append(
      "additional",
      JSON.stringify([
        "sharing_info",
        "flex_section",
        "provider_count",
        "thumbnail",
      ])
    );

    const response = await this.post<ListApiResponse<Album>>(
      "/mo/sharing/webapi/entry.cgi/SYNO.Foto.Browse.Album",
      formData,
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-syno-sharing": this.album,
        },
        withCredentials: true,
      }
    );
    return response.data;
  }

  public static async listPhotos(sharingId: string) {
    const response = await this.get<ListApiResponse<AlbumItem>>(
      "/webapi/entry.cgi",

      {
        passphrase: sharingId,
        api: "SYNO.Foto.Browse.Item",
        method: "list",
        version: "1",
        additional: JSON.stringify([
          "description",
          "geocoding_id",
          "address",
          "gps",
          "thumbnail",
          "resolution",
          "orientation",
          "video_convert",
          "video_meta",
          "provider_user_id",
        ]),
        sort_direction: "asc",
        sort_by: "takentime",
        offset: "0",
        limit: "1000",
      },
      {
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
          "x-syno-sharing": this.album,
        },
      }
    );
    return response.data;
  }

  public static getThumnailUrl(item: AlbumItem, size: "sm" | "m" | "xl" = "m") {
    const url = new URL(
      this.axiosinstance.getUri({
        url: "/mo/sharing/webapi/entry.cgi",
      }),
      window.origin
    );
    url.searchParams.set("id", item.id.toString());
    url.searchParams.set(
      "cache_key",
      `"${item.additional.thumbnail.cache_key}"`
    );
    url.searchParams.set("type", `"unit"`);
    url.searchParams.set("size", `"${size}"`);
    url.searchParams.set("passphrase", `"${this.album}"`);
    url.searchParams.set("api", `"SYNO.Foto.Thumbnail"`);
    url.searchParams.set("method", `"get"`);
    url.searchParams.set("version", "2");
    url.searchParams.set("_sharing_id", `"${this.album}"`);
    return url.toString();
  }
}

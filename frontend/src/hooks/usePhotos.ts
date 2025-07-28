import { Api } from "@/api/synoApi";
import { AlbumItem } from "@/types/api";
import { useQuery, useQueryClient } from "@tanstack/react-query";

export default function usePhotos() {
  const queryClient = useQueryClient();

  const { data: photos, isLoading } = useQuery({
    queryKey: ["photos"],
    queryFn: async () => {
      const response = await Api.listPhotos(Api.album);
      return response.data.list || [];
    },
  });

  const setQueryData = (callback: (photos: AlbumItem[]) => AlbumItem[]) => {
    queryClient.setQueryData(["photos"], (oldData: AlbumItem[] | undefined) => {
      if (!oldData) return [];
      return callback(oldData);
    });
  };

  return {
    photos,
    loading: isLoading,
    setQueryData,
  };
}

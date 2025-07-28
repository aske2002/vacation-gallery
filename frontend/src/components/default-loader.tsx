import { MoonLoader } from "react-spinners";

export function DefaultLoader() {
  return <div className="flex justify-center items-center h-full">
    <MoonLoader size={50} />
  </div>
}

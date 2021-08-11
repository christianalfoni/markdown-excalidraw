import { BookOpenIcon } from "@heroicons/react/outline";

export const Loading = () => (
  <div className="w-screen h-screen text-gray-100 flex items-center justify-center flex-col">
    <BookOpenIcon className="w-10 h-10" />
    <span>opening</span>
  </div>
);

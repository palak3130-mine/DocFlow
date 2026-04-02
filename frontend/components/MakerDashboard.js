import Sidebar from "./Sidebar";

export default function MakerDashboard() {

  return (
    <div className="flex">

      <Sidebar />

      <div className="flex-1 p-10">

        <h1 className="text-3xl font-bold">
          Maker Dashboard
        </h1>

      </div>

    </div>
  );
}
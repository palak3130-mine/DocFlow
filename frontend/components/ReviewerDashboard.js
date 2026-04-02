import Sidebar from "./Sidebar";

export default function ReviewerDashboard() {

  return (
    <div className="flex">

      <Sidebar />

      <div className="flex-1 p-10">

        <h1 className="text-3xl font-bold">
          Reviewer Dashboard
        </h1>

      </div>

    </div>
  );
}
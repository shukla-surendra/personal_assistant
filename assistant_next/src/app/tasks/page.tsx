export default function TasksPage() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-8">
          <h1 className="text-3xl font-bold">Tasks</h1>
          <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center">
            <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            New Task
          </button>
        </div>

        {/* Task Filters */}
        <div className="mb-6 flex space-x-4">
          <button className="px-4 py-2 rounded-lg bg-gray-100 hover:bg-gray-200">All</button>
          <button className="px-4 py-2 rounded-lg hover:bg-gray-100">Active</button>
          <button className="px-4 py-2 rounded-lg hover:bg-gray-100">Completed</button>
          <button className="px-4 py-2 rounded-lg hover:bg-gray-100">Today</button>
        </div>

        {/* Task List */}
        <div className="space-y-4">
          {/* Task Item */}
          <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start">
              <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300" />
              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <h3 className="text-lg font-medium">Complete Project Documentation</h3>
                  <span className="text-sm text-gray-500">Due tomorrow</span>
                </div>
                <p className="mt-1 text-gray-600">Update all project documentation with latest changes and improvements</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-blue-100 text-blue-800">High Priority</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Documentation</span>
                </div>
              </div>
            </div>
          </div>

          {/* Task Item */}
          <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start">
              <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300" />
              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <h3 className="text-lg font-medium">Review Pull Requests</h3>
                  <span className="text-sm text-gray-500">Due in 2 days</span>
                </div>
                <p className="mt-1 text-gray-600">Review and merge pending pull requests for the main branch</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-yellow-100 text-yellow-800">Medium Priority</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Code Review</span>
                </div>
              </div>
            </div>
          </div>

          {/* Task Item */}
          <div className="bg-white rounded-lg shadow-sm p-4 hover:shadow-md transition-shadow">
            <div className="flex items-start">
              <input type="checkbox" className="mt-1 h-4 w-4 rounded border-gray-300" />
              <div className="ml-3 flex-1">
                <div className="flex justify-between">
                  <h3 className="text-lg font-medium">Team Meeting</h3>
                  <span className="text-sm text-gray-500">Today</span>
                </div>
                <p className="mt-1 text-gray-600">Weekly team sync to discuss progress and blockers</p>
                <div className="mt-2 flex items-center space-x-2">
                  <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-800">Low Priority</span>
                  <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-800">Meeting</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
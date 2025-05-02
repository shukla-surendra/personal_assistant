export default function Home() {
  return (
    <div className="p-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-4">Welcome to Assistant Next</h1>
          <p className="text-gray-600">Your personal workspace for tasks and notes</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Quick Actions */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Quick Actions</h2>
            <div className="space-y-3">
              <button className="w-full text-left px-4 py-2 rounded hover:bg-gray-50 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                New Task
              </button>
              <button className="w-full text-left px-4 py-2 rounded hover:bg-gray-50 flex items-center">
                <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                </svg>
                New Note
              </button>
            </div>
          </div>

          {/* Recent Items */}
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h2 className="text-xl font-semibold mb-4">Recent Items</h2>
            <div className="space-y-3">
              <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                  <span>Project Planning</span>
                </div>
                <span className="text-sm text-gray-500">2h ago</span>
              </div>
              <div className="flex items-center justify-between p-2 rounded hover:bg-gray-50">
                <div className="flex items-center">
                  <svg className="w-5 h-5 mr-2 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                  </svg>
                  <span>Meeting Notes</span>
                </div>
                <span className="text-sm text-gray-500">1d ago</span>
              </div>
            </div>
          </div>
        </div>

        {/* Workspace Stats */}
        <div className="mt-8 bg-white rounded-lg shadow-sm p-6">
          <h2 className="text-xl font-semibold mb-4">Workspace Stats</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-2xl font-bold">12</div>
              <div className="text-sm text-gray-500">Active Tasks</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-2xl font-bold">24</div>
              <div className="text-sm text-gray-500">Total Notes</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-2xl font-bold">3</div>
              <div className="text-sm text-gray-500">Projects</div>
            </div>
            <div className="p-4 rounded-lg bg-gray-50">
              <div className="text-2xl font-bold">8</div>
              <div className="text-sm text-gray-500">Completed Today</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 
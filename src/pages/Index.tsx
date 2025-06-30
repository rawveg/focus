import PomodoroTimer from "@/components/PomodoroTimer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100 py-12 px-4">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-light text-gray-900 mb-4 tracking-tight">
            Focus
          </h1>
          <p className="text-xl text-gray-600 font-light max-w-2xl mx-auto leading-relaxed">
            Stay productive with the Pomodoro Technique. Work in focused intervals, take regular breaks, and achieve more.
          </p>
        </div>
        
        <PomodoroTimer />
        
        <div className="mt-20 max-w-4xl mx-auto">
          <h2 className="text-3xl font-light text-gray-900 mb-12 text-center tracking-tight">
            How It Works
          </h2>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="text-center group">
              <div className="w-16 h-16 bg-blue-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-200">
                <span className="text-2xl font-light text-white">1</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Focus</h3>
              <p className="text-gray-600 leading-relaxed">
                Work with complete concentration for 25 minutes on a single task
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-green-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-200">
                <span className="text-2xl font-light text-white">2</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Break</h3>
              <p className="text-gray-600 leading-relaxed">
                Take a 5-minute break to rest, stretch, and recharge your mind
              </p>
            </div>
            
            <div className="text-center group">
              <div className="w-16 h-16 bg-purple-500 rounded-2xl flex items-center justify-center mx-auto mb-6 group-hover:scale-105 transition-transform duration-200">
                <span className="text-2xl font-light text-white">3</span>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-3">Repeat</h3>
              <p className="text-gray-600 leading-relaxed">
                After 4 focus sessions, enjoy a longer 15-minute break
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
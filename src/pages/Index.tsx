import PomodoroTimer from "@/components/PomodoroTimer";

const Index = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-8 px-4">
      <div className="container mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold text-gray-800 mb-2">
            Pomodoro Focus Timer
          </h1>
          <p className="text-lg text-gray-600">
            Boost your productivity with the Pomodoro Technique
          </p>
        </div>
        
        <PomodoroTimer />
        
        <div className="mt-12 max-w-2xl mx-auto text-center">
          <h2 className="text-2xl font-semibold text-gray-800 mb-4">
            How it works
          </h2>
          <div className="grid md:grid-cols-3 gap-6 text-sm text-gray-600">
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-red-500 font-semibold mb-2">1. Focus</div>
              <p>Work for 25 minutes with complete focus on your task</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-green-500 font-semibold mb-2">2. Break</div>
              <p>Take a 5-minute break to rest and recharge</p>
            </div>
            <div className="bg-white p-4 rounded-lg shadow-sm">
              <div className="text-blue-500 font-semibold mb-2">3. Repeat</div>
              <p>After 4 sessions, enjoy a longer 15-minute break</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Index;
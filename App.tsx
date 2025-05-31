import './App.css';
import AudioRecorder from './components/AudioRecorder';

function App() {
  return (
    <div className="min-h-screen bg-slate-950 flex items-center justify-center p-4">
      <main className="w-full">
        <AudioRecorder />
      </main>
    </div>
  );
}

export default App;

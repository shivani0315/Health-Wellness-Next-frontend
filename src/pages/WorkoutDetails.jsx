import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';
import { Line } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
} from 'chart.js';
import 'chartjs-adapter-date-fns';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
  TimeScale
);
import API_BASE_URL from "../config";

const exerciseData = {
  Chest: ['Bench Press', 'Push-ups', 'Chest Flyes'],
  Back: ['Pull-ups', 'Rows', 'Deadlifts'],
  Legs: ['Squats', 'Lunges', 'Leg Press'],
  Shoulders: ['Shoulder Press', 'Lateral Raises', 'Front Raises'],
  Arms: ['Bicep Curls', 'Tricep Extensions', 'Hammer Curls'],
  Core: ['Planks', 'Crunches', 'Russian Twists']
};

const WorkoutDetails = () => {
  const { user } = useAuth();
  const [workoutData, setWorkoutData] = useState({
    muscleGroup: '',
    exercise: '',
    sets: '',
    repsPerSet: [],
    weightPerSet: [],
  });
  const [filteredExercises, setFilteredExercises] = useState([]);
  const [pastWorkouts, setPastWorkouts] = useState([]);
  const [analyticsExercise, setAnalyticsExercise] = useState('');
  const [allExercises, setAllExercises] = useState([]);
  const [analyticsData, setAnalyticsData] = useState(null);
  const [selectedDate, setSelectedDate] = useState('');

  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name === 'sets') {
      const newSets = parseInt(value) || 0;
      setWorkoutData(prev => ({
        ...prev,
        [name]: value,
        repsPerSet: Array(newSets).fill(''),
        weightPerSet: Array(newSets).fill('')
      }));
    } else {
      setWorkoutData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleRepsChange = (index, value) => {
    const newRepsPerSet = [...workoutData.repsPerSet];
    newRepsPerSet[index] = value;
    setWorkoutData(prev => ({ ...prev, repsPerSet: newRepsPerSet }));
  };

  const handleWeightChange = (index, value) => {
    const newWeightPerSet = [...workoutData.weightPerSet];
    newWeightPerSet[index] = value;
    setWorkoutData(prev => ({ ...prev, weightPerSet: newWeightPerSet }));
  };

  const handleMuscleGroupChange = (e) => {
    const selectedMuscleGroup = e.target.value;
    setWorkoutData({
      ...workoutData,
      muscleGroup: selectedMuscleGroup,
      exercise: '', // Reset exercise when muscle group changes
    });
    setFilteredExercises(exerciseData[selectedMuscleGroup] || []);
  };

  const handleExerciseChange = (e) => {
    setWorkoutData({
      ...workoutData,
      exercise: e.target.value,
    });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const response = await axios.post(`${API_BASE_URL}/api/workouts`, {
        ...workoutData,
        repsPerSet: workoutData.repsPerSet.map(rep => parseInt(rep || 0)),
        weightPerSet: workoutData.weightPerSet.map(weight => parseFloat(weight || 0))
      }, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwttoken')}` }
      });
      setWorkoutData({ muscleGroup: '', exercise: '', sets: '', repsPerSet: [], weightPerSet: [] });
      fetchPastWorkouts();
    } catch (error) {
      console.error('Error adding workout:', error.response?.data || error.message);
    }
  };

  const fetchPastWorkouts = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/api/workouts`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwttoken')}` }
      });
      setPastWorkouts(response.data);
    } catch (error) {
      console.error('Error fetching past workouts:', error);
    }
  };

  const fetchAnalytics = async () => {
    if (!analyticsExercise) return;
    try {
      const response = await axios.get(`/api/workouts/analytics?exercise=${analyticsExercise}`, {
        headers: { Authorization: `Bearer ${localStorage.getItem('jwttoken')}` }
      });
      console.log(response.data); 
      setAnalyticsData(response.data);
    } catch (error) {
      console.error('Error fetching analytics:', error);
    }
  };

  const prepareChartData = () => {
    if (!analyticsData) return null;

    const dates = analyticsData.map(item => item.date);
    const setData = analyticsData.map(item => item.sets);
    const repData = analyticsData.map(item => {
      const totalReps = item.repsPerSet.reduce((sum, reps) => sum + reps, 0);
      return totalReps / item.sets; // Average reps per set
    });
    const weightData = analyticsData.map(item => {
      const totalWeight = item.weightPerSet.reduce((sum, weight) => sum + weight, 0);
      return totalWeight / item.sets; // Average weight per set
    });

    console.log("Chart Data:", { dates, setData, repData, weightData });
    
    return {
      labels: dates,
      datasets: [
        {
          label: 'Sets',
          data: setData,
          borderColor: 'rgb(75, 192, 192)',
          tension: 0.1
        },
        {
          label: 'Average Reps per Set',
          data: repData,
          borderColor: 'rgb(255, 99, 132)',
          tension: 0.1
        },
        {
          label: 'Average Weight per Set',
          data: weightData,
          borderColor: 'rgb(54, 162, 235)',
          tension: 0.1
        }
      ]
    };
  };

  const getUniqueExercises = (workouts) => {
    const exercises = workouts.map(workout => workout.exercise);
    return [...new Set(exercises)].sort();
  };

  useEffect(() => {
    fetchPastWorkouts();
  }, []);

  useEffect(() => {
    setAllExercises(getUniqueExercises(pastWorkouts));
  }, [pastWorkouts]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: `Workout Progress for ${analyticsExercise}`,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
      },
      x: {
        type: 'time', // Ensure the X-axis is using the time scale
        time: {
          unit: 'day', // You can set this to the appropriate unit (e.g., day, month)
        },
        title: {
          display: true,
          text: 'Date',
        },
      },
    },
  };

  const handleDateChange = (e) => {
    setSelectedDate(e.target.value);
  };

  return (
    <div className="container mx-auto p-4">
      <h1 className="text-2xl font-bold mb-4">Workout Details</h1>

      {/* Workout Input Form */}
      <form onSubmit={handleSubmit} className="mb-8">
        <div className="grid grid-cols-2 gap-4">
          <select
            name="muscleGroup"
            value={workoutData.muscleGroup}
            onChange={handleMuscleGroupChange}
            className="border p-2 rounded"
          >
            <option value="">Select Muscle Group</option>
            {Object.keys(exerciseData).map((group, index) => (
              <option key={index} value={group}>{group}</option>
            ))}
          </select>

          <select
            name="exercise"
            value={workoutData.exercise}
            onChange={handleExerciseChange}
            className="border p-2 rounded"
          >
            <option value="">Select Exercise</option>
            {filteredExercises.map((exercise, index) => (
              <option key={index} value={exercise}>{exercise}</option>
            ))}
          </select>

          <input
            type="number"
            name="sets"
            value={workoutData.sets}
            onChange={handleInputChange}
            placeholder="Sets"
            className="border p-2 rounded"
          />

          {workoutData.sets && (
            <>
              <input
                type="number"
                placeholder="Reps per Set"
                className="border p-2 rounded"
                onChange={(e) => handleRepsChange(0, e.target.value)}
              />
              <input
                type="number"
                placeholder="Weight per Set"
                className="border p-2 rounded"
                onChange={(e) => handleWeightChange(0, e.target.value)}
              />
            </>
          )}
        </div>
        <button type="submit" className="mt-4 bg-blue-500 text-white px-4 py-2 rounded">Submit</button>
      </form>

      {/* Analytics Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Analytics</h2>
        <select
          value={analyticsExercise}
          onChange={(e) => setAnalyticsExercise(e.target.value)}
          className="border p-2 rounded mb-4"
        >
          <option value="">Select Exercise for Analytics</option>
          {allExercises.map((exercise, index) => (
            <option key={index} value={exercise}>{exercise}</option>
          ))}
        </select>
        <button
          onClick={fetchAnalytics}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          Fetch Analytics
        </button>
        <div className="mt-6">
          {analyticsData && analyticsData.length > 0 ? (
            <Line data={prepareChartData()} options={chartOptions} />
          ) : (
            <p>No data available for the selected exercise.</p>   
          )}
        </div>
      </div>

      {/* Past Workouts Section */}
      <div>
        <h2 className="text-xl font-semibold mb-4">Past Workouts</h2>
        {pastWorkouts.length > 0 ? (
          <ul className="space-y-4">
            {pastWorkouts.map((workout, index) => (
              <li key={index} className="border p-4 rounded shadow">
                <h3 className="font-bold">{workout.exercise}</h3>
                <p>Sets: {workout.sets}</p>
                <p>Reps per Set: {workout.repsPerSet.join(', ')}</p>
                <p>Weight per Set: {workout.weightPerSet.join(', ')}</p>
              </li>
            ))}
          </ul>
        ) : (
          <p>No past workouts available</p>
        )}
      </div>
    </div>
  );
};

export default WorkoutDetails;

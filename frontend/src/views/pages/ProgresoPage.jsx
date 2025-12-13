import { useEffect, useState } from 'react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Line, Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

const useDarkMode = () => {
  const [isDark, setIsDark] = useState(document.documentElement.classList.contains('dark'));

  useEffect(() => {
    const observer = new MutationObserver((mutations) => {
      mutations.forEach((mutation) => {
        if (mutation.attributeName === 'class') {
          setIsDark(document.documentElement.classList.contains('dark'));
        }
      });
    });

    observer.observe(document.documentElement, { attributes: true });
    return () => observer.disconnect();
  }, []);

  return isDark;
};

const ProgresoPage = ({ subjects }) => {
  const isDark = useDarkMode();
  const bestSubjects = [...subjects].sort((a, b) => (b.progress || 0) - (a.progress || 0)).slice(0, 3);
  const totalProgress = subjects.length ? subjects.reduce((sum, subj) => sum + (subj.progress || 0), 0) : 0;
  const average = subjects.length ? Math.round(totalProgress / subjects.length) : 0;

  // Chart Colors & Config
  const textColor = isDark ? '#e2e8f0' : '#334155';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const lineChartData = {
    labels: ['Sim 1', 'Sim 2', 'Sim 3', 'Sim 4', 'Sim 5'],
    datasets: [
      {
        label: 'Puntaje',
        data: [55, 62, 75, 68, 82],
        borderColor: '#8b5cf6',
        backgroundColor: 'rgba(139, 92, 246, 0.2)',
        fill: true,
        tension: 0.3,
      },
      {
        label: 'Aprobatorio',
        data: [60, 60, 60, 60, 60],
        borderColor: '#f59e0b',
        borderDash: [5, 5],
        fill: false,
        pointRadius: 0,
      },
    ],
  };

  const lineChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        labels: { color: textColor },
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: { color: textColor },
        grid: { color: gridColor },
      },
      x: {
        ticks: { color: textColor },
        grid: { color: gridColor },
      },
    },
  };

  const barChartData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    datasets: [
      {
        label: 'Minutos',
        data: [45, 60, 25, 90, 30, 75],
        backgroundColor: '#10b981',
        borderRadius: 5,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        ticks: { color: textColor },
        grid: { color: gridColor },
      },
      x: {
        ticks: { color: textColor },
        grid: { color: gridColor },
      },
    },
  };

  return (
    <div className="page active space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mi Progreso General</h1>
        <p className="text-slate-600 dark:text-slate-400">Analiza tu evolución y áreas de mejora.</p>
      </div>

      {/* Chart Grid - 5 columns layout */}
      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 glass-effect-light p-6 rounded-2xl h-80 dark:border-white/5 border border-slate-200">
          <h3 className="font-bold mb-4">Evolución en Simulacros</h3>
          <div className="h-64">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>
        <div className="lg:col-span-2 glass-effect-light p-6 rounded-2xl h-80 dark:border-white/5 border border-slate-200">
          <h3 className="font-bold mb-4">Tiempo de Estudio (Última Semana)</h3>
          <div className="h-64">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="glass-effect-light p-6 rounded-2xl dark:border-white/5 border border-slate-200">
          <h3 className="font-bold mb-4">Materias con Mejor Progreso</h3>
          <ul className="space-y-3">
            {bestSubjects.map((subject) => (
              <li key={subject.id} className="flex items-center justify-between">
                <span>{subject.title}</span>
                <span className="font-bold text-primary">{subject.progress || 0}%</span>
              </li>
            ))}
            {!bestSubjects.length && <p className="text-slate-500">No hay materias registradas.</p>}
          </ul>
        </div>
        <div className="glass-effect-light p-6 rounded-2xl dark:border-white/5 border border-slate-200">
          <h3 className="font-bold mb-4">Recomendaciones de Estudio</h3>
          <ul className="space-y-2 list-disc list-inside text-slate-600 dark:text-slate-300 text-sm">
            <li>Practica más ejercicios de derivadas.</li>
            <li>Revisa los conceptos de espacios vectoriales.</li>
            <li>Intenta resolver exámenes pasados.</li>
          </ul>
        </div>
      </div>

      <div className="glass-effect-light p-6 rounded-2xl space-y-4 dark:border-white/5 border border-slate-200">
        <h3 className="font-bold">Estadísticas de Estudio</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{subjects.length}</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Materias</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{subjects.length * 5}</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Recursos</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{average}%</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Progreso Promedio</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">12h</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Horas estudiadas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgresoPage;

import { useEffect, useState } from 'react';
import { apiService } from '../../lib/api';
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

const ProgresoPage = () => {
  const isDark = useDarkMode();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadData = async () => {
      try {
        const response = await apiService.getDetailedProgress();
        setData(response);
      } catch (error) {
        console.error('Error loading progress:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  const subjects = data?.progreso_cursos || [];
  const stats = data?.estadisticas || {};
  const bestSubjects = [...subjects].sort((a, b) => b.progreso_porcentaje - a.progreso_porcentaje).slice(0, 3);

  // Calculate average from course progresses if overall average not provided, or use stats.promedio_general if available (backend doesn't send it explicit, but we can compute)
  const average = subjects.length
    ? Math.round(subjects.reduce((sum, s) => sum + s.progreso_porcentaje, 0) / subjects.length)
    : 0;

  const textColor = isDark ? '#e2e8f0' : '#334155';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  // Placeholder charts (Backend doesn't provide time-series data yet, keeping visual mocks but labeled as estimates)
  const lineChartData = {
    labels: ['Sim 1', 'Sim 2', 'Sim 3', 'Sim 4', 'Sim 5'],
    datasets: [
      {
        label: 'Puntaje Estimado',
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
    plugins: { legend: { labels: { color: textColor } } },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { color: textColor }, grid: { color: gridColor } },
      x: { ticks: { color: textColor }, grid: { color: gridColor } },
    },
  };

  const barChartData = {
    labels: ['Lun', 'Mar', 'Mié', 'Jue', 'Vie', 'Sáb'],
    datasets: [
      {
        label: 'Minutos',
        data: [45, 60, 25, 90, 30, 75], // Static for now until backend improves
        backgroundColor: '#10b981',
        borderRadius: 5,
      },
    ],
  };

  const barChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { color: textColor }, grid: { color: gridColor } },
      x: { ticks: { color: textColor }, grid: { color: gridColor } },
    },
  };

  if (loading) return <div className="p-8 text-center">Cargando progreso...</div>;

  return (
    <div className="page active space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Mi Progreso General</h1>
        <p className="text-slate-600 dark:text-slate-400">
          Nivel {stats.nivel || 1} • {stats.total_puntos || 0} Puntos Totales
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-5 gap-6">
        <div className="lg:col-span-3 glass-effect-light p-6 rounded-2xl h-80 dark:border-white/5 border border-slate-200">
          <h3 className="font-bold mb-4">Evolución en Simulacros</h3>
          <div className="h-64">
            <Line data={lineChartData} options={lineChartOptions} />
          </div>
        </div>
        <div className="lg:col-span-2 glass-effect-light p-6 rounded-2xl h-80 dark:border-white/5 border border-slate-200">
          <h3 className="font-bold mb-4">Tiempo de Estudio (Semanal: {stats.actividades_semana || 0} actividades)</h3>
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
              <li key={subject.curso_id} className="flex items-center justify-between">
                <div>
                  <div className="font-medium">{subject.curso_titulo}</div>
                  <div className="text-xs text-slate-500">Exámenes: {subject.total_examenes} | Promedio: {subject.promedio_examenes}</div>
                </div>
                <span className="font-bold text-primary">{subject.progreso_porcentaje}%</span>
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
            <div className="text-2xl font-bold text-primary">{stats.total_cursos || 0}</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Materias</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{stats.cursos_completados || 0}</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Completadas</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{average}%</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Progreso Promedio</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{stats.tiempo_total_horas || 0}h</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Horas estudiadas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgresoPage;

import { useEffect, useState } from 'react';
import { apiService } from '../../lib/api';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from 'chart.js';
import { Bar } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
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
  const totalExamAttempts = subjects.reduce((sum, subject) => sum + (Number(subject.total_examenes) || 0), 0);
  const subjectsWithExams = subjects.filter((subject) => (Number(subject.total_examenes) || 0) > 0);

  // Calculate average from course progresses if overall average not provided, or use stats.promedio_general if available (backend doesn't send it explicit, but we can compute)
  const average = subjects.length
    ? Math.round(subjects.reduce((sum, s) => sum + s.progreso_porcentaje, 0) / subjects.length)
    : 0;

  const textColor = isDark ? '#e2e8f0' : '#334155';
  const gridColor = isDark ? 'rgba(255, 255, 255, 0.1)' : 'rgba(0, 0, 0, 0.1)';

  const examAverageChartData = {
    labels: subjectsWithExams.map((subject) => subject.curso_titulo),
    datasets: [
      {
        label: 'Promedio (%)',
        data: subjectsWithExams.map((subject) => Number(subject.promedio_examenes) || 0),
        backgroundColor: '#8b5cf6',
        borderRadius: 6,
      },
    ],
  };

  const examAverageChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { labels: { color: textColor } } },
    scales: {
      y: { beginAtZero: true, max: 100, ticks: { color: textColor }, grid: { color: gridColor } },
      x: { ticks: { color: textColor }, grid: { color: gridColor } },
    },
  };

  const totalStudyMinutes = Math.round(Number(stats.tiempo_total_minutos) || 0);
  const barChartData = {
    labels: ['Total'],
    datasets: [
      {
        label: 'Minutos',
        data: [totalStudyMinutes],
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
          <h3 className="font-bold mb-4">Promedio en Exámenes (por materia)</h3>
          <div className="h-64">
            {totalExamAttempts > 0 ? (
              <Bar data={examAverageChartData} options={examAverageChartOptions} />
            ) : (
              <div className="h-full flex items-center justify-center text-center text-slate-500 dark:text-slate-400 px-6">
                Aún no has realizado exámenes. Cuando completes uno, verás aquí tus resultados.
              </div>
            )}
          </div>
        </div>
        <div className="lg:col-span-2 glass-effect-light p-6 rounded-2xl h-80 dark:border-white/5 border border-slate-200">
          <h3 className="font-bold mb-4">
            Tiempo de Estudio (Total: {stats.tiempo_total_horas || 0}h • Últimos 7 días: {stats.actividades_semana || 0}{' '}
            actividades)
          </h3>
          <div className="h-64">
            <Bar data={barChartData} options={barChartOptions} />
          </div>
        </div>
      </div>

      <div className="glass-effect-light p-6 rounded-2xl space-y-4 dark:border-white/5 border border-slate-200">
        <h3 className="font-bold">Estadísticas de Estudio</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
          <div>
            <div className="text-2xl font-bold text-primary">{stats.total_cursos || 0}</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Materias</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{average}%</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Progreso Promedio</p>
          </div>
          <div>
            <div className="text-2xl font-bold text-primary">{Number(stats.tiempo_total_horas || 0).toFixed(1)}h</div>
            <p className="text-sm text-slate-500 dark:text-slate-400">Horas estudiadas</p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProgresoPage;

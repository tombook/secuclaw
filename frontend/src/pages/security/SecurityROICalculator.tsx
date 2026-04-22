import { useState } from 'react';
import {
  Calculator,
  DollarSign,
  TrendingUp,
  TrendingDown,
  Shield,
  AlertTriangle,
  CheckCircle,
  RefreshCw,
  Download,
  PieChart,
  BarChart3,
  Target,
  Lock,
  Activity,
} from 'lucide-react';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from 'chart.js';
import { Doughnut, Bar, Line } from 'react-chartjs-2';

ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

export default function SecurityROICalculator() {
  const [investment, setInvestment] = useState({
    tools: 150000,
    personnel: 300000,
    training: 25000,
    compliance: 50000,
  });

  const [riskReduction, setRiskReduction] = useState({
    incidentReduction: 35,
    downtimeReduction: 45,
    complianceSavings: 20000,
    efficiencyGain: 20,
  });

  const totalInvestment = Object.values(investment).reduce((sum, val) => sum + val, 0);
  
  // Calculate benefits
  const avgIncidentCost = 250000; // Average cost per security incident
  const incidentsPerYear = 12;
  const incidentSavings = (incidentsPerYear * avgIncidentCost * riskReduction.incidentReduction) / 100;
  
  const avgDowntimeCost = 50000; // Average hourly cost of downtime
  const hoursPerYear = 2000;
  const downtimeSavings = (hoursPerYear * avgDowntimeCost * riskReduction.downtimeReduction) / 100;
  
  const totalBenefit = incidentSavings + downtimeSavings + riskReduction.complianceSavings;
  const netBenefit = totalBenefit - totalInvestment;
  const roi = ((netBenefit / totalInvestment) * 100).toFixed(1);
  const paybackMonths = ((totalInvestment / totalBenefit) * 12).toFixed(1);

  const investmentBreakdown = {
    labels: ['Security Tools', 'Personnel', 'Training', 'Compliance'],
    datasets: [
      {
        data: [investment.tools, investment.personnel, investment.training, investment.compliance],
        backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F97316'],
        borderWidth: 0,
      },
    ],
  };

  const benefitBreakdown = {
    labels: ['Incident Prevention', 'Downtime Reduction', 'Compliance Savings', 'Efficiency Gains'],
    datasets: [
      {
        data: [incidentSavings, downtimeSavings, riskReduction.complianceSavings, totalBenefit * 0.1],
        backgroundColor: ['#3B82F6', '#10B981', '#8B5CF6', '#F97316'],
        borderWidth: 0,
      },
    ],
  };

  const roiTrend = {
    labels: ['Year 1', 'Year 2', 'Year 3', 'Year 4', 'Year 5'],
    datasets: [
      {
        label: 'Cumulative Benefit',
        data: [totalBenefit, totalBenefit * 2.2, totalBenefit * 3.5, totalBenefit * 4.8, totalBenefit * 6.2],
        borderColor: '#10B981',
        backgroundColor: 'rgba(16, 185, 129, 0.1)',
        fill: true,
        tension: 0.4,
      },
      {
        label: 'Cumulative Cost',
        data: [totalInvestment, totalInvestment * 1.1, totalInvestment * 1.2, totalInvestment * 1.3, totalInvestment * 1.4],
        borderColor: '#DC2626',
        backgroundColor: 'rgba(220, 38, 38, 0.1)',
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const riskMetrics = [
    { name: 'Risk Exposure Reduction', value: riskReduction.incidentReduction, unit: '%' },
    { name: 'Operational Efficiency', value: riskReduction.efficiencyGain, unit: '%' },
    { name: 'Downtime Prevention', value: riskReduction.downtimeReduction, unit: '%' },
    { name: 'Compliance Score', value: 85, unit: '%' },
  ];

  return (
    <div className="p-6 space-y-6 animate-fade-in">
      {/* Page Header */}
      <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-[var(--color-text-primary)] flex items-center gap-3">
            <Calculator className="w-8 h-8 text-[var(--color-accent-blue)]" />
            Security ROI Calculator
          </h1>
          <p className="text-[var(--color-text-muted)] mt-1">
            Measure the financial impact of your security investments
          </p>
        </div>
        <div className="flex items-center gap-3">
          <button className="btn btn-secondary">
            <RefreshCw size={16} />
            Reset
          </button>
          <button className="btn btn-primary">
            <Download size={16} />
            Export Report
          </button>
        </div>
      </div>

      {/* ROI Summary Hero */}
      <div className="card p-6 bg-gradient-to-br from-[var(--color-bg-elevated)] to-[var(--color-bg-surface)] border border-[var(--color-low)]/30">
        <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between gap-6">
          <div className="flex items-center gap-6">
            <div className="text-center">
              <p className="text-5xl font-bold text-[var(--color-low)]">{roi}%</p>
              <p className="text-sm text-[var(--color-text-muted)] mt-1">ROI</p>
            </div>
            <div className="h-20 w-px bg-[var(--color-border-primary)]" />
            <div>
              <p className="text-3xl font-bold">
                ${(netBenefit / 1000).toFixed(0)}K
              </p>
              <p className="text-sm text-[var(--color-text-muted)]">Net Benefit (Year 1)</p>
              <div className="flex items-center gap-1 mt-1">
                {netBenefit > 0 ? (
                  <TrendingUp size={16} className="text-[var(--color-low)]" />
                ) : (
                  <TrendingDown size={16} className="text-[var(--color-critical)]" />
                )}
                <span className={netBenefit > 0 ? 'text-[var(--color-low)]' : 'text-[var(--color-critical)]'}>
                  {netBenefit > 0 ? 'Positive returns' : 'Negative returns'}
                </span>
              </div>
            </div>
            <div className="h-20 w-px bg-[var(--color-border-primary)]" />
            <div>
              <p className="text-3xl font-bold">{paybackMonths} mo</p>
              <p className="text-sm text-[var(--color-text-muted)]">Payback Period</p>
            </div>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            {riskMetrics.map((metric) => (
              <div key={metric.name} className="text-center p-3 bg-[var(--color-bg-elevated)]/50 rounded-lg">
                <p className="text-2xl font-bold text-[var(--color-accent-blue)]">
                  {metric.value}{metric.unit}
                </p>
                <p className="text-xs text-[var(--color-text-muted)]">{metric.name}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Investment vs Benefit */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investment Breakdown */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign size={20} />
            Investment Breakdown
          </h2>
          <div className="h-48">
            <Doughnut
              data={investmentBreakdown}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: { legend: { display: false } },
              }}
            />
          </div>
          <div className="mt-4 space-y-3">
            {investmentBreakdown.labels.map((label, i) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: investmentBreakdown.datasets[0].backgroundColor[i] }}
                  />
                  <span className="text-sm">{label}</span>
                </div>
                <span className="font-medium">
                  ${(investmentBreakdown.datasets[0].data[i] / 1000).toFixed(0)}K
                </span>
              </div>
            ))}
            <div className="pt-3 border-t border-[var(--color-border-primary)] flex justify-between font-bold">
              <span>Total Investment</span>
              <span>${(totalInvestment / 1000).toFixed(0)}K</span>
            </div>
          </div>
        </div>

        {/* Benefit Breakdown */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <TrendingUp size={20} className="text-[var(--color-low)]" />
            Benefit Breakdown (Year 1)
          </h2>
          <div className="h-48">
            <Doughnut
              data={benefitBreakdown}
              options={{
                responsive: true,
                maintainAspectRatio: false,
                cutout: '60%',
                plugins: { legend: { display: false } },
              }}
            />
          </div>
          <div className="mt-4 space-y-3">
            {benefitBreakdown.labels.map((label, i) => (
              <div key={label} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span
                    className="w-3 h-3 rounded-full"
                    style={{ backgroundColor: benefitBreakdown.datasets[0].backgroundColor[i] }}
                  />
                  <span className="text-sm">{label}</span>
                </div>
                <span className="font-medium text-[var(--color-low)]">
                  ${(benefitBreakdown.datasets[0].data[i] / 1000).toFixed(0)}K
                </span>
              </div>
            ))}
            <div className="pt-3 border-t border-[var(--color-border-primary)] flex justify-between font-bold">
              <span>Total Benefit</span>
              <span className="text-[var(--color-low)]">${(totalBenefit / 1000).toFixed(0)}K</span>
            </div>
          </div>
        </div>
      </div>

      {/* ROI Trend */}
      <div className="card p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h2 className="text-lg font-semibold">5-Year ROI Projection</h2>
            <p className="text-sm text-[var(--color-text-muted)]">Cumulative costs vs benefits</p>
          </div>
        </div>
        <div className="h-80">
          <Line
            data={roiTrend}
            options={{
              responsive: true,
              maintainAspectRatio: false,
              plugins: {
                legend: {
                  position: 'bottom',
                  labels: { color: '#9CA3AF' },
                },
              },
              scales: {
                y: {
                  grid: { color: 'rgba(107, 114, 128, 0.1)' },
                  ticks: {
                    color: '#9CA3AF',
                    callback: (value) => '$' + (Number(value) / 1000).toFixed(0) + 'K',
                  },
                },
                x: {
                  grid: { display: false },
                  ticks: { color: '#9CA3AF' },
                },
              },
            }}
          />
        </div>
      </div>

      {/* Input Configuration */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Investment Inputs */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <DollarSign size={20} />
            Investment Inputs
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Security Tools & Software', key: 'tools' as const, max: 500000 },
              { label: 'Personnel & Staffing', key: 'personnel' as const, max: 1000000 },
              { label: 'Training & Awareness', key: 'training' as const, max: 100000 },
              { label: 'Compliance & Audit', key: 'compliance' as const, max: 200000 },
            ].map((item) => (
              <div key={item.key}>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">{item.label}</label>
                  <span className="text-sm text-[var(--color-accent-blue)]">
                    ${(investment[item.key] / 1000).toFixed(0)}K
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={item.max}
                  step="5000"
                  value={investment[item.key]}
                  onChange={(e) => setInvestment({ ...investment, [item.key]: Number(e.target.value) })}
                  className="w-full h-2 bg-[var(--color-bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[var(--color-accent-blue)]"
                />
              </div>
            ))}
          </div>
        </div>

        {/* Risk Reduction Inputs */}
        <div className="card p-6">
          <h2 className="text-lg font-semibold mb-4 flex items-center gap-2">
            <Shield size={20} />
            Risk Reduction Parameters
          </h2>
          <div className="space-y-4">
            {[
              { label: 'Incident Reduction', key: 'incidentReduction' as const, max: 80 },
              { label: 'Downtime Reduction', key: 'downtimeReduction' as const, max: 90 },
              { label: 'Compliance Savings', key: 'complianceSavings' as const, max: 100000, isDollar: true },
              { label: 'Efficiency Gains', key: 'efficiencyGain' as const, max: 50 },
            ].map((item) => (
              <div key={item.key}>
                <div className="flex justify-between mb-2">
                  <label className="text-sm font-medium">{item.label}</label>
                  <span className="text-sm text-[var(--color-low)]">
                    {item.isDollar
                      ? '$' + (riskReduction[item.key] / 1000).toFixed(0) + 'K'
                      : riskReduction[item.key] + '%'}
                  </span>
                </div>
                <input
                  type="range"
                  min="0"
                  max={item.max}
                  step={item.isDollar ? 5000 : 1}
                  value={riskReduction[item.key]}
                  onChange={(e) => setRiskReduction({ ...riskReduction, [item.key]: Number(e.target.value) })}
                  className="w-full h-2 bg-[var(--color-bg-elevated)] rounded-lg appearance-none cursor-pointer accent-[var(--color-low)]"
                />
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="card p-6">
        <h2 className="text-lg font-semibold mb-4">Key Performance Metrics</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-4 bg-[var(--color-low-bg)] rounded-lg text-center">
            <Shield size={32} className="mx-auto text-[var(--color-low)] mb-2" />
            <p className="text-2xl font-bold text-[var(--color-low)]">
              {riskReduction.incidentReduction}%
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">Incident Reduction</p>
            <p className="text-xs text-[var(--color-low)] mt-2">
              Save ${(incidentSavings / 1000).toFixed(0)}K/year
            </p>
          </div>
          <div className="p-4 bg-[var(--color-info-bg)] rounded-lg text-center">
            <Activity size={32} className="mx-auto text-[var(--color-accent-blue)] mb-2" />
            <p className="text-2xl font-bold text-[var(--color-accent-blue)]">
              {riskReduction.downtimeReduction}%
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">Downtime Prevention</p>
            <p className="text-xs text-[var(--color-accent-blue)] mt-2">
              Save ${(downtimeSavings / 1000).toFixed(0)}K/year
            </p>
          </div>
          <div className="p-4 bg-[var(--color-accent-secondary)]/20 rounded-lg text-center">
            <Lock size={32} className="mx-auto text-[var(--color-accent-secondary)] mb-2" />
            <p className="text-2xl font-bold text-[var(--color-accent-secondary)]">
              {riskReduction.efficiencyGain}%
            </p>
            <p className="text-sm text-[var(--color-text-muted)]">Operational Efficiency</p>
            <p className="text-xs text-[var(--color-accent-secondary)] mt-2">
              {riskReduction.efficiencyGain * 10}h saved/year
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

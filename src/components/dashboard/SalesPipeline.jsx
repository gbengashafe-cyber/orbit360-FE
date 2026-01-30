import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { createPageUrl } from '@/utils';
import { ArrowRight, Target, TrendingUp } from 'lucide-react';
import { Link } from 'react-router';

const stageColors = {
  prospecting: 'bg-slate-100 text-slate-700',
  qualification: 'bg-blue-100 text-blue-700',
  proposal: 'bg-yellow-100 text-yellow-700',
  negotiation: 'bg-orange-100 text-orange-700',
  closed_won: 'bg-green-100 text-green-700',
  closed_lost: 'bg-red-100 text-red-700',
};

export default function SalesPipeline({ deals }) {
  const pipelineStats = deals.reduce((acc, deal) => {
    const stage = deal.stage || 'prospecting';
    if (!acc[stage]) {
      acc[stage] = { count: 0, value: 0 };
    }
    acc[stage].count++;
    acc[stage].value += deal.value || 0;
    return acc;
  }, {});

  const totalPipelineValue = deals.reduce((sum, deal) => sum + (deal.value || 0), 0);

  return (
    <Card className="bg-white/80 backdrop-blur-sm border-slate-200/60 shadow-xl shadow-slate-200/50">
      <CardHeader className="border-b border-slate-200/60">
        <div className="flex items-center justify-between">
          <CardTitle className="text-xl font-bold text-slate-900 flex items-center gap-2">
            <TrendingUp className="w-5 h-5 text-emerald-600" />
            Sales Pipeline
          </CardTitle>
          <Link to={createPageUrl('Deals')}>
            <Button variant="ghost" size="sm" className="text-emerald-600 hover:text-emerald-700">
              Manage Pipeline <ArrowRight className="w-4 h-4 ml-1" />
            </Button>
          </Link>
        </div>
      </CardHeader>
      <CardContent className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-slate-600">Total Pipeline Value</span>
            <span className="text-2xl font-bold text-slate-900">${totalPipelineValue.toLocaleString()}</span>
          </div>
          <div className="w-full bg-slate-200 rounded-full h-2">
            <div
              className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-2 rounded-full transition-all duration-300"
              style={{ width: `${Math.min(100, (totalPipelineValue / 100000) * 100)}%` }}
            ></div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {Object.entries(pipelineStats).map(([stage, stats]) => (
            <div key={stage} className="p-4 rounded-xl border border-slate-200 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <Badge className={stageColors[stage] || 'bg-slate-100 text-slate-700'}>{stage.replace('_', ' ')}</Badge>
                <span className="text-sm font-medium text-slate-600">{stats.count}</span>
              </div>
              <p className="text-lg font-bold text-slate-900">${stats.value.toLocaleString()}</p>
            </div>
          ))}
        </div>

        {deals.length === 0 && (
          <div className="text-center py-8 text-slate-500">
            <Target className="w-12 h-12 mx-auto mb-3 text-slate-300" />
            <p>No deals in your pipeline yet</p>
            <Link to={createPageUrl('Deals')}>
              <Button className="mt-3 bg-gradient-to-r from-emerald-500 to-emerald-600 hover:from-emerald-600 hover:to-emerald-700 text-white">
                Create Your First Deal
              </Button>
            </Link>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

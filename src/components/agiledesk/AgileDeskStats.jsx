import React from 'react';
import { Card, CardContent } from "@/components/ui/card";
import { Layers3, Timer, Target, Zap } from "lucide-react";

export default function AgileDeskStats({ projects, projectStats }) {
    const activeProjects = projects.filter(p => p.status === 'active');
    
    const totalActiveSprints = activeProjects.reduce((sum, p) => sum + (projectStats[p.id]?.activeSprints || 0), 0);
    
    const totalCompletedSP = Object.values(projectStats).reduce((sum, stats) => sum + stats.completedStoryPoints, 0);

    const averageVelocity = () => {
        const velocities = activeProjects.map(p => projectStats[p.id]?.velocity || 0).filter(v => v > 0);
        if (velocities.length === 0) return 0;
        return Math.round(velocities.reduce((sum, v) => sum + v, 0) / velocities.length);
    }

    return (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <StatCard
                title="Active Projects"
                value={activeProjects.length}
                icon={Layers3}
                color="text-blue-600"
            />
            <StatCard
                title="Active Sprints"
                value={totalActiveSprints}
                icon={Timer}
                color="text-green-600"
            />
            <StatCard
                title="SP Completed (All Time)"
                value={totalCompletedSP}
                icon={Target}
                color="text-purple-600"
            />
            <StatCard
                title="Avg. Team Velocity"
                value={`${averageVelocity()} SP`}
                icon={Zap}
                color="text-orange-600"
            />
        </div>
    );
}

function StatCard({ title, value, icon: Icon, color }) {
    return (
        <Card className="bg-white/90 backdrop-blur-sm border-gray-200 shadow-lg">
            <CardContent className="p-6">
                <div className="flex items-center justify-between">
                    <div>
                        <p className="text-sm font-medium text-gray-600">{title}</p>
                        <p className="text-2xl font-bold text-gray-900">{value}</p>
                    </div>
                    <Icon className={`w-8 h-8 ${color}`} />
                </div>
            </CardContent>
        </Card>
    );
}
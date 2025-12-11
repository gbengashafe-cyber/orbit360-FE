import React, { useState, useEffect } from "react";
import { Deal } from "@/api/entities";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, Target } from "lucide-react";

const STAGES = ["prospecting", "qualification", "proposal", "negotiation", "won", "lost"];

export default function DealsPage() {
  const [deals, setDeals] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadDeals();
  }, []);

  const loadDeals = async () => {
    setLoading(true);
    try {
      const dealsData = await Deal.list();
      setDeals(dealsData);
    } catch (error) {
      console.error("Error loading deals:", error);
    } finally {
      setLoading(false);
    }
  };

  const dealsByStage = STAGES.reduce((acc, stage) => {
    acc[stage] = deals.filter(deal => deal.stage === stage);
    return acc;
  }, {});

  return (
    <div className="p-4 lg:p-8 min-h-screen">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex justify-between items-center">
          <h1 className="text-3xl font-bold text-gray-900">Deals Pipeline</h1>
          <Button>
            <Plus className="w-4 h-4 mr-2" />
            Add Deal
          </Button>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-6 gap-4">
          {STAGES.map(stage => (
            <div key={stage}>
              <h2 className="text-lg font-semibold text-center mb-4 capitalize">{stage.replace("_", " ")}</h2>
              <div className="space-y-4">
                {loading ? <p>Loading...</p> : dealsByStage[stage].map(deal => (
                  <Card key={deal.id}>
                    <CardHeader>
                      <CardTitle className="text-base">{deal.name}</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <p>Value: ${deal.value ? deal.value.toLocaleString() : 'N/A'}</p>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
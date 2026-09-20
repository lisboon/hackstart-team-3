import { AccessChart } from "@/components/manager/access-chart";
import { ManagerDashboard } from "@/components/manager/manager-dashboard";

/**
 * O gráfico ocupa duas colunas porque é ele que responde ao desafio: a página
 * 3 pede acompanhar "frequência de utilização" e "número de pessoas
 * atendidas", e uma curva diz isso melhor que um número solto.
 */
export default function ManagerHomePage() {
  return (
    <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 xl:grid-cols-3">
      <AccessChart />
      <div className="lg:col-span-2 xl:col-span-3">
        <ManagerDashboard />
      </div>
    </div>
  );
}

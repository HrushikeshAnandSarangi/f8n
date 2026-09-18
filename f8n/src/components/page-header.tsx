import Container from "@/components/container";
import { InfoTooltip } from "@/components/ui/info-tooltip";

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <Container className="flex flex-col gap-4 border-b border-border py-6 tablet:flex-row tablet:items-center tablet:justify-between">
      <div className="flex items-center gap-2">
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        {description && <InfoTooltip text={description} />}
      </div>
      {actions && <div className="flex shrink-0 items-center gap-2">{actions}</div>}
    </Container>
  );
}

import { FINANCIAL_ADVISOR_TEMPLATE, HEALTH_INSURANCE_TEMPLATE } from '@aion/ai';
import { PageHeader } from '@/components/page-header';
import { QualificationForm } from '@/components/qualification-form';

export default async function QualifyPage({
  searchParams,
}: {
  searchParams: Promise<{ vertical?: string }>;
}) {
  const { vertical } = await searchParams;
  const isHealth = vertical === 'health_insurance';
  const template = isHealth ? HEALTH_INSURANCE_TEMPLATE : FINANCIAL_ADVISOR_TEMPLATE;

  return (
    <>
      <PageHeader
        title="Lead Qualification"
        description="Two industry-specific templates. The score is deterministic; the summary is AI-assisted."
        actions={
          <div className="flex gap-2">
            <a
              href="/qualify?vertical=financial_advisor"
              className={`rounded-lg px-3 py-1.5 text-sm ${!isHealth ? 'bg-brand-blue text-white' : 'border border-white/10 text-slate-300'}`}
            >
              Financial Advisor
            </a>
            <a
              href="/qualify?vertical=health_insurance"
              className={`rounded-lg px-3 py-1.5 text-sm ${isHealth ? 'bg-brand-blue text-white' : 'border border-white/10 text-slate-300'}`}
            >
              Health Insurance
            </a>
          </div>
        }
      />

      <QualificationForm vertical={template.vertical} title={template.title} questions={template.questions} />
    </>
  );
}

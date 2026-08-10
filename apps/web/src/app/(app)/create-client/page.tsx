import { PageHeader } from '@/components/page-header';
import { OnboardingWizard } from '@/components/onboarding-wizard';

export const dynamic = 'force-dynamic';

export default function CreateClientPage() {
  return (
    <>
      <PageHeader
        title="Create Client"
        description="Onboard the next advisor as configuration, not code: Create Client → Vertical → ICP → Offer → Scorecard → GHL → Compliance → Launch. Ben is Client Zero — everyone after is a config on the same engine."
      />
      <OnboardingWizard />
    </>
  );
}

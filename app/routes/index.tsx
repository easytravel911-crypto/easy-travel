import { createFileRoute } from '@tanstack/react-router';
import { Home } from '@salla.sa/twilight-theme-engine/routes/home';
import type { HomeLoaderData } from '@salla.sa/twilight-theme-engine/routes/home';
import { HomeSkeleton } from '@salla.sa/twilight-theme-engine/skeleton';
import { withHead } from '@salla.sa/twilight-theme-engine/tanstack';
import { EtxHome } from '../components/etx/EtxHome';

/**
 * Home route, owned by the theme: the engine's loader and head are kept, and the
 * Easy Travel page (hero, planner, trips, packages, journey…) wraps the home
 * blocks the merchant arranges in the Salla designer.
 */
export const Route = createFileRoute('/{-$locale}/')({
  loader: ({ params }): Promise<HomeLoaderData> => Home.loader({ locale: params.locale }),
  head: withHead(Home),
  pendingComponent: () => <HomeSkeleton />,
  component: HomeComponent,
});

function HomeComponent() {
  const data: HomeLoaderData = Route.useLoaderData();
  return (
    <EtxHome>
      <Home.Component {...data} />
    </EtxHome>
  );
}

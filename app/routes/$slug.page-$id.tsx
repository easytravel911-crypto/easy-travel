import { createFileRoute } from '@tanstack/react-router';
import { page as pageApi } from '@salla.sa/twilight-theme-engine/api/page';
import { HookSlot } from '@salla.sa/twilight-theme-engine/hooks';
import { PageSingle as EnginePageSingle } from '@salla.sa/twilight-theme-engine/routes/page';
import { withHead } from '@salla.sa/twilight-theme-engine/tanstack';
import { PageSingle, type PageSingleProps } from '../components/page/PageSingle';

export const Route = createFileRoute('/{-$locale}/$slug/page-{$id}')({
  loader: async ({ params }): Promise<PageSingleProps> => {
    const data = await pageApi.findOrThrow(params.id);
    return {
      page: {
        // RouteId.PAGE_SINGLE, which the engine does not export.
        slug: 'page-single',
        id: data.id,
        title: data.name,
        url: data.url,
        content: data.content,
        metadata: data.metadata,
        created_at: data.created_at,
        type: data.type,
      },
    };
  },
  head: withHead(EnginePageSingle),
  component: PageSingleComponent,
});

/**
 * Hook points around the page, so partner apps can inject here as on the other
 * built-in pages this theme replaces (the `information_page.information_page`
 * hook inside `PageSingle` stays for `customised` pages).
 */
function PageSingleComponent() {
  const data = Route.useLoaderData();
  const context = { page: data.page };
  return (
    <>
      <HookSlot name="page:single.start" context={context} />
      <PageSingle {...data} />
      <HookSlot name="page:single.end" context={context} />
    </>
  );
}

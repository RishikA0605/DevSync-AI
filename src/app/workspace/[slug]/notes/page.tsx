import { getNotes } from "@/features/notes/actions/note.actions";
import { NotesList } from "@/features/notes/components/notes-list";
import { redirect } from "next/navigation";

export default async function NotesPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const { notes, success } = await getNotes(slug);

  if (!success) {
    redirect(`/workspace/${slug}/dashboard`);
  }

  return (
    <div className="h-full overflow-y-auto">
      <NotesList notes={notes || []} workspaceSlug={slug} />
    </div>
  );
}

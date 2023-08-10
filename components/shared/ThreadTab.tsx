import { redirect } from "next/navigation";

import { fetchUserPosts } from "@/lib/actions/user.actions";
import ThreadCard from "../cards/ThreadCard";

interface ThreadTabProps {
  currentUserId: string;
  accountId: string;
  accountType: string;
}

const ThreadTab = async ({ currentUserId, accountId, accountType }: ThreadTabProps) => {

  const userPosts = await fetchUserPosts(accountId) as any;

  if (!userPosts) redirect("/");

  return (
    <section className="mt-9 flex flex-col gap-10">
      {userPosts.threads.map((thread: any) => (
        <ThreadCard
          key={thread._id}
          id={thread._id}
          currentUserId={currentUserId}
          parentId={thread.parentId}
          content={thread.text}
          author={accountType === "User" ? {
            name: userPosts.name,
            image: userPosts.image,
            id: userPosts.id
          } : {
            name: thread.author.name,
            image: thread.author.image,
            id: thread.author.id,
          }}
          community={thread.community}
          createdAt={thread.createdAt}
          comments={thread.children}
        />
      ))}
    </section>
  )
}

export default ThreadTab;
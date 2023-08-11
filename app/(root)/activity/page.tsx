import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";

import { fetchUser, getActivity } from "@/lib/actions/user.actions";

const Page = async () => {

  const user = await currentUser();

  if (!user) return null;

  const userInfo = await fetchUser(user.id) as any;

  const allActivities = await getActivity(userInfo._id) as any;

  if (!userInfo?.onboarded) return redirect("/onboarding");

  return (
    <section>
      <h1 className="head-text mb-10">Activity</h1>
      <div className="mt-10 flex flex-col gap-5">
        {allActivities?.length > 0 ? (
          <>
            {allActivities?.map((activity: any) => (
              <Link key={activity._id} href={`/thread/${activity.parentId}`}>
                <article className="activity-card">
                  <Image src={activity.author.image} alt={activity.author.name} width={20} height={20} className="rounded-full object-cover" />
                  <p className="!text-small-regular text-light-1"><span className="mr-1 text-primary-500">{activity.author.name}</span>{" "}replied to your thread</p>
                </article>
              </Link>
            ))}
          </>
        ) : (
          <p className="!text-base-regular text-light-3">No Activity Yet</p>
        )}
      </div>
    </section >
  )
}

export default Page;
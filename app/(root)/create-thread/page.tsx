import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { fetchUser } from "@/lib/actions/user.actions";
import PostThread from "@/components/forms/PostThread";

const Page = async () => {

  const user = await currentUser();

  if (!user) return null;

  const userInfo = await fetchUser(user.id) as any;

  if (!userInfo?.onboarded) return redirect("/onboarding");

  return (
    <div>
      <h1 className="head-text">Create Thread</h1>
      <PostThread userId={userInfo._id} />
    </div>
  )
}

export default Page;
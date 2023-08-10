import { currentUser } from "@clerk/nextjs";
import { redirect } from "next/navigation";

import { fetchUser, fetchUsers } from "@/lib/actions/user.actions";
import UserCard from "@/components/cards/UserCard";

const Page = async () => {

  const user = await currentUser();

  if (!user) return null;

  const userInfo = await fetchUser(user.id) as any;

  if (!userInfo?.onboarded) return redirect("/onboarding");

  const allUsers = await fetchUsers({
    userId: user.id,
    searchString: "",
    pageNumber: 1,
    pageSize: 25
  });

  return (
    <section>
      <h1 className="head-text mb-10">Search</h1>
      <div className="mt-14 flex flex-col gap-9">
        {allUsers?.users.length === 0 ? (
          <p className="no-result">No users</p>
        ) : (
          <>
            {allUsers?.users.map((user) => (
              <UserCard
                key={user.id}
                id={user.id}
                name={user.name}
                username={user.username}
                image={user.image}
                personType="User"
              />
            ))}
          </>
        )}
      </div>
    </section>
  )
}

export default Page;
"use client";

import { signIn, signOut, useSession } from "next-auth/react";

export default function HomePage() {
  const { data: session } = useSession();

  return (
    <div className="p-6">
      {session ? (
        <>
          <h2 className="text-xl">Welcome, {session.user?.name}</h2>
          <button onClick={() => window.location.href = '/dashboard'} className="mt-4 px-4 py-2 mr-4 bg-white text-black rounded">
            Dashboard
          </button>
          <button onClick={() => signOut()} className="mt-4 px-4 py-2 bg-red-500 text-white rounded">
            Sign out
          </button>
        </>
      ) : (
        <button onClick={() => signIn("google")} className="px-4 py-2 bg-blue-500 text-white rounded">
          Sign in with Google
        </button>
      )}
    </div>
  );
}

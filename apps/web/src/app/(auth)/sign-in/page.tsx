import { signIn } from "@/auth";

export default function SignInPage() {
  return (
    <div className="mx-auto flex min-h-screen max-w-md items-center px-4">
      <div className="w-full rounded-3xl bg-white p-6 shadow-sm">
        <div className="mb-6 space-y-2">
          <p className="text-sm font-medium uppercase tracking-[0.2em] text-slate-500">Private Beta</p>
          <h1 className="text-2xl font-semibold text-slate-950">Sign in</h1>
          <p className="text-sm text-slate-600">Use your invited account to manage watchlists and store sessions.</p>
        </div>

        <form
          action={async (formData) => {
            "use server";

            await signIn("credentials", {
              email: String(formData.get("email") ?? ""),
              password: String(formData.get("password") ?? ""),
              redirectTo: "/watchlist",
            });
          }}
          className="space-y-4"
        >
          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Email</span>
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
              name="email"
              type="email"
            />
          </label>

          <label className="block space-y-2">
            <span className="text-sm font-medium text-slate-700">Password</span>
            <input
              className="w-full rounded-2xl border border-slate-200 px-4 py-3 text-sm outline-none"
              name="password"
              type="password"
            />
          </label>

          <button
            className="w-full rounded-2xl bg-slate-950 px-4 py-3 text-sm font-medium text-white"
            type="submit"
          >
            Continue
          </button>
        </form>
      </div>
    </div>
  );
}

type StoreConnectionStatusProps = {
  account: {
    sessionStatus: "active" | "reauth_required";
    lastValidatedAt: string | null;
    reauthRequiredAt: string | null;
  } | null;
};

function formatStatusCopy(account: StoreConnectionStatusProps["account"]) {
  if (!account) {
    return "No session imported yet.";
  }

  if (account.sessionStatus === "active") {
    return account.lastValidatedAt
      ? `Validated ${new Date(account.lastValidatedAt).toLocaleString("en-US")}`
      : "Session looks active.";
  }

  return account.reauthRequiredAt
    ? `Reconnect needed ${new Date(account.reauthRequiredAt).toLocaleString("en-US")}`
    : "Reconnect needed.";
}

export function StoreConnectionStatus({ account }: StoreConnectionStatusProps) {
  const label = account?.sessionStatus ?? "not connected";

  return (
    <div className="space-y-2">
      <span className="rounded-full bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600">
        {label}
      </span>
      <p className="text-xs text-slate-500">{formatStatusCopy(account)}</p>
    </div>
  );
}

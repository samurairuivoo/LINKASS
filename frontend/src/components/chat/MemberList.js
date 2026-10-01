import { Avatar, PresenceDot } from "./Avatar";

export default function MemberList({ members }) {
  const online = members.filter((m) => m.online);
  const offline = members.filter((m) => !m.online);

  return (
    <div className="h-full w-[260px] shrink-0 bg-[#080f0d] border-l border-[#e78662]/10 overflow-y-auto hidden lg:block">
      <div className="p-4">
        <Group title={`Online — ${online.length}`} members={online} />
        {offline.length > 0 && <Group title={`Offline — ${offline.length}`} members={offline} dim />}
      </div>
    </div>
  );
}

function Group({ title, members, dim }) {
  return (
    <div className="mb-5">
      <p className="text-xs font-semibold tracking-wider uppercase text-[#a3b8b0] mb-2 px-1">{title}</p>
      <div className="space-y-0.5">
        {members.map((m) => (
          <div key={m.user_id} data-testid={`member-${m.user_id}`} className={`flex items-center gap-2.5 px-2 py-1.5 rounded-lg hover:bg-[#121e1a] transition-colors ${dim ? "opacity-50" : ""}`}>
            <div className="relative">
              <Avatar user={m} size={32} />
              <span className="absolute -bottom-0.5 -right-0.5"><PresenceDot online={m.online} size={10} ring="#080f0d" /></span>
            </div>
            <div className="min-w-0">
              <p className="text-sm font-medium text-cream truncate">{m.name}</p>
              {m.status && <p className="text-xs text-[#a3b8b0] truncate">{m.status}</p>}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

import { motion } from "framer-motion";
import { Plus, Compass, MessageSquare } from "lucide-react";
import { Avatar } from "./Avatar";

export default function ServerRail({ servers, activeServer, onSelectServer, onSelectDM, view, onCreate }) {
  return (
    <div className="h-full w-[72px] shrink-0 bg-[#080f0d] flex flex-col items-center py-3 gap-2 border-r border-[#e78662]/10">
      <RailButton active={view === "dm"} onClick={onSelectDM} label="Mensagens" testid="rail-dm-button">
        <MessageSquare className="w-5 h-5" />
      </RailButton>
      <div className="w-8 h-px bg-[#e78662]/15 my-1" />

      <div className="flex-1 w-full flex flex-col items-center gap-2 overflow-y-auto no-scrollbar">
        {servers.map((s) => {
          const active = view === "server" && activeServer?.server_id === s.server_id;
          return (
            <button
              key={s.server_id}
              data-testid={`server-icon-${s.server_id}`}
              onClick={() => onSelectServer(s)}
              className="relative group"
              title={s.name}
            >
              {active && <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r-full bg-[#e78662]" />}
              <motion.div
                whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
                className={`w-12 h-12 rounded-2xl flex items-center justify-center font-heading font-bold text-lg transition-all ${
                  active ? "bg-[#e78662] text-[#0c1411] rounded-xl" : "bg-[#121e1a] text-cream group-hover:bg-[#e78662] group-hover:text-[#0c1411] group-hover:rounded-xl"
                }`}
              >
                {s.name.slice(0, 2).toUpperCase()}
              </motion.div>
            </button>
          );
        })}
      </div>

      <RailButton onClick={onCreate} label="Criar servidor" testid="rail-create-server" accent>
        <Plus className="w-5 h-5" />
      </RailButton>
    </div>
  );
}

function RailButton({ children, active, accent, onClick, label, testid }) {
  return (
    <button data-testid={testid} onClick={onClick} title={label} className="group relative">
      {active && <span className="absolute -left-3 top-1/2 -translate-y-1/2 w-1.5 h-7 rounded-r-full bg-[#e78662]" />}
      <div className={`w-12 h-12 rounded-2xl flex items-center justify-center transition-all group-hover:rounded-xl ${
        active ? "bg-[#e78662] text-[#0c1411]" : accent ? "bg-[#121e1a] text-[#22c55e] group-hover:bg-[#22c55e] group-hover:text-[#0c1411]" : "bg-[#121e1a] text-cream group-hover:bg-[#e78662] group-hover:text-[#0c1411]"
      }`}>
        {children}
      </div>
    </button>
  );
}

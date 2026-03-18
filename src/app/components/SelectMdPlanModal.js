import { useEffect, useState } from "react";
import { useAuth } from "../database/authProvider";
import { Modal } from "./Modal";
import { tabStyle } from "../styles";
import PlansSearchComponent from "../md-plans/PlansSearchComponent";
import { searchMdPlans } from "../database/mdPlans";
import MdPlan from "./MdPlan";
import { useBreakpoint } from "@eldritchtools/shared-components";

export default function SelectMdPlanModal({ isOpen, onClose, onSelectMdPlan, allowDrafts = false }) {
    const { user } = useAuth();
    const [filters, setFilters] = useState({});
    const [plans, setPlans] = useState([]);
    const [page, setPage] = useState(1);
    const [loading, setLoading] = useState(true);
    const [searchMode, setSearchMode] = useState("search");
    const { isMobile } = useBreakpoint();
    const size = isMobile ? 175 : 250;

    useEffect(() => {
        const fetchPlans = async () => {
            try {
                setLoading(true);

                if (searchMode === "search") {
                    const params = { query: filters.search, tags: filters.tags, published: true, ignoreBlockDiscovery: true, offset: (page - 1) * 24, limit: 24 };
                    const data = await searchMdPlans(params);

                    setPlans(data || []);
                } else if (searchMode === "user") {
                    if (user) {
                        const params = { userId: user.id, published: true, ignoreBlockDiscovery: true, offset: (page - 1) * 24, limit: 24 };
                        const data = await searchMdPlans(params);
                        setPlans(data || []);
                    }
                } else if (searchMode === "draft") {
                    if (user) {
                        const params = { userId: user.id, published: false, ignoreBlockDiscovery: true, offset: (page - 1) * 24, limit: 24 };
                        const data = await searchMdPlans(params);
                        setPlans(data || []);
                    }
                }
                setLoading(false);
            } catch (err) {
                console.error("Error loading md plans:", err);
            }
        };

        fetchPlans();

    }, [filters, page, setPlans, searchMode, user]);

    return <Modal isOpen={isOpen} onClose={onClose}>
        <div style={{ display: "flex", flexDirection: "column", gap: "1rem", padding: "1rem", maxHeight: "90vh", overflowY: "auto", width: "980px", maxWidth: "80vw" }}>
            <div style={{ display: "flex", flexDirection: "row", gap: "1rem", alignSelf: "center", marginTop: "0.5rem", marginBottom: "0.5rem" }}>
                <div style={{ ...tabStyle, color: searchMode === "search" ? "#ddd" : "#777" }} onClick={() => setSearchMode("search")}>Search MD Plans</div>
                <div style={{ ...tabStyle, color: searchMode === "user" ? "#ddd" : "#777" }} onClick={() => setSearchMode("user")}>My Published MD Plans</div>
                {allowDrafts ?
                    <div style={{ ...tabStyle, color: searchMode === "draft" ? "#ddd" : "#777" }} onClick={() => setSearchMode("draft")}>My Drafts</div> :
                    null
                }
            </div>
            {searchMode === "search" ?
                <PlansSearchComponent options={filters} inPage={true} setFilters={setFilters} /> :
                (!user ?
                    <span>Locally saved md plans are not supported.</span> :
                    null
                )
            }
            <span style={{ textAlign: "center" }}>Adding the same md plan more than once is not supported.</span>
            <div style={{ border: "1px #777 solid" }} />

            {loading ?
                <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>Loading md plans...</p> :
                plans.length === 0 ?
                    <p style={{ color: "#aaa", fontweight: "bold", textAlign: "center" }}>
                        {page === 1 ? "No published md plans yet." : "No more md plans."}
                    </p> :
                    <div style={{ display: "flex", flexDirection: "column", gap: "0.5rem" }}>
                        <div style={{ display: "grid", gridTemplateColumns: `repeat(auto-fill, minmax(${size}px, 1fr))`, gap: "1rem", justifyContent: "center" }}>
                            {plans.map(plan => <div key={plan.id} onClick={() => onSelectMdPlan(plan)}>
                                <MdPlan plan={plan} complete={false} clickable={false} />
                            </div>
                            )}
                        </div>

                        <div style={{ display: "flex", gap: "0.5rem", alignSelf: "end" }}>
                            <button className="page-button" disabled={page === 1} onClick={() => setPage(p => p - 1)}>Prev</button>
                            <button className="page-button" disabled={plans.length < 24} onClick={() => setPage(p => p + 1)}>Next</button>
                        </div>
                    </div>
            }
        </div>
    </Modal>
}

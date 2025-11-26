"use client";

import { useState } from "react";
import { EgoSelector, IdentitySelector, KeywordSelector, SinnerSelector, StatusSelector } from "../components/Selectors";
import MarkdownRenderer from "../components/MarkdownRenderer";

const headerStyle = { fontSize: "1.2rem", fontWeight: "bold" };

export default function MarkdownTokens() {
    const [identity, setIdentity] = useState(null);
    const [ego, setEgo] = useState(null);
    const [status, setStatus] = useState(null);
    const [keyword, setKeyword] = useState(null);
    const [buildId, setBuildId] = useState("");
    const [buildTestString, setBuildTestString] = useState("");
    const [username, setUsername] = useState("");
    const [usernameTestString, setUsernameTestString] = useState("");
    const [sinner, setSinner] = useState(null);

    const handleTestBuild = () => {
        setBuildTestString(`Sample markdown referencing {build:${buildId}}`);
    }

    const handleTestUsername = () => {
        setUsernameTestString(`Sample markdown referencing {user:${username}}`);
    }

    return <div style={{ display: "flex", flexDirection: "column" }}>
        <div>This is a list of things that can be referenced in builds and comments.</div>
        <h2 style={headerStyle}>Identities</h2>
        <div>
            Reference an identity using <code>{"{identity:id}"}</code>, which will show a link to the identity&apos;s page consisting of the sinner and identity names. Hovering over the link will show a tooltip for the identity.
            <br /> <br />
            You can find an identity&apos;s id in the URL of its respective page or search for it below.
            <br /> <br />
            <IdentitySelector selected={identity} setSelected={setIdentity} />

            {identity ?
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <code>{`Sample markdown referencing {identity:${identity}}`}</code>
                    <div style={{fontSize: "1.2rem"}}>→</div>
                    <MarkdownRenderer content={`Sample markdown referencing {identity:${identity}}`} />
                </div> :
                null
            }
        </div>
        <h2 style={headerStyle}>E.G.Os</h2>
        <div>
            Reference an E.G.O using <code>{"{ego:id}"}</code>, which will show a link to the E.G.O&apos;s page consisting of the sinner and E.G.O names. Hovering over the link will show a tooltip for the E.G.O.
            <br /> <br />
            You can find an E.G.O&apos;s id in the URL of its respective page or search for it below.
            <br /> <br />
            <EgoSelector selected={ego} setSelected={setEgo} />

            {ego ?
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <code>{`Sample markdown referencing {ego:${ego}}`}</code>
                    <div style={{fontSize: "1.2rem"}}>→</div>
                    <MarkdownRenderer content={`Sample markdown referencing {ego:${ego}}`} />
                </div> :
                null
            }
        </div>
        <h2 style={headerStyle}>Statuses</h2>
        <div>
            Reference a status using <code>{"{status:id}"}</code>, which will show the icon of the status and its name. Hovering over it will show a tooltip with the status&apos; description.
            <br /> <br />
            You can search for a status&apos; id below. Note that this list may include statuses that are not normally shown in-game and the icons for some statuses that are only used by some enemies or in some fights might be missing.
            <br /> <br />
            <StatusSelector selected={status} setSelected={setStatus} />

            {status ?
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <code>{`Sample markdown referencing {status:${status}}`}</code>
                    <div style={{fontSize: "1.2rem"}}>→</div>
                    <MarkdownRenderer content={`Sample markdown referencing {status:${status}}`} />
                </div> :
                null
            }
        </div>
        <h2 style={headerStyle}>Keywords</h2>
        <div>
            Reference a keyword using <code>{"{keyword:name}"}</code>, which will show the icon of the keyword.
            <br /> <br />
            Keywords can be referenced by their respective names. Keyword names are case-insensitive.
            <br /> <br />
            <KeywordSelector selected={keyword} setSelected={setKeyword} />

            {keyword ?
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <code>{`Sample markdown referencing {keyword:${keyword}}. Lowercase {keyword:${keyword.toLowerCase()}} Uppercase {keyword:${keyword.toUpperCase()}}`}</code>
                    <div style={{fontSize: "1.2rem"}}>→</div>
                    <MarkdownRenderer content={`Sample markdown referencing {keyword:${keyword}}. Lowercase {keyword:${keyword.toLowerCase()}} Uppercase {keyword:${keyword.toUpperCase()}}`} />
                </div> :
                null
            }
        </div>
        <h2 style={headerStyle}>Build</h2>
        <div>
            Reference a build using <code>{"{build:id}"}</code>, which will show a link to the build&apos;s page consisting of its name. Hovering over the link will show a tooltip for the build.
            <br /> <br />
            You can find a build&apos;s id in the URL of its respective page. Only published builds will work. You can input the build&apos;s id below to test it.
            <br /> <br />
            <div style={{display: "flex", gap: "0.5rem"}}>
                <input value={buildId} onChange={e => setBuildId(e.target.value)} style={{width: "20rem"}}/> 
                <button onClick={handleTestBuild}>Test Build</button>
            </div>

            {buildTestString.length > 0 ?
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <code>{buildTestString}</code>
                    <div style={{fontSize: "1.2rem"}}>→</div>
                    <MarkdownRenderer content={buildTestString} />
                </div> :
                null
            }
        </div>
        <h2 style={headerStyle}>User</h2>
        <div>
            Reference a user using <code>{"{user:username}"}</code>, which will show a link to the user&apos;s page consisting of its name.
            <br /> <br />
            Nonexistent users will still appear as a link, but will navigate to a user not found page. You can input a username below to test it.
            <br /> <br />
            <div style={{display: "flex", gap: "0.5rem"}}>
                <input value={username} onChange={e => setUsername(e.target.value)} style={{width: "20rem"}} /> 
                <button onClick={handleTestUsername}>Test Username</button>
            </div>

            {usernameTestString.length > 0 ?
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <code>{usernameTestString}</code>
                    <div style={{fontSize: "1.2rem"}}>→</div>
                    <MarkdownRenderer content={usernameTestString} />
                </div> :
                null
            }
        </div>
        <h2 style={headerStyle}>Sinner</h2>
        <div>
            Reference a sinner using <code>{"{sinner:id}"}</code>, which will show the name of the sinner.
            <br /> <br />
            <SinnerSelector selected={sinner} setSelected={setSinner} />

            {sinner ?
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <code>{`Sample markdown referencing {sinner:${sinner}}`}</code>
                    <div style={{fontSize: "1.2rem"}}>→</div>
                    <MarkdownRenderer content={`Sample markdown referencing {sinner:${sinner}}`} />
                </div> :
                null
            }
        </div>
    </div>
}
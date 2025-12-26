"use client";

import { useState } from "react";
import { EgoSelector, GiftSelector, IdentitySelector, KeywordSelector, SinnerSelector, StatusSelector } from "../components/Selectors";
import MarkdownRenderer from "../components/Markdown/MarkdownRenderer";

const headerStyle = { fontSize: "1.2rem", fontWeight: "bold" };

export default function MarkdownTokens() {
    const [identity, setIdentity] = useState(null);
    const [ego, setEgo] = useState(null);
    const [status, setStatus] = useState(null);
    const [keyword, setKeyword] = useState(null);
    const [gift, setGift] = useState(null);
    const [buildString, setBuildString] = useState("");
    const [buildTestString, setBuildTestString] = useState("");
    const [username, setUsername] = useState("");
    const [usernameTestString, setUsernameTestString] = useState("");
    const [sinner, setSinner] = useState(null);

    const handleTestBuild = () => {
        const buildId = buildString.split("/").at(-1);
        setBuildTestString(`{build:${buildId}}`);
    }

    const handleTestUsername = () => {
        setUsernameTestString(`{user:${username}}`);
    }

    return <div style={{ display: "flex", flexDirection: "column" }}>
        <div>This is a list of things that can be referenced in builds and comments.</div>
        <h2 style={headerStyle}>Identities</h2>
        <div>
            Reference an identity using <code>{"{identity:id}"}</code> or <code>{"{id:id}"}</code>, which will show a link to the identity&apos;s page consisting of the sinner and identity names. Hovering over the link will show a tooltip for the identity.
            <br /> <br />
            You can find an identity&apos;s id in the URL of its respective page or search for it below.
            <br /> <br />
            <IdentitySelector selected={identity} setSelected={setIdentity} />

            {identity ?
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <div>Token:</div>
                    <code style={{ border: "1px #777 solid", padding: "0.2rem" }}>{`{identity:${identity}}`}</code>
                    <div style={{ fontSize: "1.2rem" }}>→</div>
                    <div>Result:</div>
                    <div style={{ border: "1px #777 solid", padding: "0.2rem" }}>
                        <MarkdownRenderer content={`{identity:${identity}}`} />
                    </div>
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
                    <div>Token:</div>
                    <code style={{ border: "1px #777 solid", padding: "0.2rem" }}>{`{ego:${ego}}`}</code>
                    <div style={{ fontSize: "1.2rem" }}>→</div>
                    <div>Result:</div>
                    <div style={{ border: "1px #777 solid", padding: "0.2rem" }}>
                        <MarkdownRenderer content={`{ego:${ego}}`} />
                    </div>
                </div> :
                null
            }
        </div>
        <h2 style={headerStyle}>Statuses</h2>
        <div>
            Reference a status using <code>{"{status:id}"}</code> or <code>{"{st:id}"}</code>, which will show the icon of the status and its name. Hovering over it will show a tooltip with the status&apos; description.
            <br /> <br />
            You can search for a status&apos; id below. Note that this list may include statuses that are not normally shown in-game and the icons for some statuses that are only used by some enemies or in some fights might be missing.
            <br /> <br />
            <StatusSelector selected={status} setSelected={setStatus} />

            {status ?
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <div>Token:</div>
                    <code style={{ border: "1px #777 solid", padding: "0.2rem" }}>{`{status:${status}}`}</code>
                    <div style={{ fontSize: "1.2rem" }}>→</div>
                    <div>Result:</div>
                    <div style={{ border: "1px #777 solid", padding: "0.2rem" }}>
                        <MarkdownRenderer content={`{status:${status}}`} />
                    </div>
                </div> :
                null
            }
        </div>
        <h2 style={headerStyle}>Keywords</h2>
        <div>
            Reference a keyword using <code>{"{keyword:name}"}</code> or <code>{"{kw:name}"}</code>, which will show the icon of the keyword.
            <br /> <br />
            Keywords can be referenced by their respective names. Keyword names are case-insensitive.
            <br /> <br />
            <KeywordSelector selected={keyword} setSelected={setKeyword} />

            {keyword ?
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <div>Sample Tokens:</div>
                    <code style={{ border: "1px #777 solid", padding: "0.2rem" }}>{`{keyword:${keyword}} {keyword:${keyword.toLowerCase()}} {keyword:${keyword.toUpperCase()}}`}</code>
                    <div style={{ fontSize: "1.2rem" }}>→</div>
                    <div>Result:</div>
                    <div style={{ border: "1px #777 solid", padding: "0.2rem" }}>
                        <MarkdownRenderer content={`{keyword:${keyword}} {keyword:${keyword.toLowerCase()}} {keyword:${keyword.toUpperCase()}}`} />
                    </div>
                </div> :
                null
            }
        </div>
        <h2 style={headerStyle}>E.G.O. Gifts</h2>
        <div>
            Reference E.G.O Gifts using <code>{"{giftname:id}"}</code> or <code>{"{gifticons:id1:id2:...}"}</code>. <code>{"{gn:id}"}</code> and <code>{"{gi:id1:id2:...}"}</code> respectively can also be used. The former will show the name of the gift while the latter will show the icons of all the gifts included in the list.
            <br /> <br />
            Both the name and icons versions will show the description of the gift on hover and can be clicked to show a modal with more details (the modal may break on mobile or other thin screens). This uses the same logic as my MD site (link in the header).
            <br /> <br />
            Unfortunately due to the way HTML works, <code>gifticons</code> can only work on a separate line even if you try putting it on the same line as other tokens or text.
            <br /> <br />
            Enhance rank can optionally be included by adding a <code>{"|rank"}</code> to the id for example <code>{"{giftname:9003|2}"}</code> will give Ashes to Ashes++. Invalid enhancement ranks will make the entire gift invalid as seen below if you try it with a gift with no enhancement ranks.
            <br /> <br />
            You can find a gift&apos;s id below. Currently this only includes gifts available in the regular MD. Gifts from story dungeons are not included.
            <br /> <br />
            <GiftSelector selected={gift} setSelected={setGift} />

            {gift ?
                <div style={{ display: "flex", flexDirection: "column" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div>Sample Tokens:</div>
                        <code style={{ border: "1px #777 solid", padding: "0.2rem" }}>{`{giftname:${gift}} {giftname:${gift}|2}`}</code>
                        <div style={{ fontSize: "1.2rem" }}>→</div>
                        <div>Result:</div>
                        <div style={{ border: "1px #777 solid", padding: "0.2rem" }}>
                            <MarkdownRenderer content={`{giftname:${gift}} {giftname:${gift}|2}`} />
                        </div>
                    </div>
                    <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                        <div>Sample Token:</div>
                        <code style={{ border: "1px #777 solid", padding: "0.2rem" }}>{`{gifticons:${gift}}`}</code>
                        <div style={{ fontSize: "1.2rem" }}>→</div>
                        <div>Result:</div>
                    </div>
                    <MarkdownRenderer content={`{gifticons:${gift}}`} />
                </div> :
                null
            }
        </div>
        <h2 style={headerStyle}>Build</h2>
        <div>
            Reference a build using <code>{"{build:id}"}</code>, which will show a link to the build&apos;s page consisting of its name. Hovering over the link will show a tooltip for the build.
            <br /> <br />
            You can find a build&apos;s id in the URL of its respective page or by copying the link given in the share feature. Only published builds will work.
            <br /> <br />
            You can input the build&apos;s id below to test it. You can paste the entire url and it will automatically strip out the unnecessary parts.
            <br /> <br />
            <div style={{ display: "flex", gap: "0.5rem" }}>
                <input value={buildString} onChange={e => setBuildString(e.target.value)} style={{ width: "20rem" }} />
                <button onClick={handleTestBuild}>Test Build</button>
            </div>

            {buildTestString.length > 0 ?
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <div>Token:</div>
                    <code style={{ border: "1px #777 solid", padding: "0.2rem" }}>{buildTestString}</code>
                    <div style={{ fontSize: "1.2rem" }}>→</div>
                    <div>Result:</div>
                    <div style={{ border: "1px #777 solid", padding: "0.2rem" }}>
                        <MarkdownRenderer content={buildTestString} />
                    </div>
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
            <div style={{ display: "flex", gap: "0.5rem" }}>
                <input value={username} onChange={e => setUsername(e.target.value)} style={{ width: "20rem" }} />
                <button onClick={handleTestUsername}>Test Username</button>
            </div>

            {usernameTestString.length > 0 ?
                <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginTop: "0.5rem" }}>
                    <div>Token:</div>
                    <code style={{ border: "1px #777 solid", padding: "0.2rem" }}>{usernameTestString}</code>
                    <div style={{ fontSize: "1.2rem" }}>→</div>
                    <div>Result:</div>
                    <div style={{ border: "1px #777 solid", padding: "0.2rem" }}>
                        <MarkdownRenderer content={usernameTestString} />
                    </div>
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
                    <div>Token:</div>
                    <code style={{ border: "1px #777 solid", padding: "0.2rem" }}>{`{sinner:${sinner}}`}</code>
                    <div style={{ fontSize: "1.2rem" }}>→</div>
                    <div>Result:</div>
                    <div style={{ border: "1px #777 solid", padding: "0.2rem" }}>
                        <MarkdownRenderer content={`{sinner:${sinner}}`} />
                    </div>
                </div> :
                null
            }
        </div>
    </div>
}
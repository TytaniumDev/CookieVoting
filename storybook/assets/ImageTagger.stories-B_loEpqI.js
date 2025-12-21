import{j as t}from"./jsx-runtime-u17CrQMm.js";import{r as g}from"./iframe-Bm-1nfva.js";import{v as T,C as F,s as W,g as H}from"./validation-jVV_OF34.js";import{h as K,f as $}from"./firebase-DgwybkJe.js";import{I as z}from"./ImageWithDetections-C796q3Q4.js";import{w as Y}from"./firebase-decorator-zlxdyja1.js";import"./preload-helper-PPVm8Dsz.js";async function V(a){console.log("[CookieDetection] Starting cookie detection"),console.log("[CookieDetection] Image URL:",a);try{console.log("[CookieDetection] Getting function reference: detectCookiesWithGemini");const s=K($,"detectCookiesWithGemini");console.log("[CookieDetection] Calling Firebase function with imageUrl:",a);const l=await s({imageUrl:a});console.log("[CookieDetection] Function call completed"),console.log("[CookieDetection] Result data:",l.data),console.log("[CookieDetection] Cookies count:",l.data?.count),console.log("[CookieDetection] Cookies array:",l.data?.cookies);const v=l.data?.cookies||[];return console.log("[CookieDetection] Returning",v.length,"cookies"),v}catch(s){if(console.error("[CookieDetection] Error detecting cookies with Gemini:",s),s instanceof Error){console.error("[CookieDetection] Error name:",s.name),console.error("[CookieDetection] Error message:",s.message),console.error("[CookieDetection] Error stack:",s.stack);const l=s;if(l.code&&console.error("[CookieDetection] Firebase error code:",l.code),l.details&&console.error("[CookieDetection] Firebase error details:",l.details),l.message&&console.error("[CookieDetection] Full error message:",l.message),s.message.includes("unauthenticated"))throw new Error("You must be signed in to use cookie detection.");if(s.message.includes("failed-precondition"))throw new Error("Gemini API is not configured. Please contact the administrator.");if(s.message.includes("not found")||s.message.includes("404"))throw new Error("Cookie detection service is not available. Please deploy Firebase Functions first.")}else console.error("[CookieDetection] Unknown error type:",typeof s),console.error("[CookieDetection] Error value:",s);throw new Error("Failed to detect cookies. Please try again or use manual tagging.")}}const X="_container_m830v_1",J="_toolbar_m830v_10",Q="_workspace_m830v_26",Z="_imageArea_m830v_32",ee="_image_m830v_32",oe="_marker_m830v_76",te="_markerNumber_m830v_92",ne="_sidebar_m830v_98",ie="_list_m830v_106",ae="_item_m830v_112",se="_itemHeader_m830v_118",re="_itemNumber_m830v_124",ce="_deleteBtn_m830v_129",le="_input_m830v_137",me="_actions_m830v_147",de="_buttonPrimary_m830v_152",ge="_buttonSecondary_m830v_152",ue="_buttonAutoDetect_m830v_152",ke="_errorMessage_m830v_185",i={container:X,toolbar:J,workspace:Q,imageArea:Z,image:ee,marker:oe,markerNumber:te,sidebar:ne,list:ie,item:ae,itemHeader:se,itemNumber:re,deleteBtn:ce,input:le,actions:me,buttonPrimary:de,buttonSecondary:ge,buttonAutoDetect:ue,errorMessage:ke};function L({imageUrl:a,initialCookies:s,onSave:l,onCancel:v}){const[c,p]=g.useState(s),[_,I]=g.useState(!1),[x,D]=g.useState(!1),[M,h]=g.useState(null),[S,j]=g.useState([]),[P,R]=g.useState(!0),E=g.useRef(null);g.useEffect(()=>{(async()=>{R(!0);try{const n=await H(a);n&&n.length>0?(j(n),console.log(`Loaded ${n.length} pre-detected cookies for image`)):console.log("No pre-detected cookies found, user can run detection manually")}catch(n){console.error("Error loading detection results:",n)}finally{R(!1)}})()},[a]);const q=e=>{if(!E.current)return;const n=E.current.querySelector("img");if(!n)return;const o=n.getBoundingClientRect(),m=(e.clientX-o.left)/o.width*100,r=(e.clientY-o.top)/o.height*100,d=c.reduce((w,N)=>Math.max(w,N.number),0),k={id:T(),number:d+1,makerName:F.DEFAULT_MAKER_NAME,x:m,y:r};p([...c,k])},U=(e,n)=>{p(c.map(o=>o.id===e?{...o,...n}:o))},G=e=>{p(c.filter(n=>n.id!==e))},B=async()=>{D(!0),h(null);try{const e=await V(a);if(j(e),e.length===0){h("No cookies detected. Try adjusting the image or use manual tagging."),D(!1);return}const n=c.reduce((m,r)=>Math.max(m,r.number),0),o=[];for(let m=0;m<e.length;m++){const r=e[m];c.some(k=>Math.sqrt(Math.pow(k.x-r.x,2)+Math.pow(k.y-r.y,2))<5)||o.push({id:T(),number:n+o.length+1,makerName:F.DEFAULT_MAKER_NAME,x:r.x,y:r.y})}p([...c,...o]),o.length===0?h("All detected cookies were already tagged. Try manual tagging for any missed cookies."):h(null)}catch(e){console.error("Cookie detection failed:",e),h(e instanceof Error?`Detection failed: ${e.message}`:"Cookie detection failed. Please try manual tagging.")}finally{D(!1)}},O=async()=>{I(!0),await l(c),I(!1)};return t.jsxs("div",{className:i.container,children:[t.jsxs("div",{className:i.toolbar,children:[t.jsxs("div",{children:[t.jsx("h3",{children:"Tagging Mode"}),t.jsx("p",{children:"Click on the image to add a number, or use auto-detect to find cookies automatically."}),P&&t.jsx("p",{style:{fontSize:"0.9rem",color:"rgba(255,255,255,0.7)"},children:"Loading detection results..."})]}),t.jsxs("div",{className:i.actions,children:[t.jsx("button",{onClick:B,disabled:_||x,className:i.buttonAutoDetect,title:"Automatically detect cookies in the image",children:x?"Detecting...":"Auto-detect Cookies"}),t.jsx("button",{onClick:v,disabled:_||x,className:i.buttonSecondary,children:"Cancel"}),t.jsx("button",{onClick:O,disabled:_||x,className:i.buttonPrimary,children:_?"Saving...":"Save Tags"})]})]}),t.jsxs("div",{className:i.workspace,children:[t.jsxs("div",{className:i.imageArea,ref:E,onClick:q,children:[(()=>{const e=S.map(o=>c.some(r=>Math.sqrt(Math.pow(r.x-o.x,2)+Math.pow(r.y-o.y,2))<5)?null:{x:o.x,y:o.y,width:o.width,height:o.height,polygon:o.polygon,confidence:o.confidence}).filter(o=>o!==null),n=new Map;return S.forEach((o,m)=>{const r=e.find(d=>d.x===o.x&&d.y===o.y&&d.confidence===o.confidence);r&&n.set(r,m)}),t.jsx(z,{imageUrl:a,detectedCookies:e,onCookieClick:(o,m,r)=>{r.stopPropagation();const d=n.get(o);if(d!==void 0){const k=c.reduce((N,A)=>Math.max(N,A.number),0),w={id:T(),number:k+1,makerName:F.DEFAULT_MAKER_NAME,x:o.x,y:o.y};p([...c,w]),j(S.filter((N,A)=>A!==d))}},className:i.image})})(),c.map(e=>t.jsx("div",{className:i.marker,style:{left:`${e.x}%`,top:`${e.y}%`},onClick:n=>{n.stopPropagation()},children:t.jsx("div",{className:i.markerNumber,children:e.number})},e.id))]}),t.jsxs("div",{className:i.sidebar,children:[t.jsxs("h4",{children:["Cookies (",c.length,")"]}),M&&t.jsx("div",{className:i.errorMessage,children:M}),t.jsx("div",{className:i.list,children:c.sort((e,n)=>e.number-n.number).map(e=>t.jsxs("div",{className:i.item,children:[t.jsxs("div",{className:i.itemHeader,children:[t.jsxs("span",{className:i.itemNumber,children:["#",e.number]}),t.jsx("button",{onClick:()=>G(e.id),className:i.deleteBtn,children:"×"})]}),t.jsx("label",{children:"Maker Name"}),t.jsx("input",{type:"text",value:e.makerName,onChange:n=>{const o=W(n.target.value);U(e.id,{makerName:o})},className:i.input,maxLength:50}),t.jsx("label",{children:"Number"}),t.jsx("input",{type:"number",value:e.number,onChange:n=>U(e.id,{number:parseInt(n.target.value)||0}),className:i.input})]},e.id))})]})]})]})}L.__docgenInfo={description:`ImageTagger - A comprehensive tool for tagging cookies in images.

This component provides a full-featured interface for tagging cookies in images.
It supports both manual tagging (clicking on the image) and automatic detection
using AI. The component displays detected cookies as overlays and allows users
to click on them to automatically tag them.

Features:
- Manual cookie tagging by clicking on the image
- Automatic cookie detection using Gemini AI
- Visual display of detected cookies (before tagging)
- Sidebar with list of all tagged cookies
- Edit cookie numbers and maker names
- Delete individual cookies
- Automatic filtering of already-tagged cookies from detection results

The component automatically loads pre-detected cookies from Firestore when the
image URL changes, and provides a button to trigger new detection if needed.

@example
\`\`\`tsx
<ImageTagger
  imageUrl="/path/to/image.jpg"
  initialCookies={[]}
  onSave={async (cookies) => {
    await saveCookiesToFirestore(cookies);
  }}
  onCancel={() => navigate('/admin')}
/>
\`\`\`

@param props - Component props
@returns JSX element containing the tagging interface`,methods:[],displayName:"ImageTagger",props:{imageUrl:{required:!0,tsType:{name:"string"},description:"URL of the image to tag"},initialCookies:{required:!0,tsType:{name:"Array",elements:[{name:"CookieCoordinate"}],raw:"CookieCoordinate[]"},description:"Initial array of cookie coordinates (for editing existing tags)"},onSave:{required:!0,tsType:{name:"signature",type:"function",raw:"(cookies: CookieCoordinate[]) => Promise<void>",signature:{arguments:[{type:{name:"Array",elements:[{name:"CookieCoordinate"}],raw:"CookieCoordinate[]"},name:"cookies"}],return:{name:"Promise",elements:[{name:"void"}],raw:"Promise<void>"}}},description:"Callback function called when tags are saved, receives the array of tagged cookies"},onCancel:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Callback function called when tagging is cancelled"}}};const{fn:u}=__STORYBOOK_MODULE_TEST__,xe={title:"Organisms/ImageTagger",component:L,parameters:{layout:"fullscreen",docs:{description:{component:`
A comprehensive image tagging interface for marking cookie positions.

**Features:**
- Click on image to manually add cookie markers
- Auto-detect cookies using AI (Gemini)
- Click on detected cookie shapes to auto-tag them
- Edit cookie numbers and maker names
- Delete individual cookies
- Visual feedback with detection overlays
- Automatic loading of pre-detected cookies from Firestore

**Usage:**
This component is used in the admin interface for tagging cookies in category images.
        `}}},tags:["autodocs"],argTypes:{imageUrl:{control:"text",description:"URL of the image to tag"},initialCookies:{control:"object",description:"Initial cookie coordinates (for editing)"},onSave:{action:"saved",description:"Callback when save button is clicked"},onCancel:{action:"cancelled",description:"Callback when cancel button is clicked"}}},pe=[{id:"1",number:1,makerName:"Alice",x:25,y:30},{id:"2",number:2,makerName:"Bob",x:50,y:40}],f={args:{imageUrl:"/test-cookies.jpg",initialCookies:[],onSave:async a=>{u()(a)},onCancel:u()}},C={args:{imageUrl:"/test-cookies.jpg",initialCookies:pe,onSave:async a=>{u()(a)},onCancel:u()}},y={decorators:[Y],args:{imageUrl:"/test-cookies.jpg",initialCookies:[],onSave:async a=>{u()(a)},onCancel:u()},parameters:{docs:{description:{story:`
This story uses the Firebase Storage emulator to load images and detection results.
Make sure to start the Firebase emulators before viewing this story:
\`npm run emulators:start\`

The component will automatically:
- Load pre-detected cookies from Firestore
- Allow you to use the auto-detect feature (requires Functions emulator)
- Save images to Storage emulator
        `}}}},b={args:{imageUrl:"/test-images/6-cookies/test-cookies.jpg",initialCookies:[],onSave:async a=>{u()(a)},onCancel:u()}};f.parameters={...f.parameters,docs:{...f.parameters?.docs,source:{originalSource:`{
  args: {
    imageUrl: '/test-cookies.jpg',
    initialCookies: [],
    onSave: async cookies => {
      fn()(cookies);
    },
    onCancel: fn()
  }
}`,...f.parameters?.docs?.source},description:{story:"Default image tagger with no initial cookies",...f.parameters?.docs?.description}}};C.parameters={...C.parameters,docs:{...C.parameters?.docs,source:{originalSource:`{
  args: {
    imageUrl: '/test-cookies.jpg',
    initialCookies: sampleInitialCookies,
    onSave: async cookies => {
      fn()(cookies);
    },
    onCancel: fn()
  }
}`,...C.parameters?.docs?.source},description:{story:"Image tagger with existing cookies (editing mode)",...C.parameters?.docs?.description}}};y.parameters={...y.parameters,docs:{...y.parameters?.docs,source:{originalSource:`{
  decorators: [withFirebaseEmulator],
  args: {
    imageUrl: '/test-cookies.jpg',
    initialCookies: [],
    onSave: async cookies => {
      fn()(cookies);
    },
    onCancel: fn()
  },
  parameters: {
    docs: {
      description: {
        story: \`
This story uses the Firebase Storage emulator to load images and detection results.
Make sure to start the Firebase emulators before viewing this story:
\\\`npm run emulators:start\\\`

The component will automatically:
- Load pre-detected cookies from Firestore
- Allow you to use the auto-detect feature (requires Functions emulator)
- Save images to Storage emulator
        \`
      }
    }
  }
}`,...y.parameters?.docs?.source},description:{story:`Image tagger with Firebase emulator integration
This story demonstrates the component working with real Firebase Storage emulator`,...y.parameters?.docs?.description}}};b.parameters={...b.parameters,docs:{...b.parameters?.docs,source:{originalSource:`{
  args: {
    imageUrl: '/test-images/6-cookies/test-cookies.jpg',
    initialCookies: [],
    onSave: async cookies => {
      fn()(cookies);
    },
    onCancel: fn()
  }
}`,...b.parameters?.docs?.source},description:{story:"Image tagger with different image",...b.parameters?.docs?.description}}};const we=["Default","WithExistingCookies","WithFirebaseEmulator","DifferentImage"];export{f as Default,b as DifferentImage,C as WithExistingCookies,y as WithFirebaseEmulator,we as __namedExportsOrder,xe as default};

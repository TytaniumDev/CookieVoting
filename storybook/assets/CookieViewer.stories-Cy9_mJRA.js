import{j as o}from"./jsx-runtime-u17CrQMm.js";import{r as c}from"./iframe-Bm-1nfva.js";import"./preload-helper-PPVm8Dsz.js";const $="_container_cwvkx_1",E="_toolbar_cwvkx_14",O="_controls_cwvkx_24",V="_backButton_cwvkx_40",X="_viewport_cwvkx_48",Y="_imageContainer_cwvkx_57",q="_image_cwvkx_57",L="_marker_cwvkx_68",R="_selected_cwvkx_85",W="_markerNumber_cwvkx_97",Z="_instruction_cwvkx_104",n={container:$,toolbar:E,controls:O,backButton:V,viewport:X,imageContainer:Y,image:q,marker:L,selected:R,markerNumber:W,instruction:Z};function j({imageUrl:b,cookies:s,selectedCookieId:T,onSelectCookie:U,onBack:B}){const[r,f]=c.useState(1),[a,y]=c.useState({x:0,y:0}),[u,p]=c.useState(!1),[h,w]=c.useState({x:0,y:0}),v=e=>{f(t=>Math.min(Math.max(1,t+e),4))},[_,g]=c.useState(null),S=(e,t)=>{const C=e.clientX-t.clientX,x=e.clientY-t.clientY;return Math.sqrt(C*C+x*x)},D=e=>{if(e.touches.length===2){e.preventDefault();const t=S(e.touches[0],e.touches[1]);if(_!==null){const C=(t-_)/100;f(x=>Math.min(Math.max(1,x+C),4))}g(t)}else g(null),u&&e.touches.length===1&&(e.preventDefault(),y({x:e.touches[0].clientX-h.x,y:e.touches[0].clientY-h.y}))},I=()=>{g(null),p(!1)},P=e=>{r>1&&(p(!0),w({x:e.clientX-a.x,y:e.clientY-a.y}))},z=e=>{u&&y({x:e.clientX-h.x,y:e.clientY-h.y})},N=()=>{p(!1)},A=e=>{e.touches.length===1&&r>1?(p(!0),w({x:e.touches[0].clientX-a.x,y:e.touches[0].clientY-a.y})):e.touches.length===2&&g(S(e.touches[0],e.touches[1]))};return o.jsxs("div",{className:n.container,children:[o.jsxs("div",{className:n.toolbar,children:[o.jsx("button",{onClick:B,className:n.backButton,children:"← Back"}),o.jsxs("div",{className:n.controls,children:[o.jsx("button",{onClick:()=>v(-.5),children:"-"}),o.jsxs("span",{children:[Math.round(r*100),"%"]}),o.jsx("button",{onClick:()=>v(.5),children:"+"})]})]}),o.jsx("div",{className:n.viewport,onMouseDown:P,onMouseMove:z,onMouseUp:N,onMouseLeave:N,onTouchStart:A,onTouchMove:D,onTouchEnd:I,style:{cursor:r>1?u?"grabbing":"grab":"default",touchAction:"none"},children:o.jsxs("div",{className:n.imageContainer,style:{transform:`translate(${a.x}px, ${a.y}px) scale(${r})`,transition:u?"none":"transform 0.2s"},children:[o.jsx("img",{src:b,alt:"Cookie Category",className:n.image}),s.map(e=>o.jsx("button",{className:`${n.marker} ${T===String(e.number)?n.selected:""}`,style:{left:`${e.x}%`,top:`${e.y}%`},onClick:t=>{t.stopPropagation(),U(e.number)},children:o.jsx("span",{className:n.markerNumber,children:e.number})},e.id))]})}),o.jsxs("div",{className:n.instruction,children:["Tap a number to select it. ",r>1?"Drag to pan. ":"",window.innerWidth<=768?"Pinch to zoom. ":"Use +/- to zoom. "]})]})}j.__docgenInfo={description:`CookieViewer - An interactive image viewer for displaying cookies with numbered markers.

This component provides a zoomable and pannable image viewer with numbered markers
for each cookie. Users can zoom in/out, pan when zoomed, and click on cookie markers
to select them. The component supports both mouse and touch interactions, including
pinch-to-zoom on mobile devices.

Features:
- Zoom controls (1x to 4x)
- Pan/drag when zoomed
- Touch support with pinch-to-zoom
- Numbered markers for each cookie
- Visual indication of selected cookie

@example
\`\`\`tsx
<CookieViewer
  imageUrl="/path/to/image.jpg"
  cookies={[
    { id: '1', number: 1, x: 25, y: 30 },
    { id: '2', number: 2, x: 75, y: 40 }
  ]}
  selectedCookieId="1"
  onSelectCookie={(num) => console.log('Selected cookie', num)}
  onBack={() => navigate('/')}
/>
\`\`\`

@param props - Component props
@returns JSX element containing the interactive image viewer`,methods:[],displayName:"CookieViewer",props:{imageUrl:{required:!0,tsType:{name:"string"},description:"URL of the image to display"},cookies:{required:!0,tsType:{name:"union",raw:"CookieCoordinate[] | CookieCoordinatePublic[]",elements:[{name:"Array",elements:[{name:"CookieCoordinate"}],raw:"CookieCoordinate[]"},{name:"Array",elements:[{name:"Omit",elements:[{name:"CookieCoordinate"},{name:"literal",value:"'makerName'"}],raw:"Omit<CookieCoordinate, 'makerName'>"}],raw:"CookieCoordinatePublic[]"}]},description:"Array of cookie coordinates to display as markers on the image"},selectedCookieId:{required:!0,tsType:{name:"union",raw:"string | undefined",elements:[{name:"string"},{name:"undefined"}]},description:"ID of the currently selected cookie (as string)"},onSelectCookie:{required:!0,tsType:{name:"signature",type:"function",raw:"(cookieNumber: number) => void",signature:{arguments:[{type:{name:"number"},name:"cookieNumber"}],return:{name:"void"}}},description:"Callback function called when a cookie marker is clicked"},onBack:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Callback function called when the back button is clicked"}}};const{fn:i}=__STORYBOOK_MODULE_TEST__,G={title:"Organisms/CookieViewer",component:j,parameters:{layout:"fullscreen",docs:{description:{component:`
An interactive image viewer for displaying cookie images with numbered markers.

**Features:**
- Zoom controls (1x to 4x)
- Mouse drag to pan when zoomed
- Touch pinch-to-zoom on mobile
- Touch drag to pan on mobile
- Visual highlighting of selected cookie
- Numbered markers for each cookie

**Usage:**
This component is used in the voting interface to allow users to view and select cookies.
        `}}},tags:["autodocs"],argTypes:{imageUrl:{control:"text",description:"URL of the cookie image to display"},cookies:{control:"object",description:"Array of cookie coordinate objects"},selectedCookieId:{control:"text",description:"ID of the currently selected cookie"},onSelectCookie:{action:"cookie-selected",description:"Callback when a cookie marker is clicked"},onBack:{action:"back-clicked",description:"Callback when the back button is clicked"}}},M=[{id:"1",number:1,makerName:"Alice",x:25,y:30},{id:"2",number:2,makerName:"Bob",x:50,y:40},{id:"3",number:3,makerName:"Charlie",x:75,y:50},{id:"4",number:4,makerName:"Diana",x:30,y:60},{id:"5",number:5,makerName:"Eve",x:60,y:70}],l={args:{imageUrl:"/test-cookies.jpg",cookies:M,selectedCookieId:void 0,onSelectCookie:i(),onBack:i()}},m={args:{imageUrl:"/test-cookies.jpg",cookies:M,selectedCookieId:"2",onSelectCookie:i(),onBack:i()}},d={args:{imageUrl:"/test-cookies-6.jpg",cookies:Array.from({length:12},(b,s)=>({id:String(s+1),number:s+1,makerName:`Maker ${s+1}`,x:20+s%4*20,y:20+Math.floor(s/4)*20})),selectedCookieId:void 0,onSelectCookie:i(),onBack:i()}},k={args:{imageUrl:"/test-cookies.jpg",cookies:[],selectedCookieId:void 0,onSelectCookie:i(),onBack:i()}};l.parameters={...l.parameters,docs:{...l.parameters?.docs,source:{originalSource:`{
  args: {
    imageUrl: '/test-cookies.jpg',
    cookies: sampleCookies,
    selectedCookieId: undefined,
    onSelectCookie: fn(),
    onBack: fn()
  }
}`,...l.parameters?.docs?.source},description:{story:"Default cookie viewer with sample cookies",...l.parameters?.docs?.description}}};m.parameters={...m.parameters,docs:{...m.parameters?.docs,source:{originalSource:`{
  args: {
    imageUrl: '/test-cookies.jpg',
    cookies: sampleCookies,
    selectedCookieId: '2',
    onSelectCookie: fn(),
    onBack: fn()
  }
}`,...m.parameters?.docs?.source},description:{story:"Cookie viewer with a selected cookie",...m.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    imageUrl: '/test-cookies-6.jpg',
    cookies: Array.from({
      length: 12
    }, (_, i) => ({
      id: String(i + 1),
      number: i + 1,
      makerName: \`Maker \${i + 1}\`,
      x: 20 + i % 4 * 20,
      y: 20 + Math.floor(i / 4) * 20
    })),
    selectedCookieId: undefined,
    onSelectCookie: fn(),
    onBack: fn()
  }
}`,...d.parameters?.docs?.source},description:{story:"Cookie viewer with many cookies",...d.parameters?.docs?.description}}};k.parameters={...k.parameters,docs:{...k.parameters?.docs,source:{originalSource:`{
  args: {
    imageUrl: '/test-cookies.jpg',
    cookies: [],
    selectedCookieId: undefined,
    onSelectCookie: fn(),
    onBack: fn()
  }
}`,...k.parameters?.docs?.source},description:{story:"Cookie viewer with no cookies (empty state)",...k.parameters?.docs?.description}}};const H=["Default","WithSelection","ManyCookies","NoCookies"];export{l as Default,d as ManyCookies,k as NoCookies,m as WithSelection,H as __namedExportsOrder,G as default};

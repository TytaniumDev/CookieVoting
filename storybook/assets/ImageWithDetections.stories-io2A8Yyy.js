import{j as g}from"./jsx-runtime-u17CrQMm.js";import{I as m}from"./ImageWithDetections-C796q3Q4.js";import{w as h}from"./firebase-decorator-zlxdyja1.js";import"./iframe-Bm-1nfva.js";import"./preload-helper-PPVm8Dsz.js";import"./firebase-DgwybkJe.js";const{fn:o}=__STORYBOOK_MODULE_TEST__,w={title:"Organisms/ImageWithDetections",component:m,parameters:{layout:"centered",docs:{description:{component:`
A reusable component for rendering images with cookie detection overlays.

**Features:**
- Displays images with visual overlays for detected cookies
- Supports polygon-based detection shapes (preferred) and bounding boxes (fallback)
- Interactive hover effects on cookie overlays
- Click handlers for cookie selection
- Customizable overlay rendering at top-left, bottom, and center positions
- Smooth polygon corner rendering with Bezier curves

**Usage:**
This component is used throughout the application to display cookie detection results.
It's particularly useful in the ImageTagger component for visualizing detected cookies
before they are tagged.
        `}}},tags:["autodocs"],argTypes:{imageUrl:{control:"text",description:"URL of the image to display"},detectedCookies:{control:"object",description:"Array of detected cookie objects with position and shape data"},onCookieClick:{description:"Callback when a cookie overlay is clicked"},borderColor:{control:"color",description:"Border color for cookie overlays (default: transparent)"},className:{control:"text",description:"Optional CSS class name for the container"}}},p=[{x:25,y:30,width:8,height:8,confidence:.95,polygon:[[20,25],[30,25],[30,35],[20,35]]},{x:50,y:40,width:10,height:10,confidence:.88,polygon:[[45,35],[55,35],[55,45],[45,45]]},{x:75,y:50,width:9,height:9,confidence:.92,polygon:[[70,45],[80,45],[80,55],[70,55]]}],k=[{x:30,y:30,width:8,height:8,confidence:.85},{x:60,y:50,width:10,height:10,confidence:.9}],t={args:{imageUrl:"/test-cookies.jpg",detectedCookies:p,onCookieClick:o()}},r={args:{imageUrl:"/test-cookies.jpg",detectedCookies:[],onCookieClick:o()}},n={args:{imageUrl:"/test-cookies.jpg",detectedCookies:k,onCookieClick:o()}},s={args:{imageUrl:"/test-cookies.jpg",detectedCookies:p,borderColor:"#2196F3",onCookieClick:o()}},i={args:{imageUrl:"/test-cookies.jpg",detectedCookies:p,onCookieClick:o(),renderTopLeft:({detected:l})=>g.jsxs("div",{style:{background:"rgba(0, 0, 0, 0.7)",color:"white",padding:"2px 6px",borderRadius:"4px",fontSize:"10px",fontWeight:"bold"},children:[(l.confidence*100).toFixed(0),"%"]}),renderCenter:({index:l})=>g.jsx("div",{style:{width:"20px",height:"20px",borderRadius:"50%",background:"rgba(33, 150, 243, 0.5)",border:"2px solid #2196F3",display:"flex",alignItems:"center",justifyContent:"center",color:"white",fontSize:"12px",fontWeight:"bold"},children:l+1})}},a={args:{imageUrl:"/test-cookies-6.jpg",detectedCookies:Array.from({length:12},(l,e)=>({x:20+e%4*20,y:20+Math.floor(e/4)*20,width:8,height:8,confidence:.85+Math.random()*.1,polygon:[[18+e%4*20,18+Math.floor(e/4)*20],[22+e%4*20,18+Math.floor(e/4)*20],[22+e%4*20,22+Math.floor(e/4)*20],[18+e%4*20,22+Math.floor(e/4)*20]]})),onCookieClick:o()}},c={decorators:[h],args:{imageUrl:"/test-cookies.jpg",detectedCookies:p,onCookieClick:o()},parameters:{docs:{description:{story:`
This story uses the Firebase Storage emulator to load images.
Make sure to start the Firebase emulators before viewing this story:
\`npm run emulators:start\`

The component will automatically connect to the emulator when running in Storybook.
        `}}}},d={args:{imageUrl:"/test-images/6-cookies/test-cookies.jpg",detectedCookies:[{x:20,y:25,width:8,height:8,confidence:.95,polygon:[[16,21],[24,21],[24,29],[16,29]]},{x:50,y:35,width:10,height:10,confidence:.88,polygon:[[45,30],[55,30],[55,40],[45,40]]}],onCookieClick:o()}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    imageUrl: '/test-cookies.jpg',
    detectedCookies: sampleCookiesWithPolygons,
    onCookieClick: fn()
  }
}`,...t.parameters?.docs?.source},description:{story:"Default story with multiple detected cookies using polygons",...t.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    imageUrl: '/test-cookies.jpg',
    detectedCookies: [],
    onCookieClick: fn()
  }
}`,...r.parameters?.docs?.source},description:{story:"Story with no detected cookies (empty state)",...r.parameters?.docs?.description}}};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  args: {
    imageUrl: '/test-cookies.jpg',
    detectedCookies: sampleCookiesBoundingBox,
    onCookieClick: fn()
  }
}`,...n.parameters?.docs?.source},description:{story:"Story with bounding boxes only (no polygons)",...n.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    imageUrl: '/test-cookies.jpg',
    detectedCookies: sampleCookiesWithPolygons,
    borderColor: '#2196F3',
    onCookieClick: fn()
  }
}`,...s.parameters?.docs?.source},description:{story:"Story with visible borders on cookie overlays",...s.parameters?.docs?.description}}};i.parameters={...i.parameters,docs:{...i.parameters?.docs,source:{originalSource:`{
  args: {
    imageUrl: '/test-cookies.jpg',
    detectedCookies: sampleCookiesWithPolygons,
    onCookieClick: fn(),
    renderTopLeft: ({
      detected
    }) => <div style={{
      background: 'rgba(0, 0, 0, 0.7)',
      color: 'white',
      padding: '2px 6px',
      borderRadius: '4px',
      fontSize: '10px',
      fontWeight: 'bold'
    }}>
        {(detected.confidence * 100).toFixed(0)}%
      </div>,
    renderCenter: ({
      index
    }) => <div style={{
      width: '20px',
      height: '20px',
      borderRadius: '50%',
      background: 'rgba(33, 150, 243, 0.5)',
      border: '2px solid #2196F3',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: 'white',
      fontSize: '12px',
      fontWeight: 'bold'
    }}>
        {index + 1}
      </div>
  }
}`,...i.parameters?.docs?.source},description:{story:"Story with custom top-left overlay (showing confidence percentage)",...i.parameters?.docs?.description}}};a.parameters={...a.parameters,docs:{...a.parameters?.docs,source:{originalSource:`{
  args: {
    imageUrl: '/test-cookies-6.jpg',
    detectedCookies: Array.from({
      length: 12
    }, (_, i) => ({
      x: 20 + i % 4 * 20,
      y: 20 + Math.floor(i / 4) * 20,
      width: 8,
      height: 8,
      confidence: 0.85 + Math.random() * 0.1,
      polygon: [[18 + i % 4 * 20, 18 + Math.floor(i / 4) * 20], [22 + i % 4 * 20, 18 + Math.floor(i / 4) * 20], [22 + i % 4 * 20, 22 + Math.floor(i / 4) * 20], [18 + i % 4 * 20, 22 + Math.floor(i / 4) * 20]] as Array<[number, number]>
    })),
    onCookieClick: fn()
  }
}`,...a.parameters?.docs?.source},description:{story:"Story with many detected cookies (stress test)",...a.parameters?.docs?.description}}};c.parameters={...c.parameters,docs:{...c.parameters?.docs,source:{originalSource:`{
  decorators: [withFirebaseEmulator],
  args: {
    imageUrl: '/test-cookies.jpg',
    detectedCookies: sampleCookiesWithPolygons,
    onCookieClick: fn()
  },
  parameters: {
    docs: {
      description: {
        story: \`
This story uses the Firebase Storage emulator to load images.
Make sure to start the Firebase emulators before viewing this story:
\\\`npm run emulators:start\\\`

The component will automatically connect to the emulator when running in Storybook.
        \`
      }
    }
  }
}`,...c.parameters?.docs?.source},description:{story:`Story with Firebase emulator integration
This story demonstrates the component working with real Firebase Storage emulator`,...c.parameters?.docs?.description}}};d.parameters={...d.parameters,docs:{...d.parameters?.docs,source:{originalSource:`{
  args: {
    imageUrl: '/test-images/6-cookies/test-cookies.jpg',
    detectedCookies: [{
      x: 20,
      y: 25,
      width: 8,
      height: 8,
      confidence: 0.95,
      polygon: [[16, 21], [24, 21], [24, 29], [16, 29]]
    }, {
      x: 50,
      y: 35,
      width: 10,
      height: 10,
      confidence: 0.88,
      polygon: [[45, 30], [55, 30], [55, 40], [45, 40]]
    }],
    onCookieClick: fn()
  }
}`,...d.parameters?.docs?.source},description:{story:"Story with different image from test-images directory",...d.parameters?.docs?.description}}};const S=["Default","NoDetections","BoundingBoxesOnly","WithBorders","WithCustomOverlays","ManyDetections","WithFirebaseEmulator","DifferentImage"];export{n as BoundingBoxesOnly,t as Default,d as DifferentImage,a as ManyDetections,r as NoDetections,s as WithBorders,i as WithCustomOverlays,c as WithFirebaseEmulator,S as __namedExportsOrder,w as default};

import{j as e}from"./jsx-runtime-u17CrQMm.js";import{A as l}from"./AuthButton-C8hrrW05.js";import{a as h,L as p,O as u,B as r,R as d,b as c}from"./chunk-JMJ3UQ3L-DVVcMVDb.js";import"./iframe-Bm-1nfva.js";import"./preload-helper-PPVm8Dsz.js";import"./firebase-DgwybkJe.js";import"./AlertModal-qe62fxxT.js";const m="_container_uib2l_1",g="_header_uib2l_7",x="_headerContent_uib2l_14",y="_logo_uib2l_29",j="_main_uib2l_43",f="_footer_uib2l_57",t={container:m,header:g,headerContent:x,logo:y,main:j,footer:f};function a(){const s=h().pathname==="/";return e.jsxs("div",{className:t.container,children:[!s&&e.jsx("header",{className:t.header,children:e.jsxs("div",{className:t.headerContent,children:[e.jsx(p,{to:"/",className:t.logo,children:"🍪 Cookie Voting"}),e.jsx(l,{})]})}),e.jsx("main",{className:t.main,children:e.jsx(u,{})}),!s&&e.jsx("footer",{className:t.footer,children:e.jsxs("p",{children:["© ",new Date().getFullYear()," Cookie Voting"]})})]})}a.__docgenInfo={description:`Layout - Main layout component for the application.

This component provides the overall page structure including header, main content area,
and footer. It conditionally shows/hides the header and footer based on the current
route (hidden on the landing page).

The layout includes:
- Header with logo and authentication button
- Main content area (renders child routes via Outlet)
- Footer with copyright information

@example
\`\`\`tsx
<Layout>
  <Routes>
    <Route path="/" element={<Home />} />
    <Route path="/admin" element={<AdminDashboard />} />
  </Routes>
</Layout>
\`\`\`

@returns JSX element containing the application layout`,methods:[],displayName:"Layout"};const A={title:"Templates/Layout",component:a,decorators:[i=>e.jsx(r,{children:e.jsx(i,{})})],parameters:{layout:"fullscreen",docs:{description:{component:`
Main layout wrapper component that provides consistent page structure.

**Features:**
- Conditional header/footer (hidden on landing page)
- Logo/branding link
- Authentication button in header
- Main content area via React Router Outlet
- Responsive design

**Usage:**
This component wraps all routes in the application to provide consistent layout.
        `}}},tags:["autodocs"]},n={render:()=>e.jsx(r,{children:e.jsx(d,{children:e.jsx(c,{path:"/*",element:e.jsx(a,{children:e.jsxs("div",{style:{padding:"2rem",textAlign:"center"},children:[e.jsx("h1",{children:"Sample Page Content"}),e.jsx("p",{children:"This is sample content inside the Layout component."})]})})})})})},o={render:()=>e.jsx(r,{children:e.jsx(d,{children:e.jsx(c,{path:"/*",element:e.jsx(a,{children:e.jsxs("div",{style:{padding:"2rem",textAlign:"center",minHeight:"100vh"},children:[e.jsx("h1",{children:"Landing Page"}),e.jsx("p",{children:"Header and footer are hidden on the landing page."})]})})})})})};n.parameters={...n.parameters,docs:{...n.parameters?.docs,source:{originalSource:`{
  render: () => <BrowserRouter>
      <Routes>
        <Route path="/*" element={<Layout>
              <div style={{
          padding: '2rem',
          textAlign: 'center'
        }}>
                <h1>Sample Page Content</h1>
                <p>This is sample content inside the Layout component.</p>
              </div>
            </Layout>} />
      </Routes>
    </BrowserRouter>
}`,...n.parameters?.docs?.source},description:{story:"Default layout with sample content",...n.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  render: () => <BrowserRouter>
      <Routes>
        <Route path="/*" element={<Layout>
              <div style={{
          padding: '2rem',
          textAlign: 'center',
          minHeight: '100vh'
        }}>
                <h1>Landing Page</h1>
                <p>Header and footer are hidden on the landing page.</p>
              </div>
            </Layout>} />
      </Routes>
    </BrowserRouter>
}`,...o.parameters?.docs?.source},description:{story:"Layout on landing page (no header/footer)",...o.parameters?.docs?.description}}};const B=["Default","LandingPage"];export{n as Default,o as LandingPage,B as __namedExportsOrder,A as default};

import{j as o}from"./jsx-runtime-u17CrQMm.js";import{A as n}from"./AuthButton-C8hrrW05.js";import{w as i}from"./firebase-decorator-zlxdyja1.js";import{B as s}from"./chunk-JMJ3UQ3L-DVVcMVDb.js";import"./iframe-Bm-1nfva.js";import"./preload-helper-PPVm8Dsz.js";import"./firebase-DgwybkJe.js";import"./AlertModal-qe62fxxT.js";const g={title:"Molecules/AuthButton",component:n,decorators:[r=>o.jsx(s,{children:o.jsx(r,{})})],parameters:{layout:"centered",docs:{description:{component:`
A comprehensive authentication button component.

**Features:**
- Google OAuth sign-in (popup or redirect fallback)
- User menu with avatar and email display
- Sign-out functionality
- Automatic redirect handling after OAuth redirect
- Error handling with user-friendly alerts
- Loading states during authentication

**Usage:**
This component is used in the Layout component header to provide authentication
throughout the application.
        `}}},tags:["autodocs"]},t={parameters:{docs:{description:{story:`
Shows the "Sign in with Google" button when the user is not authenticated.
Clicking the button will attempt to sign in via Google OAuth.
        `}}}},e={decorators:[i,r=>o.jsx(s,{children:o.jsx(r,{})})],parameters:{docs:{description:{story:`
This story uses the Firebase Auth emulator for testing authentication.
Make sure to start the Firebase emulators before viewing this story:
\`npm run emulators:start\`

You can test sign-in/sign-out flows without affecting production data.
        `}}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  parameters: {
    docs: {
      description: {
        story: \`
Shows the "Sign in with Google" button when the user is not authenticated.
Clicking the button will attempt to sign in via Google OAuth.
        \`
      }
    }
  }
}`,...t.parameters?.docs?.source},description:{story:"Default auth button (signed out state)",...t.parameters?.docs?.description}}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  decorators: [withFirebaseEmulator, Story => <BrowserRouter>
        <Story />
      </BrowserRouter>],
  parameters: {
    docs: {
      description: {
        story: \`
This story uses the Firebase Auth emulator for testing authentication.
Make sure to start the Firebase emulators before viewing this story:
\\\`npm run emulators:start\\\`

You can test sign-in/sign-out flows without affecting production data.
        \`
      }
    }
  }
}`,...e.parameters?.docs?.source},description:{story:`Auth button with Firebase emulator
This story demonstrates the component working with Firebase Auth emulator`,...e.parameters?.docs?.description}}};const w=["Default","WithFirebaseEmulator"];export{t as Default,e as WithFirebaseEmulator,w as __namedExportsOrder,g as default};

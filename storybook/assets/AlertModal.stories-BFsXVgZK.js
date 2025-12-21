import{A as n}from"./AlertModal-qe62fxxT.js";import"./jsx-runtime-u17CrQMm.js";const{fn:a}=__STORYBOOK_MODULE_TEST__,l={title:"Molecules/AlertModal",component:n,parameters:{layout:"centered",docs:{description:{component:`
A modal component for displaying alert messages to users.

**Features:**
- Three alert types: success, error, and info
- Customizable title or auto-generated based on type
- Click outside or OK button to close
- Accessible and keyboard-friendly

**Usage:**
Use this component to display important messages, confirmations, or errors to users.
        `}}},tags:["autodocs"],argTypes:{message:{control:"text",description:"The message text to display"},type:{control:"select",options:["success","error","info"],description:"Alert type determines styling and default title"},title:{control:"text",description:"Optional custom title (defaults based on type)"},onClose:{description:"Function called when modal is closed"}}},e={args:{message:"Operation completed successfully!",type:"success",onClose:a()}},s={args:{message:"An error occurred while processing your request. Please try again.",type:"error",onClose:a()}},o={args:{message:"This is an informational message for the user.",type:"info",onClose:a()}},r={args:{message:"Your changes have been saved.",type:"success",title:"Saved!",onClose:a()}},t={args:{message:"This is a longer message that demonstrates how the modal handles text that spans multiple lines. The modal will automatically wrap the text and adjust its height accordingly.",type:"info",onClose:a()}};e.parameters={...e.parameters,docs:{...e.parameters?.docs,source:{originalSource:`{
  args: {
    message: 'Operation completed successfully!',
    type: 'success',
    onClose: fn()
  }
}`,...e.parameters?.docs?.source},description:{story:"Success alert modal",...e.parameters?.docs?.description}}};s.parameters={...s.parameters,docs:{...s.parameters?.docs,source:{originalSource:`{
  args: {
    message: 'An error occurred while processing your request. Please try again.',
    type: 'error',
    onClose: fn()
  }
}`,...s.parameters?.docs?.source},description:{story:"Error alert modal",...s.parameters?.docs?.description}}};o.parameters={...o.parameters,docs:{...o.parameters?.docs,source:{originalSource:`{
  args: {
    message: 'This is an informational message for the user.',
    type: 'info',
    onClose: fn()
  }
}`,...o.parameters?.docs?.source},description:{story:"Info alert modal",...o.parameters?.docs?.description}}};r.parameters={...r.parameters,docs:{...r.parameters?.docs,source:{originalSource:`{
  args: {
    message: 'Your changes have been saved.',
    type: 'success',
    title: 'Saved!',
    onClose: fn()
  }
}`,...r.parameters?.docs?.source},description:{story:"Alert modal with custom title",...r.parameters?.docs?.description}}};t.parameters={...t.parameters,docs:{...t.parameters?.docs,source:{originalSource:`{
  args: {
    message: 'This is a longer message that demonstrates how the modal handles text that spans multiple lines. The modal will automatically wrap the text and adjust its height accordingly.',
    type: 'info',
    onClose: fn()
  }
}`,...t.parameters?.docs?.source},description:{story:"Long message alert",...t.parameters?.docs?.description}}};const d=["Success","Error","Info","CustomTitle","LongMessage"];export{r as CustomTitle,s as Error,o as Info,t as LongMessage,e as Success,d as __namedExportsOrder,l as default};

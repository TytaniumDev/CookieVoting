import{j as e}from"./jsx-runtime-u17CrQMm.js";const i="_modalOverlay_1hfup_1",c="_modal_1hfup_1",d="_titleSuccess_1hfup_31",m="_titleError_1hfup_35",u="_titleInfo_1hfup_39",p="_message_1hfup_43",f="_modalActions_1hfup_49",h="_modalButton_1hfup_55",t={modalOverlay:i,modal:c,titleSuccess:d,titleError:m,titleInfo:u,message:p,modalActions:f,modalButton:h};function _({message:a,type:s="info",onClose:n,title:o}){const l=()=>{if(o)return o;switch(s){case"success":return"Success";case"error":return"Error";default:return"Information"}};return e.jsx("div",{className:t.modalOverlay,onClick:n,children:e.jsxs("div",{className:t.modal,onClick:r=>r.stopPropagation(),children:[e.jsx("h3",{className:t[`title${s.charAt(0).toUpperCase()+s.slice(1)}`],children:l()}),e.jsx("p",{className:t.message,children:a}),e.jsx("div",{className:t.modalActions,children:e.jsx("button",{onClick:n,className:t.modalButton,children:"OK"})})]})})}_.__docgenInfo={description:`AlertModal - A modal component for displaying alert messages to users.

This component displays a modal overlay with a message, title, and close button.
It supports different alert types (success, error, info) which determine the
styling and default title. The modal can be closed by clicking the OK button
or clicking outside the modal (on the overlay).

@example
\`\`\`tsx
<AlertModal
  message="Operation completed successfully!"
  type="success"
  onClose={() => setIsOpen(false)}
/>
\`\`\`

@param props - Component props
@returns JSX element containing the modal`,methods:[],displayName:"AlertModal",props:{message:{required:!0,tsType:{name:"string"},description:"The message to display in the modal"},type:{required:!1,tsType:{name:"union",raw:"'success' | 'error' | 'info'",elements:[{name:"literal",value:"'success'"},{name:"literal",value:"'error'"},{name:"literal",value:"'info'"}]},description:"The type of alert, determines styling and default title",defaultValue:{value:"'info'",computed:!1}},onClose:{required:!0,tsType:{name:"signature",type:"function",raw:"() => void",signature:{arguments:[],return:{name:"void"}}},description:"Callback function called when the modal is closed"},title:{required:!1,tsType:{name:"string"},description:"Optional custom title. If not provided, a default title is used based on type"}}};export{_ as A};

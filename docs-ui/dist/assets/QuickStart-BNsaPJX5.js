import{j as e}from"./index-Bb-IRV5E.js";import{T as i,S as n,H as r,P as o,d as t,C as s,A as d}from"./Docs-DWfqreAW.js";function c(){return e.jsxs(e.Fragment,{children:[e.jsx(i,{children:"Quick Start"}),e.jsx(n,{children:"Get Pionts running in your shop in 5 minutes."}),e.jsx(r,{children:"Prerequisites"}),e.jsx(o,{children:"A Pionts project with API keys (from the dashboard) and Node.js 18+."}),e.jsx(t,{num:1,title:"Install",children:e.jsx(s,{lang:"bash",children:"npm install @pionts/sdk"})}),e.jsx(t,{num:2,title:"Initialize",children:e.jsx(s,{lang:"typescript",children:`import { PiontsClient } from '@pionts/sdk';

const pionts = new PiontsClient({
  apiUrl: process.env.PIONTS_API_URL,
  secretKey: process.env.PIONTS_SECRET_KEY,
});`})}),e.jsx(t,{num:3,title:"Validate at Checkout",children:e.jsx(s,{lang:"typescript",children:`const result = await pionts.checkout.validate(code);
if (result.valid) {
  // Apply discount of result.discountAmount
}`})}),e.jsx(t,{num:4,title:"Award Points After Payment",children:e.jsx(s,{lang:"typescript",children:`await pionts.orders.paid({
  orderId: order.id,
  email: customer.email,
  orderTotal: order.total,
  currency: 'EUR',
});

// If loyalty code was used:
await pionts.checkout.markUsed(code);`})}),e.jsx(t,{num:5,title:"Handle Refunds",children:e.jsx(s,{lang:"typescript",children:"await pionts.orders.refunded(orderId, refundAmount);"})}),e.jsx(d,{type:"success",children:"Done! Your shop now has loyalty points. See the Widget Setup guide to add the frontend widget."})]})}export{c as default};

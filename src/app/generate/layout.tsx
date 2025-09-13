"use client";

import PostCheckoutRunner from "@/components/PostCheckoutRunner";

export default function GenerateLayout({ children }: { children: React.ReactNode }) {
  return (
    <>
      {children}
      <PostCheckoutRunner />
    </>
  );
}

import React, { ReactNode } from "react";
import { getSubComponent } from "src/utils";

interface Props {
  children: ReactNode;
}

export const AuthCard = ({ children }: Props) => {
  const Header = getSubComponent(children, "Header");
  const Body = getSubComponent(children, "Body");

  return (
    <div className="mx-auto grid max-w-md gap-6 rounded-lg border border-slate-200 bg-white p-6 shadow-sm">
      <div>
        {Header}
      </div>
      {Body}
    </div>
  );
};


const Header = ({ children }: { children: ReactNode }) => <>{children}</>;
Header.displayName = "Header";

const Body = ({ children }: { children: ReactNode }) => <>{children}</>;
Body.displayName = "Body";

AuthCard.Header = Header;
AuthCard.Body = Body;
import type { PropsWithChildren } from "react";

interface ScreenLayoutProps extends PropsWithChildren {
  title: string;
  subtitle: string;
}

export function ScreenLayout({ title, subtitle, children }: ScreenLayoutProps) {
  return (
    <section className="screen">
      <header className="screen__header">
        <p className="eyebrow">Swedish vocab</p>
        <h1>{title}</h1>
        <p className="screen__subtitle">{subtitle}</p>
      </header>
      <div className="screen__body">{children}</div>
    </section>
  );
}


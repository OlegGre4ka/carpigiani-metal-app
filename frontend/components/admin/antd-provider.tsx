"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import ukUA from "antd/locale/uk_UA";
import { themeColors as c } from "@/lib/theme-colors";

// Antd in the colours of the theme (lib/theme-colors.ts): blue buttons, round corners, Manrope font.
export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    // layer: Antd styles go into the "antd" layer (see globals.css), below our own classes
    <AntdRegistry layer>
      <ConfigProvider
        locale={ukUA}
        theme={{
          token: {
            colorPrimary: c.brand,
            colorLink: c.brand,
            colorText: c.ink,
            colorTextSecondary: c.inkSoft,
            colorBorder: c.border,
            colorBgContainer: c.paper,
            borderRadius: 14,
            fontFamily: "var(--font-manrope-admin), Arial, sans-serif",
            fontSize: 15,
            controlHeight: 42,
          },
          components: {
            Button: { primaryShadow: c.brandShadow, fontWeight: 700 },
            Table: { headerBg: c.mist, headerColor: c.ink, rowHoverBg: c.rowHover },
            Modal: { borderRadiusLG: 28 },
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}

"use client";

import { AntdRegistry } from "@ant-design/nextjs-registry";
import { App, ConfigProvider } from "antd";
import ukUA from "antd/locale/uk_UA";

// Antd in Carpigiani colors: caramel buttons, cream backgrounds, round corners, Manrope font.
export function AntdProvider({ children }: { children: React.ReactNode }) {
  return (
    // layer: Antd styles go into the "antd" layer (see globals.css), below our own classes
    <AntdRegistry layer>
      <ConfigProvider
        locale={ukUA}
        theme={{
          token: {
            colorPrimary: "#7a5232",
            colorLink: "#7a5232",
            colorText: "#4a3426",
            colorTextSecondary: "#6b5848",
            colorBorder: "rgba(74,52,38,0.16)",
            colorBgContainer: "#ffffff",
            borderRadius: 14,
            fontFamily: "var(--font-manrope), Arial, sans-serif",
            fontSize: 15,
            controlHeight: 42,
          },
          components: {
            Button: { primaryShadow: "0 10px 22px rgba(122,82,50,0.25)", fontWeight: 700 },
            Table: { headerBg: "#f6ebdc", headerColor: "#7a5232", rowHoverBg: "#fdf8f1" },
            Modal: { borderRadiusLG: 28 },
          },
        }}
      >
        <App>{children}</App>
      </ConfigProvider>
    </AntdRegistry>
  );
}

"use client";

import { useState } from "react";

export function NotReadyToInvest() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  return (
    <section className="bg-[#004C61] w-full px-6 lg:px-[112px] py-14">
      <h2 className="text-white font-bold text-2xl leading-[30px] capitalize mb-[17px]">
        Not ready to invest yet?
      </h2>
      <div className="bg-[#ECF4F1] rounded-3xl px-10 py-6 flex flex-col lg:flex-row items-start lg:items-center justify-between gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-[#14B7A3] font-medium text-xl leading-5">Get Free</span>
          <span className="text-[#004C61] text-[15px] font-normal leading-[15px]">
            Monthly SIF Report · NFO Alerts · SIF Starter Guide
          </span>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <input
            type="text"
            placeholder="Name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            className="free-access-input"
          />
          <input
            type="email"
            placeholder="E-mail"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="free-access-input"
          />
          <input
            type="tel"
            placeholder="Mobile"
            value={mobile}
            onChange={(e) => setMobile(e.target.value)}
            className="free-access-input"
          />
          <button className="free-access-btn">Get Free Access</button>
        </div>
      </div>

      <style jsx>{`
        .free-access-input {
          width: 125px;
          padding: 6px 12px;
          border-radius: 8px;
          border: 1px solid rgba(0, 76, 97, 0.6);
          background: rgba(255, 255, 255, 0.6);
          color: rgba(0, 76, 97, 0.9);
          font-family: "Satoshi Variable", -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 12px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0.1px;
          outline: none;
        }
        .free-access-input::placeholder {
          color: rgba(0, 76, 97, 0.5);
        }
        .free-access-btn {
          padding: 6px 17px 6px 12px;
          border-radius: 8px;
          background: #2d3c47;
          color: #cae973;
          font-family: "Satoshi Variable", -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 13px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0.1px;
          border: none;
          cursor: pointer;
          white-space: nowrap;
        }
        .free-access-btn:hover {
          opacity: 0.9;
        }
      `}</style>
    </section>
  );
}

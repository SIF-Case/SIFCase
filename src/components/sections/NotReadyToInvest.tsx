"use client";

import { useState } from "react";

export function NotReadyToInvest() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [mobile, setMobile] = useState("");

  return (
    <section className="bg-[#004C61] w-full px-4 sm:px-6 lg:px-[112px] py-10 lg:py-14">
      <h2 className="text-white font-bold text-xl sm:text-2xl leading-[30px] capitalize mb-[17px]">
        Not ready to invest yet?
      </h2>
      <div className="bg-[#ECF4F1] rounded-3xl px-5 sm:px-10 py-6 flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-6">
        <div className="flex flex-col gap-3">
          <span className="text-[#14B7A3] font-medium text-xl leading-5">Get Free</span>
          <span className="text-[#004C61] text-[15px] font-normal leading-[15px]">
            Monthly SIF Report · NFO Alerts · SIF Starter Guide
          </span>
        </div>
        <div className="free-access-form flex flex-col sm:flex-row sm:flex-wrap items-stretch sm:items-center gap-2 w-full lg:w-auto">
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
        .free-access-input,
        .free-access-btn {
          height: 36px;
          box-sizing: border-box;
          border-radius: 8px;
          font-family: var(--font-dm-sans), -apple-system, Roboto, Helvetica, sans-serif;
          font-size: 13px;
          font-weight: 500;
          line-height: 20px;
          letter-spacing: 0.1px;
        }
        .free-access-input {
          width: 100%;
          padding: 0 12px;
          border: 1px solid rgba(0, 76, 97, 0.6);
          background: rgba(255, 255, 255, 0.6);
          color: rgba(0, 76, 97, 0.9);
          outline: none;
        }
        .free-access-input::placeholder {
          color: rgba(0, 76, 97, 0.5);
        }
        .free-access-btn {
          width: 100%;
          padding: 0 16px;
          background: #2d3c47;
          color: #cae973;
          border: none;
          cursor: pointer;
          white-space: nowrap;
        }
        .free-access-btn:hover {
          opacity: 0.9;
        }

        @media (min-width: 640px) {
          .free-access-input {
            width: 125px;
          }
          .free-access-btn {
            width: auto;
          }
        }
      `}</style>
    </section>
  );
}

import Link from "next/link";

function ArrowRightIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M2.91675 6.99984H11.0834M7.00008 11.0832L11.0834 6.99984L7.00008 2.9165"
        stroke="currentColor"
        strokeWidth="1.25"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function StarIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg">
      <path
        d="M6.6665 14.9998L9.99984 12.4582L13.3332 14.9998L12.0832 10.8748L15.4165 8.49984H11.3332L9.99984 4.1665L8.6665 8.49984H4.58317L7.9165 10.8748L6.6665 14.9998ZM9.99984 18.3332C8.84706 18.3332 7.76373 18.1144 6.74984 17.6769C5.73595 17.2394 4.854 16.6457 4.104 15.8957C3.354 15.1457 2.76025 14.2637 2.32275 13.2498C1.88525 12.2359 1.6665 11.1526 1.6665 9.99984C1.6665 8.84706 1.88525 7.76373 2.32275 6.74984C2.76025 5.73595 3.354 4.854 4.104 4.104C4.854 3.354 5.73595 2.76025 6.74984 2.32275C7.76373 1.88525 8.84706 1.6665 9.99984 1.6665C11.1526 1.6665 12.2359 1.88525 13.2498 2.32275C14.2637 2.76025 15.1457 3.354 15.8957 4.104C16.6457 4.854 17.2394 5.73595 17.6769 6.74984C18.1144 7.76373 18.3332 8.84706 18.3332 9.99984C18.3332 11.1526 18.1144 12.2359 17.6769 13.2498C17.2394 14.2637 16.6457 15.1457 15.8957 15.8957C15.1457 16.6457 14.2637 17.2394 13.2498 17.6769C12.2359 18.1144 11.1526 18.3332 9.99984 18.3332Z"
        fill="currentColor"
      />
    </svg>
  );
}

export function CTABand() {
  return (
    <section className="bg-[#004c61] w-full overflow-hidden">
      <div className="flex flex-col items-center gap-6 py-[66px] px-6 lg:px-[345px] max-w-[1320px] mx-auto">
        <div className="flex flex-col items-center gap-3">
          <h2 className="color-white text-center font-sans text-[24px] font-bold tracking-[-0.67px] leading-[25px] text-white">
            Understand SIFs before you invest.
          </h2>
          <p className="max-w-[480px] text-white text-center font-sans text-[15px] font-normal leading-normal tracking-[0.2px]">
            Compare official data, read simplified strategy notes, and check if SIFs are suitable for your investment profile.
          </p>
        </div>

        <div className="flex flex-col sm:flex-row justify-center items-center gap-6 w-full">
          <Link
            href="/compare"
            className="flex items-center justify-center gap-2 rounded-full border-none cursor-pointer font-sans text-[15px] font-medium leading-[20px] tracking-[0.1px] text-white py-[14px] px-8 bg-[#14b7a3] hover:opacity-[0.88] transition-opacity duration-150 shadow-btn whitespace-nowrap text-center"
          >
            Become SIF ready
            <ArrowRightIcon />
          </Link>
          <Link
            href="/read"
            className="flex items-center justify-center gap-2 rounded-full border-none cursor-pointer font-sans text-[15px] font-medium leading-[20px] tracking-[0.1px] text-white py-[14px] px-8 bg-[#3b8bb1] hover:opacity-[0.88] transition-opacity duration-150 whitespace-nowrap text-center"
          >
            <StarIcon />
            Start with the basics
          </Link>
        </div>

        <p className="text-[rgba(255,255,255,0.8)] text-center font-sans text-[15px] font-normal leading-normal tracking-[0.2px] max-w-[590px] mt-2">
          SIFs require a minimum investment of ₹10 lakh and are designed for sophisticated investors. This platform is for research and education only, not investment advice.
        </p>
      </div>
    </section>
  );
}

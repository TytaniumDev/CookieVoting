export const Snowman = () => {
  return (
    <>
      <style>{`
        .snowman-body::before {
          content: '';
          position: absolute;
          bottom: 85px;
          left: 15px;
          width: 70px;
          height: 70px;
          background: white;
          border-radius: 50%;
          box-shadow: inset -3px -3px 8px rgba(0, 0, 0, 0.1);
        }
        .snowman-hat::after {
          content: '';
          position: absolute;
          bottom: 0;
          left: -10px;
          width: 60px;
          height: 5px;
          background: #0f172a;
          border-radius: 2px;
        }
        .snowman-left-arm::before {
          content: '';
          position: absolute;
          left: -15px;
          width: 15px;
          height: 3px;
          background: #78350f;
          border-radius: 2px;
          transform: rotate(45deg);
          transform-origin: right center;
        }
        .snowman-left-arm::after {
          content: '';
          position: absolute;
          left: -15px;
          width: 15px;
          height: 3px;
          background: #78350f;
          border-radius: 2px;
          transform: rotate(-45deg);
          transform-origin: right center;
        }
        .snowman-right-arm::before {
          content: '';
          position: absolute;
          right: -15px;
          width: 15px;
          height: 3px;
          background: #78350f;
          border-radius: 2px;
          transform: rotate(-45deg);
          transform-origin: left center;
        }
        .snowman-right-arm::after {
          content: '';
          position: absolute;
          right: -15px;
          width: 15px;
          height: 3px;
          background: #78350f;
          border-radius: 2px;
          transform: rotate(45deg);
          transform-origin: left center;
        }
      `}</style>
      <div
        className="relative w-[100px] h-[190px] animate-[sway_4s_ease-in-out_infinite] origin-bottom"
        aria-hidden="true"
        role="img"
        aria-label="A festive snowman swaying in the snow"
      >
        <div className="snowman-body absolute bottom-0 left-0 w-[100px] h-[100px] bg-white rounded-full shadow-[inset_-5px_-5px_10px_rgba(0,0,0,0.1)]">
          <div className="snowman-left-arm absolute w-[45px] h-[3px] bg-[#78350f] rounded-sm -top-5 -left-[25px] z-[1] rotate-[30deg] origin-right" />
          <div className="snowman-right-arm absolute w-[45px] h-[3px] bg-[#78350f] rounded-sm -top-5 -right-[25px] z-[1] -rotate-[25deg] origin-left" />
          <div className="absolute -top-[35px] left-[47px] w-[6px] h-[6px] bg-[#1e293b] rounded-full shadow-[0_15px_0_#1e293b,0_30px_0_#1e293b]" />
        </div>
        <div className="absolute bottom-[140px] left-[25px] w-[50px] h-[50px] bg-white rounded-full shadow-[inset_-2px_-2px_5px_rgba(0,0,0,0.1)]">
          <div className="snowman-hat absolute -top-[15px] left-[5px] w-10 h-[30px] bg-[#0f172a] rounded-sm" />
          <div className="absolute top-[15px] left-3 w-[5px] h-[5px] bg-[#1e293b] rounded-full shadow-[18px_0_0_#1e293b]" />
          <div className="absolute top-[22px] left-5 w-0 h-0 border-l-[15px] border-l-[#f97316] border-t-[5px] border-t-transparent border-b-[5px] border-b-transparent rotate-[10deg]" />
          <div className="absolute -bottom-[5px] -left-[5px] w-[60px] h-[15px] bg-[#ef4444] rounded-[10px] z-[2]" />
          <div className="absolute -bottom-[25px] left-[10px] w-[15px] h-[35px] bg-[#ef4444] rounded-md z-[2] rotate-[5deg]" />
        </div>
      </div>
    </>
  );
};

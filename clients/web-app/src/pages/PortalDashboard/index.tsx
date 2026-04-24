const PortalDashboard = () => {
  return (
    <div className="flex flex-col items-center justify-center h-full gap-6 px-4 text-center">
      <div className="bg-[#F5F9EE] border border-[#7DA10D]/30 rounded-2xl p-10 max-w-md w-full shadow-sm flex flex-col items-center gap-4">
        <div className="w-16 h-16 rounded-full bg-[#7DA10D]/10 flex items-center justify-center">
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="w-8 h-8 text-[#7DA10D]"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={1.5}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M11.42 15.17 17.25 21A2.652 2.652 0 0 0 21 17.25l-5.877-5.877M11.42 15.17l2.496-3.03c.317-.384.74-.626 1.208-.766M11.42 15.17l-4.655 5.653a2.548 2.548 0 1 1-3.586-3.586l5.654-4.654m5.647-5.647 1.208-.766a4.5 4.5 0 0 1 4.053.22l.774.386a4.5 4.5 0 0 0 4.222 0l1.388-.694a.75.75 0 0 0-.08-1.376l-2.537-.845a4.5 4.5 0 0 1-2.17-1.698l-.51-.766a4.5 4.5 0 0 0-1.447-1.447l-.766-.51a4.5 4.5 0 0 1-1.698-2.17l-.845-2.537a.75.75 0 0 0-1.376-.08l-.694 1.388a4.5 4.5 0 0 0 0 4.222l.386.774a4.5 4.5 0 0 1 .22 4.053l-.766 1.208Z"
            />
          </svg>
        </div>
        <h2 className="text-xl font-semibold text-[#213500]">Próximamente</h2>
        <p className="text-gray-500 text-sm leading-relaxed">
          Estamos trabajando en esta sección. Pronto encontrarás aquí mas
          información de tu portal.
        </p>
        <div className="flex gap-1.5 mt-2">
          <span className="w-2 h-2 rounded-full bg-[#7DA10D] animate-bounce [animation-delay:0ms]" />
          <span className="w-2 h-2 rounded-full bg-[#7DA10D] animate-bounce [animation-delay:150ms]" />
          <span className="w-2 h-2 rounded-full bg-[#7DA10D] animate-bounce [animation-delay:300ms]" />
        </div>
      </div>
    </div>
  )
}

export default PortalDashboard

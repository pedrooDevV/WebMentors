import React from "react";
export default function Toast({ message, type = "success", onClose }) {
  if (!message) {
    return null;
  }
  const isError = type === "error";
  return (
    <div
      role="alert"
      aria-live="assertive"
      className="fixed top-5 right-5 z-[9999] w-[calc(100%-2rem)] max-w-md"
    >
      {" "}
      <div
        className={`flex items-start gap-3 rounded-xl border bg-white p-4 shadow-2xl ${isError ? "border-rose-300" : "border-emerald-300"}`}
      >
        {" "}
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full ${isError ? "bg-rose-100 text-rose-600" : "bg-emerald-100 text-emerald-600"}`}
        >
          {" "}
          <i
            className={`fas ${isError ? "fa-exclamation-circle" : "fa-check-circle"}`}
          />{" "}
        </div>{" "}
        <div className="flex-1 pt-1">
          {" "}
          <p className="text-sm font-semibold text-slate-900">
            {" "}
            {isError ? "Ops! Algo deu errado" : "Sucesso"}{" "}
          </p>{" "}
          <p className="mt-1 break-words text-sm text-slate-600">
            {" "}
            {message}{" "}
          </p>{" "}
        </div>{" "}
        <button
          type="button"
          onClick={onClose}
          aria-label="Fechar notificação"
          className="text-slate-400 hover:text-slate-700"
        >
          {" "}
          <i className="fas fa-times" />{" "}
        </button>{" "}
      </div>{" "}
    </div>
  );
}

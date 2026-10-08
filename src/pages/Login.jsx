import React, { useEffect, useState } from "react";
import {
loginApi,
registrarUsuarioApi,
buscarEspecialidades,
} from "../services/api.js";

export default function Login({
setUser,
setIsBackendConnected,
showToast,
}) {
const [loginForm, setLoginForm] = useState({
nome: "",
password: "",
});

const [isLoading, setIsLoading] = useState(false);

const [showCadastroModal, setShowCadastroModal] = useState(false);

const [cadastroForm, setCadastroForm] = useState({
nome: "",
email: "",
senha: "",
telefone: "",
role: "CLIENTE",
biografia: "",
cargo: "",
especialidades: [],
});

const [especialidades, setEspecialidades] = useState([]);
const [isCadastrando, setIsCadastrando] = useState(false);

useEffect(() => {
if (!showCadastroModal || cadastroForm.role !== "MENTOR") {
return;
}


carregarEspecialidades();


}, [showCadastroModal, cadastroForm.role]);

const carregarEspecialidades = async () => {
try {
const data = await buscarEspecialidades();
setEspecialidades(data);
} catch (error) {
showToast(
error.message || "Erro ao carregar especialidades.",
"error"
);
}
};

const handleLogin = async (e) => {
e.preventDefault();


setIsLoading(true);

try {
  const data = await loginApi(loginForm);

  setIsBackendConnected(true);

  const usuario = {
    nome: data.nome || loginForm.nome,
    role: data.role,
    token: data.token,
  };

  localStorage.setItem("token", data.token);
  localStorage.setItem("usuario", JSON.stringify(usuario));

  setUser(usuario);

  showToast(`Bem-vindo(a), ${usuario.nome}!`, "success");
} catch (error) {
  setIsBackendConnected(false);

  showToast(
    "Usuário ou senha incorretos. Possui cadastro?",
    "error"
  );
} finally {
  setIsLoading(false);
}


};

const abrirCadastro = () => {
setCadastroForm({
nome: "",
email: "",
senha: "",
telefone: "",
role: "CLIENTE",
biografia: "",
cargo: "",
especialidades: [],
});


setShowCadastroModal(true);


};

const fecharCadastro = () => {
if (isCadastrando) return;


setShowCadastroModal(false);


};

const handleCadastroChange = (e) => {
const { name, value } = e.target;


setCadastroForm((prev) => ({
  ...prev,
  [name]: value,
}));

};

const alternarEspecialidade = (id) => {
setCadastroForm((prev) => {
const existe = prev.especialidades.includes(id);

  return {
    ...prev,
    especialidades: existe
      ? prev.especialidades.filter(
          (especialidadeId) => especialidadeId !== id
        )
      : [...prev.especialidades, id],
  };
});


};

const handleCadastro = async (e) => {
e.preventDefault();


if (
  cadastroForm.role === "MENTOR" &&
  cadastroForm.especialidades.length === 0
) {
  showToast(
    "Selecione pelo menos uma especialidade.",
    "error"
  );

  return;
}

setIsCadastrando(true);

try {
  const dados = {
    nome: cadastroForm.nome,
    email: cadastroForm.email,
    senha: cadastroForm.senha,
    telefone: cadastroForm.telefone,
    role: cadastroForm.role,
  };

  if (cadastroForm.role === "MENTOR") {
    dados.biografia = cadastroForm.biografia;
    dados.cargo = cadastroForm.cargo;
    dados.especialidades = cadastroForm.especialidades;
  }

  await registrarUsuarioApi(dados);

  showToast(
    "Cadastro realizado com sucesso! Agora faça login.",
    "success"
  );

  setShowCadastroModal(false);

  setLoginForm({
    nome: cadastroForm.nome,
    password: "",
  });
} catch (error) {
  showToast(
    error.message || "Erro ao realizar cadastro.",
    "error"
  );
} finally {
  setIsCadastrando(false);
}


};

return ( <div className="min-h-screen bg-slate-100 flex flex-col justify-center py-12 sm:px-6 lg:px-8"> <div className="sm:mx-auto sm:w-full sm:max-w-md text-center"> <div className="mx-auto w-16 h-16 bg-emerald-600 rounded-2xl flex items-center justify-center text-white text-2xl font-bold shadow-lg mb-4"> <i className="fas fa-graduation-cap"></i> </div>


    <h2 className="text-3xl font-extrabold text-slate-900 tracking-tight">
      Mentoria<span className="text-emerald-600">.web</span>
    </h2>
  </div>

  <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
    <div className="bg-white py-8 px-4 shadow-xl sm:rounded-2xl sm:px-10 border border-slate-200">
      <form className="space-y-6" onSubmit={handleLogin}>
        <div>
          <label className="block text-sm font-medium text-slate-700">
            Usuário
          </label>

          <input
            type="text"
            required
            value={loginForm.nome}
            onChange={(e) =>
              setLoginForm({
                ...loginForm,
                nome: e.target.value,
              })
            }
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-slate-700">
            Senha
          </label>

          <input
            type="password"
            required
            value={loginForm.password}
            onChange={(e) =>
              setLoginForm({
                ...loginForm,
                password: e.target.value,
              })
            }
            className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl"
          />
        </div>

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-xl font-semibold transition"
        >
          {isLoading ? "Entrando..." : "Entrar"}
        </button>

        <div className="text-center">
          <p className="text-sm text-slate-500 mb-2">
            Ainda não possui cadastro?
          </p>

          <button
            type="button"
            onClick={abrirCadastro}
            className="text-emerald-600 hover:text-emerald-700 font-semibold"
          >
            Criar uma conta
          </button>
        </div>
      </form>
    </div>
  </div>

  {showCadastroModal && (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
      <div className="bg-white w-full max-w-lg max-h-[90vh] overflow-y-auto rounded-2xl shadow-2xl">
        <div className="p-6 border-b border-slate-200 flex justify-between items-center">
          <div>
            <h3 className="text-2xl font-bold text-slate-900">
              Criar cadastro
            </h3>

            <p className="text-sm text-slate-500 mt-1">
              Crie sua conta no Mentoria.web
            </p>
          </div>

          <button
            type="button"
            onClick={fecharCadastro}
            className="text-slate-400 hover:text-slate-700 text-xl"
          >
            <i className="fas fa-times"></i>
          </button>
        </div>

        <form onSubmit={handleCadastro} className="p-6 space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-700">
              Nome
            </label>

            <input
              type="text"
              name="nome"
              required
              value={cadastroForm.nome}
              onChange={handleCadastroChange}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              E-mail
            </label>

            <input
              type="email"
              name="email"
              required
              value={cadastroForm.email}
              onChange={handleCadastroChange}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Senha
            </label>

            <input
              type="password"
              name="senha"
              required
              value={cadastroForm.senha}
              onChange={handleCadastroChange}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700">
              Telefone
            </label>

            <input
              type="tel"
              name="telefone"
              required
              value={cadastroForm.telefone}
              onChange={handleCadastroChange}
              className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Você será:
            </label>

            <div className="grid grid-cols-2 gap-3">
              <button
                type="button"
                onClick={() =>
                  setCadastroForm((prev) => ({
                    ...prev,
                    role: "CLIENTE",
                  }))
                }
                className={`p-3 rounded-xl border font-semibold transition ${
                  cadastroForm.role === "CLIENTE"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-700 border-slate-300"
                }`}
              >
                <i className="fas fa-user mr-2"></i>
                Cliente
              </button>

              <button
                type="button"
                onClick={() =>
                  setCadastroForm((prev) => ({
                    ...prev,
                    role: "MENTOR",
                  }))
                }
                className={`p-3 rounded-xl border font-semibold transition ${
                  cadastroForm.role === "MENTOR"
                    ? "bg-emerald-600 text-white border-emerald-600"
                    : "bg-white text-slate-700 border-slate-300"
                }`}
              >
                <i className="fas fa-chalkboard-teacher mr-2"></i>
                Mentor
              </button>
            </div>
          </div>

          {cadastroForm.role === "MENTOR" && (
            <>
              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Cargo
                </label>

                <input
                  type="text"
                  name="cargo"
                  required
                  value={cadastroForm.cargo}
                  onChange={handleCadastroChange}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl"
                  placeholder="Ex.: Desenvolvedor Java"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700">
                  Biografia
                </label>

                <textarea
                  name="biografia"
                  required
                  rows="4"
                  value={cadastroForm.biografia}
                  onChange={handleCadastroChange}
                  className="mt-1 block w-full px-3 py-2 border border-slate-300 rounded-xl resize-none"
                  placeholder="Conte um pouco sobre sua experiência..."
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-slate-700 mb-2">
                  Especialidades
                </label>

                {especialidades.length === 0 ? (
                  <p className="text-sm text-slate-500">
                    Nenhuma especialidade encontrada.
                  </p>
                ) : (
                  <div className="grid grid-cols-2 gap-2">
                    {especialidades.map((especialidade) => (
                      <button
                        key={especialidade.id}
                        type="button"
                        onClick={() =>
                          alternarEspecialidade(especialidade.id)
                        }
                        className={`p-3 rounded-xl border text-left transition ${
                          cadastroForm.especialidades.includes(
                            especialidade.id
                          )
                            ? "bg-emerald-50 border-emerald-500 text-emerald-700"
                            : "bg-white border-slate-300 text-slate-700"
                        }`}
                      >
                        <i
                          className={`fas mr-2 ${
                            cadastroForm.especialidades.includes(
                              especialidade.id
                            )
                              ? "fa-check-circle"
                              : "fa-circle"
                          }`}
                        ></i>

                        {especialidade.nome}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="button"
              onClick={fecharCadastro}
              disabled={isCadastrando}
              className="flex-1 py-3 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-semibold"
            >
              Cancelar
            </button>

            <button
              type="submit"
              disabled={isCadastrando}
              className="flex-1 py-3 bg-emerald-600 hover:bg-emerald-700 disabled:bg-slate-400 text-white rounded-xl font-semibold"
            >
              {isCadastrando
                ? "Cadastrando..."
                : "Criar conta"}
            </button>
          </div>
        </form>
      </div>
    </div>
  )}
</div>

);}

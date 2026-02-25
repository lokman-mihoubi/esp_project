'use client';

import { useState } from 'react';
import { register, login } from '@/lib/auth';
import { useRouter } from 'next/navigation';
import { ToastContainer, toast } from 'react-toastify';
import Image from 'next/image';
import 'react-toastify/dist/ReactToastify.css';

const REGIONS = [
  { value: "ouest", label: "Ouest" },
  { value: "centre", label: "Centre" },
  { value: "est", label: "Est" },
  { value: "sud_est", label: "Sud-Est" },
  { value: "sud_ouest", label: "Sud-Ouest" },
  { value: "grand_sud", label: "Grand Sud" },
];

export default function AuthPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [region, setRegion] = useState('centre'); // ✅ default region
  const [isRegister, setIsRegister] = useState(false);
  const router = useRouter();

 const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();

  try {
    // 🔹 Register if needed
    if (isRegister) {
      await register(username, password, region); 
    }

    // 🔹 Login
    const res = await login(username, password);

    // 👉 LOG ROLE IN CONSOLE
    console.log("User role:", res.data.role);

    // 🔐 Store JWT tokens
    localStorage.setItem("access", res.data.access);
    localStorage.setItem("refresh", res.data.refresh);

    // 👤 Store user info
    localStorage.setItem("username", res.data.username);
    localStorage.setItem("role", res.data.role);

    // ✅ Store permissions
    localStorage.setItem("can_view", String(res.data.can_view));
    localStorage.setItem("can_write", String(res.data.can_write));
    localStorage.setItem(
      "can_see_historique",
      String(res.data.can_see_historique)
    );

    // 🌍 Store region
    localStorage.setItem("abrv_str", res.data.abrv_str || "");
    localStorage.setItem("isDG", String(res.data.abrv_str === "DG"));

    toast.success("Connexion réussie !", {
      position: "top-right",
      autoClose: 3000,
    });

    const role = res.data.role?.toLowerCase();

    if (role === "anfu" || role === "ministere" || role === "dgv"
         || role === "dgl" || role === "dgcmr" || role === "dgua" || role === "dgaat" 
    ) {
      router.push("/dashboard1");
    } else {
      router.push("/dashboard");
    }

  } catch (err: any) {
    const errorMessage =
      err.response?.data?.detail ||
      "Nom d’utilisateur ou mot de passe incorrect";

    toast.error(errorMessage, {
      position: "top-right",
      autoClose: 5000,
    });
  }
};




  return (
    <main className="min-h-screen flex flex-col md:flex-row font-sans">
      {/* Partie gauche : Présentation institutionnelle */}
      <div
        className="md:w-1/2 w-full flex flex-col justify-center items-center text-white p-10 relative overflow-hidden"
        style={{
          backgroundImage: "url('/cover-anfu.png')",
          backgroundSize: 'cover',
          backgroundPosition: 'center',
        }}
      >
        <div className="absolute inset-0 bg-[#1C5844]/80"></div>
        <div className="relative z-10 text-center px-6">
          <h1 className="text-4xl font-bold mb-4 uppercase tracking-wide">
            Agence Nationale du Foncier Urbain
          </h1>
          <p className="text-lg opacity-90 font-light">
            Plateforme de gestion du foncier
          </p>
          <a
            href="https://www.anfu.dz"
            target="_blank"
            rel="noopener noreferrer"
            className="mt-8 block text-lg font-medium opacity-90 hover:underline hover:text-white transition-colors duration-200"
          >
            www.anfu.dz
          </a>
        </div>
      </div>

      {/* Partie droite : Authentification */}
      <div className="md:w-1/2 w-full flex flex-col justify-center items-center bg-white p-8 shadow-lg">
        <div className="mb-6 flex justify-center">
          <Image
            src="/anfu3.png"
            alt="Logo ANFU"
            width={220}
            height={220}
          />
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold mb-1 text-gray-700 text-center">
            Bonjour&nbsp;! <span className="text-[#1C5844]">Bienvenue</span>
          </h2>
          <p className="text-gray-500 mb-6 text-center">
            {isRegister
              ? 'Créez votre compte pour accéder à la plateforme'
              : 'Connectez-vous à votre espace de travail'}
          </p>

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <input
              className="p-3 border-b border-gray-300 focus:outline-none focus:border-[#1C5844]"
              placeholder="Nom d’utilisateur"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
            />
            <input
              className="p-3 border-b border-gray-300 focus:outline-none focus:border-[#1C5844]"
              type="password"
              placeholder="Mot de passe"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />

{/*            
            {isRegister && (
              <select
                className="p-3 border-b border-gray-300 focus:outline-none focus:border-[#1C5844]"
                value={region}
                onChange={(e) => setRegion(e.target.value)}
              >
                {REGIONS.map((r) => (
                  <option key={r.value} value={r.value}>
                    {r.label}
                  </option>
                ))}
              </select>
            )} */}

            <div className="flex justify-between text-sm text-gray-500 mt-2">
              <label className="flex items-center gap-1">
                <input type="checkbox" className="accent-[#1C5844]" /> Se souvenir de moi
              </label>
              <a href="#" className="hover:underline text-[#1C5844]">
                Mot de passe oublié ?
              </a>
            </div>

            <button
              className="mt-4 bg-[#1C5844] hover:bg-[#174a38] text-white py-3 rounded-full font-semibold transition"
              type="submit"
            >
              {isRegister ? 'Créer un compte' : 'Se connecter'}
            </button>
          </form>

          {/* <button
            className="mt-6 text-sm text-[#1C5844] hover:underline w-full text-center"
            onClick={() => setIsRegister(!isRegister)}
          >
            {isRegister ? 'Déjà inscrit ? Connectez-vous' : 'Créer un compte'}
          </button> */}
        </div>
      </div>

      <ToastContainer />
    </main>
  );
}

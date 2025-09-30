// import { useEffect, useState } from "react";
// import { getUsers, addUser } from "./api/api";
// import "./App.css";

// export default function App() {
//   const [users, setUsers] = useState<any[]>([]);
//   const [name, setName] = useState("");
//   const [email, setEmail] = useState("");

//   useEffect(() => {
//     getUsers().then(setUsers);
//   }, []);

//   const onSubmit = async () => {
//     if (!name || !email) {
//       alert("이름과 이메일을 모두 입력하세요.");
//       return;
//     }
//     await addUser(name, email);
//     const data = await getUsers();
//     setUsers(data);
//     setName("");
//     setEmail("");
//     alert(`${name}님이 추가되었습니다.`);
//   };

//   return (
//     <div className="app">
//       <div className="card">
//         <h1 className="title">사용자 관리</h1>

//         <section className="section">
//           <h2>사용자 목록</h2>
//           <ul className="user-list">
//             {users.map((u) => (
//               <li key={u.id} className="user-item">
//                 <span className="user-name">{u.name}</span>
//                 <span className="user-email">{u.email}</span>
//               </li>
//             ))}
//           </ul>
//         </section>

//         <section className="section">
//           <h2>새 사용자 추가</h2>
//           <div className="form">
//             <input
//               type="text"
//               placeholder="이름"
//               value={name}
//               onChange={(e) => setName(e.target.value)}
//             />
//             <input
//               type="email"
//               placeholder="이메일"
//               value={email}
//               onChange={(e) => setEmail(e.target.value)}
//             />
//             <button onClick={onSubmit}>추가하기</button>
//           </div>
//         </section>
//       </div>
//     </div>
//   );
// }

import { BrowserRouter, Route, Routes } from "react-router-dom";
import { lazy } from "react";

const Dashboard = lazy(() => import("@/pages/Dashboard"));

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<Dashboard />} />
      </Routes>
    </BrowserRouter>
  );
}

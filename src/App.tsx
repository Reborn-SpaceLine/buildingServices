// import './styles/app.css';
// import { Header } from './components/Header';
// import { Welcome } from './components/welcome';
// import { About } from './components/About';
// import { Services } from './components/Services';
// import { Catalogue } from './components/Catalogue';
// import { Realizations } from './components/Realizations';
// import { Contact } from './components/Contact';
// import { FloatingContact } from './components/FloatingContact'; 
// import { ScrollToTop } from './components/ScrollToTop';

// export default function App() {
//   return (
//     <div className="app">
//       <Header />
//       <Welcome />
//       <About />
//       <Services />
//       <Catalogue />
//       <Realizations />
//       <Contact />
//       <FloatingContact /> 
//       <ScrollToTop />
//     </div>
//   );
// }
     

import { Header } from './components/Header';
import { Welcome } from './components/welcome';
import { About } from './components/About';
import { Services } from './components/Services';
import { Catalogue } from './components/Catalogue';
import { Realizations } from './components/Realizations';
import { Contact } from './components/Contact';
import { FloatingContact } from './components/FloatingContact';
import { ScrollToTop } from './components/ScrollToTop';
import { AdminPanel } from './components/AdminPanel';
import './styles/app.css';

function App() {
  return (
    <div className="app">
      <Header />
      <main>
        <Welcome />
        <About />
        <Services />
        <Catalogue />
        <Realizations />
        <Contact />
      </main>
      <FloatingContact />
      <ScrollToTop />
      <AdminPanel showFab={true} />
    </div>
  );
}

export default App;
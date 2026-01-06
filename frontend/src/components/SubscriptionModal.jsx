import { useState, useEffect } from 'react';
import { useAppContext } from '../context/AppContext';

const SubscriptionModal = ({ onClose, onSuccess }) => {
  const { pushToast } = useAppContext();
  const [step, setStep] = useState('offer'); // offer, payment, processing, success
  const [cardData, setCardData] = useState({ number: '', expiry: '', cvv: '', name: '' });
  const [loading, setLoading] = useState(false);

  // Format card number with spaces
  const handleCardNumber = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 16);
    val = val.replace(/(\d{4})/g, '$1 ').trim();
    setCardData({ ...cardData, number: val });
  };

  const handleExpiry = (e) => {
    let val = e.target.value.replace(/\D/g, '').substring(0, 4);
    if (val.length >= 2) val = val.substring(0, 2) + '/' + val.substring(2);
    setCardData({ ...cardData, expiry: val });
  };

  const handlePayment = async (e) => {
    e.preventDefault();
    if (cardData.number.replace(/\s/g, '').length < 16 || cardData.expiry.length < 5 || cardData.cvv.length < 3) {
      pushToast({ title: 'Error', message: 'Por favor completa los datos de la tarjeta.', type: 'alert' });
      return;
    }

    setStep('processing');
    setLoading(true);

    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      setStep('success');
      pushToast({ title: '¡Éxito!', message: 'Suscripción Premium activada.', type: 'success' });
      if (onSuccess) onSuccess();
    }, 2000);
  };

  if (step === 'success') {
    return (
      <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[70] p-4 animate-in fade-in duration-300">
        <div className="bg-slate-900 border border-emerald-500/30 text-slate-100 rounded-2xl w-full max-w-md p-8 text-center relative overflow-hidden">
          <div className="absolute inset-0 bg-emerald-500/10 animate-pulse"></div>
          <div className="relative z-10">
            <div className="w-20 h-20 bg-emerald-500 rounded-full flex items-center justify-center mx-auto mb-6 shadow-lg shadow-emerald-500/40">
              <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-10 h-10 text-white">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 12.75l6 6 9-13.5" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold text-white mb-2">¡Bienvenido a Premium!</h2>
            <p className="text-slate-400 mb-8">Ahora tienes acceso ilimitado a todos los recursos, exámenes y tutorías.</p>
            <button
              onClick={onClose}
              className="w-full py-3 bg-white text-slate-900 font-bold rounded-xl hover:bg-slate-200 transition-colors"
            >
              Comenzar a explorar
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 bg-black/80 backdrop-blur-sm flex items-center justify-center z-[60] p-4 animate-in fade-in zoom-in-95 duration-200">
      <div className="bg-slate-900 border border-white/10 text-slate-100 rounded-2xl w-full max-w-lg p-0 relative overflow-hidden shadow-2xl">

        {/* Header Image/Gradient */}
        <div className="h-32 bg-gradient-to-r from-primary to-secondary relative overflow-hidden">
          <div className="absolute inset-0 bg-black/20"></div>
          <button
            onClick={onClose}
            className="absolute top-4 right-4 bg-black/20 hover:bg-black/40 text-white rounded-full p-2 transition-colors z-20"
          >
            <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={2} stroke="currentColor" className="w-5 h-5">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
          <div className="absolute bottom-4 left-6 z-10">
            <div className="flex items-center gap-2 mb-1">
              <span className="text-2xl">💎</span>
              <h3 className="text-2xl font-bold text-white">Estudia-Pro Premium</h3>
            </div>
            <p className="text-white/80 text-sm">Desbloquea tu potencial al máximo</p>
          </div>
        </div>

        <div className="p-6">
          {step === 'offer' ? (
            <div className="space-y-6">
              <div className="space-y-3">
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-primary/20 rounded-lg text-primary">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M12 6.042A8.967 8.967 0 006 3.75c-1.052 0-2.062.18-3 .512v14.25A8.987 8.987 0 016 18c2.305 0 4.408.867 6 2.292m0-14.25a8.966 8.966 0 016-2.292c1.052 0 2.062.18 3 .512v14.25A8.987 8.987 0 0018 18a8.967 8.967 0 00-6 2.292m0-14.25v14.25" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Acceso a todo el contenido</h4>
                    <p className="text-sm text-slate-400">Descarga ilimitada de PDFs, guías y recursos de la comunidad.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-purple-500/20 rounded-lg text-purple-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M2.036 12.322a1.012 1.012 0 010-.639C3.423 7.51 7.36 4.5 12 4.5c4.638 0 8.573 3.007 9.963 7.178.07.207.07.431 0 .639C20.577 16.49 16.64 19.5 12 19.5c-4.638 0-8.573-3.007-9.963-7.178z" /><path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white">Vistas previas completas</h4>
                    <p className="text-sm text-slate-400">Visualiza documentos completos antes de descargarlos.</p>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <div className="p-2 bg-emerald-500/20 rounded-lg text-emerald-400">
                    <svg xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" strokeWidth={1.5} stroke="currentColor" className="w-6 h-6"><path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" /></svg>
                  </div>
                  <div>
                    <h4 className="font-bold text-white"> insignia Premium</h4>
                    <p className="text-sm text-slate-400">Destaca en la comunidad con tu insignia de diamante.</p>
                  </div>
                </div>
              </div>

              <div className="p-4 bg-slate-800 rounded-xl border border-white/5 flex items-center justify-between">
                <div>
                  <p className="text-sm text-slate-400">Suscripción Mensual</p>
                  <p className="text-2xl font-bold text-white">$49.00 <span className="text-sm font-normal text-slate-500">MXN</span></p>
                </div>
                <div className="text-right">
                  <p className="text-xs text-emerald-400 font-medium">✨ Cancelación en cualquier momento</p>
                </div>
              </div>

              <button
                onClick={() => setStep('payment')}
                className="w-full py-3 bg-primary hover:bg-primary-light text-white font-bold rounded-xl shadow-lg shadow-primary/20 transition-all transform active:scale-95"
              >
                Suscribirme Ahora
              </button>
            </div>
          ) : step === 'payment' || step === 'processing' ? (
            <form onSubmit={handlePayment} className="space-y-5">
              <div className="flex items-center justify-between mb-2">
                <button type="button" onClick={() => setStep('offer')} className="text-sm text-slate-400 hover:text-white flex items-center gap-1">
                  ← Volver
                </button>
                <span className="text-xs font-mono text-slate-500">SECURE PAYMENT</span>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-xs uppercase text-slate-400 mb-1 font-semibold">Nombre en la tarjeta</label>
                  <input
                    type="text"
                    placeholder="Titular de la tarjeta"
                    className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all"
                    value={cardData.name}
                    onChange={(e) => setCardData({ ...cardData, name: e.target.value.toUpperCase() })}
                    required
                  />
                </div>

                <div>
                  <label className="block text-xs uppercase text-slate-400 mb-1 font-semibold">Número de tarjeta</label>
                  <div className="relative">
                    <input
                      type="text"
                      placeholder="0000 0000 0000 0000"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all pl-12 font-mono"
                      value={cardData.number}
                      onChange={handleCardNumber}
                      maxLength={19}
                      required
                    />
                    <svg className="absolute left-3 top-3.5 w-6 h-6 text-slate-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                    </svg>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs uppercase text-slate-400 mb-1 font-semibold">Expiración</label>
                    <input
                      type="text"
                      placeholder="MM/YY"
                      className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-center font-mono"
                      value={cardData.expiry}
                      onChange={handleExpiry}
                      maxLength={5}
                      required
                    />
                  </div>
                  <div>
                    <label className="block text-xs uppercase text-slate-400 mb-1 font-semibold">CVV</label>
                    <div className="relative">
                      <input
                        type="password"
                        placeholder="123"
                        className="w-full bg-slate-800 border border-slate-700 rounded-lg p-3 text-white focus:ring-2 focus:ring-primary focus:border-transparent outline-none transition-all text-center font-mono z-10 relative"
                        value={cardData.cvv}
                        onChange={(e) => setCardData({ ...cardData, cvv: e.target.value.replace(/\D/g, '').substring(0, 4) })}
                        maxLength={4}
                        required
                      />
                    </div>
                  </div>
                </div>
              </div>

              {step === 'processing' ? (
                <button disabled className="w-full py-3 bg-slate-700 text-slate-300 font-bold rounded-xl flex items-center justify-center gap-2 cursor-wait">
                  <svg className="animate-spin h-5 w-5 text-current" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Procesando pago...
                </button>
              ) : (
                <button
                  type="submit"
                  className="w-full py-3 bg-emerald-600 hover:bg-emerald-500 text-white font-bold rounded-xl shadow-lg shadow-emerald-500/20 transition-all"
                >
                  Pagar $49.00 MXN
                </button>
              )}

              <p className="text-center text-[10px] text-slate-500 mt-2">
                Al hacer clic en "Pagar", confirmas que esta es una simulación de compra y no se realizará ningún cargo real.
              </p>
            </form>
          ) : null}
        </div>
      </div>
    </div>
  );
};

export default SubscriptionModal;

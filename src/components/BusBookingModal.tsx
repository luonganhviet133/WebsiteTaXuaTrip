import { ONLINE_PAYMENT_ENABLED } from '../config/features';
import { DEPOSIT_PERCENT, depositFor } from '../config/payment.ts';
import React, { useState } from 'react';
import { 
  X, 
  Bus, 
  MapPin, 
  Clock, 
  Armchair, 
  Check, 
  AlertCircle, 
  Sparkles, 
  Phone, 
  ArrowRight,
  ShieldCheck,
  Calendar,
  Bike,
  Layers,
  UploadCloud,
  Image as ImageIcon
} from 'lucide-react';
import { BusTrip, RouteStop, Booking, PaymentProof } from '../types/index.ts';
import { 
  formatVND, 
  estimatePickupTime, 
  calculateMemberPoints,
  calculateMotorbikeRentalCost,
  calculateBusAndMotorbikeCombo,
  generateVehicleSeatLayout
} from '../utils/rules.ts';

interface BusBookingModalProps {
  trips: BusTrip[];
  initialTripId?: string;
  initialEnableMotorbikeCombo?: boolean;
  onClose: () => void;
  onBookSuccess: (booking: Booking) => void;
}

export const BusBookingModal: React.FC<BusBookingModalProps> = ({
  trips,
  initialTripId,
  initialEnableMotorbikeCombo = false,
  onClose,
  onBookSuccess
}) => {
  const initialTrip =
    (initialTripId ? trips.find((t) => t.id === initialTripId) : undefined) || trips[0];
  const [selectedTrip, setSelectedTrip] = useState<BusTrip>(initialTrip);
  const [pickupStopId, setPickupStopId] = useState<string>(
    initialTrip.stops.find(s => s.type === 'pickup' || s.type === 'both')?.id || initialTrip.stops[0].id
  );
  const [dropoffStopId, setDropoffStopId] = useState<string>(
    initialTrip.stops.filter(s => s.type === 'dropoff' || s.type === 'both').slice(-1)[0]?.id || initialTrip.stops[initialTrip.stops.length - 1].id
  );
  const [selectedSeats, setSelectedSeats] = useState<string[]>(['A01']);
  const [travelDate, setTravelDate] = useState('2026-11-20');
  const [passengerName, setPassengerName] = useState('');
  const [passengerPhone, setPassengerPhone] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // --- COMBO THUÊ XE MÁY ĐI KÈM ---
  const [enableMotorbikeCombo, setEnableMotorbikeCombo] = useState(initialEnableMotorbikeCombo);
  const [bikeCount, setBikeCount] = useState(1);
  const [bikePickupDate, setBikePickupDate] = useState('2026-11-20');
  const [bikePickupTime, setBikePickupTime] = useState('08:00');
  const [bikeReturnDate, setBikeReturnDate] = useState('2026-11-21');
  const [bikeReturnTime, setBikeReturnTime] = useState('11:30'); // Trước 12h trưa = nửa ngày!

  // --- PAYMENT PROOF UPLOAD ---
  const [paymentProofUrl, setPaymentProofUrl] = useState<string | null>(null);

  // Active stops
  const currentPickup = selectedTrip.stops.find(s => s.id === pickupStopId) || selectedTrip.stops[0];
  const currentDropoff = selectedTrip.stops.find(s => s.id === dropoffStopId) || selectedTrip.stops[selectedTrip.stops.length - 1];

  // Estimated pickup time
  const estimatedPickup = estimatePickupTime(selectedTrip.departureTime, currentPickup.minuteOffset);
  const estimatedArrival = estimatePickupTime(selectedTrip.departureTime, currentDropoff.minuteOffset);

  // Dynamic Fare calculation
  const singleSeatFare = Math.max(250000, selectedTrip.baseFare + currentPickup.fareModifier + currentDropoff.fareModifier);
  const totalBusAmount = singleSeatFare * selectedSeats.length;

  // Tính tiền thuê xe máy theo quy tắc mốc 12h trưa
  const motorbikeCalc = calculateMotorbikeRentalCost(
    bikePickupDate,
    bikePickupTime,
    bikeReturnDate,
    bikeReturnTime,
    150000,
    bikeCount
  );

  // Tính combo tổng hợp & chiết khấu
  const comboResult = calculateBusAndMotorbikeCombo(
    singleSeatFare,
    selectedSeats.length,
    enableMotorbikeCombo ? motorbikeCalc.totalCost : 0,
    10
  );

  const pointsEarned = calculateMemberPoints(comboResult.finalTotal);

  // Sơ đồ ghế trực quan theo loại xe
  const seatLayout = generateVehicleSeatLayout(
    selectedTrip.busType,
    selectedTrip.totalSeats,
    selectedTrip.bookedSeats.map((s) => `A${String(s).padStart(2, '0')}`)
  );

  const toggleSeat = (seatCode: string, isBooked: boolean) => {
    if (isBooked) return;
    if (selectedSeats.includes(seatCode)) {
      if (selectedSeats.length > 1) {
        setSelectedSeats(selectedSeats.filter(s => s !== seatCode));
      }
    } else {
      setSelectedSeats([...selectedSeats, seatCode]);
    }
  };

  const handleTripChange = (trip: BusTrip) => {
    setSelectedTrip(trip);
    const pStop = trip.stops.find(s => s.type === 'pickup' || s.type === 'both');
    const dStop = trip.stops.filter(s => s.type === 'dropoff' || s.type === 'both').slice(-1)[0];
    if (pStop) setPickupStopId(pStop.id);
    if (dStop) setDropoffStopId(dStop.id);
    setSelectedSeats(['A01']);
  };

  const handleDemoUploadProof = () => {
    // Tạo giả lập ảnh biên lai chuyển khoản ngân hàng
    setPaymentProofUrl('https://images.unsplash.com/photo-1554224155-8d04cb21cd6c?w=600&auto=format&fit=crop&q=80');
  };

  const handleConfirmBus = (e: React.FormEvent) => {
    e.preventDefault();
    if (!passengerName.trim() || !passengerPhone.trim()) {
      alert('Vui lòng điền họ tên và số điện thoại liên hệ nhận vé!');
      return;
    }
    if (selectedSeats.length === 0) {
      alert('Vui lòng chọn ít nhất 1 ghế ngồi!');
      return;
    }

    setIsSubmitting(true);
    setTimeout(() => {
      const depositAmount = depositFor(comboResult.finalTotal);
      const proof: PaymentProof | undefined = paymentProofUrl
        ? {
            imageUrl: paymentProofUrl,
            amountPaid: depositAmount,
            amountTransferred: depositAmount,
            uploadedAt: new Date().toISOString(),
            note: `Chuyển khoản cọc ${DEPOSIT_PERCENT}% giữ vé & xe`
          }
        : undefined;

      const newBooking: Booking = {
        id: `VE-TX-${Date.now().toString().slice(-4)}`,
        listingId: selectedTrip.id,
        listingTitle: `${selectedTrip.operatorName} (${selectedTrip.busType})`,
        category: 'bus',
        guestName: passengerName,
        guestPhone: passengerPhone,
        checkInDate: travelDate,
        checkOutDate: enableMotorbikeCombo ? bikeReturnDate : travelDate,
        guestsCount: selectedSeats.length,
        seatNumbers: selectedSeats.map((_, i) => i + 1),
        pickupStop: `${currentPickup.name} (~${estimatedPickup})`,
        dropoffStop: `${currentDropoff.name} (~${estimatedArrival})`,
        totalAmount: comboResult.finalTotal,
        discountApplied: comboResult.discountAmount,
        status: 'confirmed',
        paymentStatus: paymentProofUrl ? 'proof_uploaded' : 'unpaid',
        paymentProof: proof,
        qrCodeUrl: `https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=BUS-TX-${Date.now()}`,
        platformFee: 50000,
        feeCharged: false,
        notes: enableMotorbikeCombo
          ? `Combo xe khách + thuê ${bikeCount} xe máy. Nhận: ${bikePickupDate} ${bikePickupTime}, Trả: ${bikeReturnDate} ${bikeReturnTime}. Điểm đón: ${currentPickup.name}.`
          : `Điểm đón: ${currentPickup.name}. ${currentPickup.pickupNote || ''}`,
        createdAt: new Date().toISOString().replace('T', ' ').slice(0, 16)
      };

      setIsSubmitting(false);
      onBookSuccess(newBooking);
    }, 600);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto bg-slate-950/85 backdrop-blur-md flex items-center justify-center p-3 sm:p-6 animate-fade-in text-white">
      <div className="bg-slate-900 border border-slate-700 rounded-3xl max-w-5xl w-full max-h-[94vh] overflow-y-auto shadow-2xl relative">
        {/* Header */}
        <div className="sticky top-0 bg-slate-900/95 backdrop-blur-md border-b border-slate-800 p-5 flex items-center justify-between z-10">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-sky-600/20 text-sky-400 flex items-center justify-center border border-sky-500/30">
              <Bus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black text-white">
                Đặt Vé Xe Khách & Combo Thuê Xe Máy Tà Xùa
              </h2>
              <p className="text-xs text-slate-400">
                Sơ đồ xe 2 tầng / Limousine VIP • Combo xe máy trả trước 12h trưa tính nửa ngày
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="w-9 h-9 rounded-full bg-slate-800 hover:bg-slate-700 flex items-center justify-center text-slate-300 hover:text-white transition-colors cursor-pointer"
            aria-label="Đóng cửa sổ"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="p-6 grid grid-cols-1 lg:grid-cols-12 gap-8">
          {/* Left Column: Trip Selector, Route Stops & Seat Map */}
          <div className="lg:col-span-7 space-y-6">
            {/* Step 1: Select Operator */}
            <div>
              <label className="block text-xs font-bold uppercase tracking-wider text-teal-400 mb-2">
                1. Chọn Chuyến Xe & Dòng Xe
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5">
                {trips.map((trip) => {
                  const isSelected = trip.id === selectedTrip.id;
                  return (
                    <button
                      key={trip.id}
                      type="button"
                      onClick={() => handleTripChange(trip)}
                      className={`text-left p-3 rounded-2xl border transition-all cursor-pointer ${
                        isSelected
                          ? 'bg-sky-950/50 border-sky-500 shadow-md ring-1 ring-sky-500'
                          : 'bg-slate-800/80 border-slate-700 hover:border-slate-600'
                      }`}
                    >
                      <div className="flex items-center justify-between text-xs font-bold text-white mb-1">
                        <span className="text-sky-300">{trip.departureTime}</span>
                        <span className="text-xs bg-slate-900 px-1.5 py-0.5 rounded text-slate-300">
                          {trip.busType.split(' ')[0]}
                        </span>
                      </div>
                      <div className="text-xs font-semibold text-slate-200 line-clamp-1">
                        {trip.operatorName}
                      </div>
                      <div className="text-xs text-teal-400 font-bold mt-1">
                        {formatVND(trip.baseFare)}
                      </div>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Step 2: Route Stops & Estimated Pickup */}
            <div className="bg-slate-800/70 border border-slate-700 rounded-2xl p-4 space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-xs font-bold uppercase tracking-wider text-teal-400">
                  2. Điểm Đón & Điểm Trả Trên Tuyến
                </span>
                <span className="text-xs text-sky-300 flex items-center gap-1 font-bold">
                  <Clock className="w-3.5 h-3.5" />
                  Đón lúc: {estimatedPickup}
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Điểm đón (Lên xe)
                  </label>
                  <select
                    value={pickupStopId}
                    onChange={(e) => setPickupStopId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {selectedTrip.stops
                      .filter(s => s.type === 'pickup' || s.type === 'both')
                      .map((stop) => (
                        <option key={stop.id} value={stop.id}>
                          {stop.name} (+{stop.minuteOffset} phút)
                        </option>
                      ))}
                  </select>
                  {currentPickup.pickupNote && (
                    <p className="text-xs text-amber-300 mt-1">
                      * {currentPickup.pickupNote}
                    </p>
                  )}
                </div>

                <div>
                  <label className="block text-xs font-medium text-slate-300 mb-1">
                    Điểm trả (Xuống xe)
                  </label>
                  <select
                    value={dropoffStopId}
                    onChange={(e) => setDropoffStopId(e.target.value)}
                    className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-sky-500"
                  >
                    {selectedTrip.stops
                      .filter(s => s.type === 'dropoff' || s.type === 'both')
                      .map((stop) => (
                        <option key={stop.id} value={stop.id}>
                          {stop.name} (~{estimatePickupTime(selectedTrip.departureTime, stop.minuteOffset)})
                        </option>
                      ))}
                  </select>
                </div>
              </div>

              <div className="text-xs bg-slate-900/80 p-3 rounded-xl border border-slate-750 flex items-center justify-between text-slate-300">
                <div className="flex items-center gap-2">
                  <MapPin className="w-4 h-4 text-rose-400" />
                  <span>{currentPickup.name} ➔ {currentDropoff.name}</span>
                </div>
                <div className="text-teal-400 font-bold">
                  {formatVND(singleSeatFare)}/vé
                </div>
              </div>
            </div>

            {/* Step 3: Sơ Đồ Chọn Ghế Ngồi (Hỗ trợ 2 Tầng & Limousine) */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <label className="text-xs font-bold uppercase tracking-wider text-teal-400 flex items-center gap-1.5">
                  <Layers className="w-4 h-4" />
                  <span>3. Sơ Đồ Chọn Chỗ Ngồi ({selectedTrip.busType})</span>
                </label>
                <div className="flex items-center gap-3 text-xs text-slate-400">
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-slate-700 inline-block" /> Trống
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-teal-500 inline-block" /> Đang chọn
                  </span>
                  <span className="flex items-center gap-1">
                    <span className="w-3 h-3 rounded bg-rose-600/50 inline-block" /> Đã đặt
                  </span>
                </div>
              </div>

              <div className="bg-slate-800/80 border border-slate-700 rounded-2xl p-4 space-y-4">
                {seatLayout.isTwoFloors ? (
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Tầng 1 */}
                    <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-750">
                      <div className="text-xs font-bold text-sky-300 mb-2.5 flex justify-between">
                        <span>TẦNG 1 (DƯỚI)</span>
                        <span className="text-xs text-slate-400">Êm ái, ít rung lắc</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {seatLayout.floor1.map((seat) => {
                          const isChosen = selectedSeats.includes(seat.code);
                          return (
                            <button
                              key={seat.code}
                              type="button"
                              disabled={seat.isBooked}
                              onClick={() => toggleSeat(seat.code, seat.isBooked)}
                              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                                seat.isBooked
                                  ? 'bg-rose-950/40 border border-rose-800/40 text-rose-500 opacity-60 cursor-not-allowed'
                                  : isChosen
                                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-105'
                                  : 'bg-slate-800 border border-slate-700 text-slate-200 hover:border-slate-500'
                              }`}
                            >
                              <Armchair className="w-3.5 h-3.5 mb-0.5" />
                              <span>{seat.code}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>

                    {/* Tầng 2 */}
                    <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-750">
                      <div className="text-xs font-bold text-amber-300 mb-2.5 flex justify-between">
                        <span>TẦNG 2 (TRÊN)</span>
                        <span className="text-xs text-slate-400">Ngắm đèo thoáng đãng</span>
                      </div>
                      <div className="grid grid-cols-4 gap-2">
                        {seatLayout.floor2.map((seat) => {
                          const isChosen = selectedSeats.includes(seat.code);
                          return (
                            <button
                              key={seat.code}
                              type="button"
                              disabled={seat.isBooked}
                              onClick={() => toggleSeat(seat.code, seat.isBooked)}
                              className={`py-2 px-1 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                                seat.isBooked
                                  ? 'bg-rose-950/40 border border-rose-800/40 text-rose-500 opacity-60 cursor-not-allowed'
                                  : isChosen
                                  ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-105'
                                  : 'bg-slate-800 border border-slate-700 text-slate-200 hover:border-slate-500'
                              }`}
                            >
                              <Armchair className="w-3.5 h-3.5 mb-0.5" />
                              <span>{seat.code}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                ) : (
                  /* Xe 1 tầng Limousine */
                  <div className="max-w-md mx-auto">
                    <div className="text-center text-xs text-slate-400 pb-2 mb-3 border-b border-slate-700">
                      🚗 Đầu xe / Ghế bác tài
                    </div>
                    <div className="grid grid-cols-3 gap-2.5">
                      {seatLayout.floor1.map((seat) => {
                        const isChosen = selectedSeats.includes(seat.code);
                        return (
                          <button
                            key={seat.code}
                            type="button"
                            disabled={seat.isBooked}
                            onClick={() => toggleSeat(seat.code, seat.isBooked)}
                            className={`py-3 px-2 rounded-xl text-xs font-bold flex flex-col items-center justify-center transition-all cursor-pointer ${
                              seat.isBooked
                                ? 'bg-rose-950/40 border border-rose-800/40 text-rose-500 opacity-60 cursor-not-allowed'
                                : isChosen
                                ? 'bg-teal-500 text-white shadow-lg shadow-teal-500/30 scale-105'
                                : seat.isVip
                                ? 'bg-amber-950/30 border border-amber-500/50 text-amber-300'
                                : 'bg-slate-900 border border-slate-700 text-slate-200 hover:border-slate-500'
                            }`}
                          >
                            <Armchair className="w-4 h-4 mb-0.5" />
                            <span>{seat.code}</span>
                            {seat.isVip && <span className="text-xs text-amber-400 font-normal">VIP</span>}
                          </button>
                        );
                      })}
                    </div>
                  </div>
                )}

                <div className="text-center text-xs text-teal-300 font-semibold pt-1">
                  Đang chọn: <strong>{selectedSeats.join(', ')}</strong> ({selectedSeats.length} chỗ)
                </div>
              </div>
            </div>

            {/* Step 4: COMBO THUÊ XE MÁY ĐI KÈM (THEO YÊU CẦU ĐỐI TÁC 1) */}
            <div className="bg-gradient-to-r from-sky-950/40 via-teal-950/30 to-slate-900 border border-sky-500/40 rounded-2xl p-4 space-y-3">
              <div className="flex items-center justify-between">
                <label className="flex items-center gap-2 text-xs font-black text-sky-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={enableMotorbikeCombo}
                    onChange={(e) => setEnableMotorbikeCombo(e.target.checked)}
                    className="w-4 h-4 rounded text-teal-500"
                  />
                  <Bike className="w-4 h-4 text-sky-400" />
                  <span>ĐẶT COMBO THUÊ XE MÁY ĐI KÈM (GIẢM 10% TỔNG TIỀN)</span>
                </label>
                <span className="text-xs bg-sky-500/20 text-sky-300 font-bold px-2 py-0.5 rounded-full border border-sky-500/30">
                  Nhận xe ngay khi xuống xe khách
                </span>
              </div>

              {enableMotorbikeCombo && (
                <div className="space-y-3 pt-2 border-t border-slate-800 text-xs">
                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Số lượng xe máy</label>
                      <select
                        value={bikeCount}
                        onChange={(e) => setBikeCount(Number(e.target.value))}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      >
                        <option value="1">1 xe máy (150.000đ/ngày)</option>
                        <option value="2">2 xe máy</option>
                        <option value="3">3 xe máy</option>
                      </select>
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Ngày nhận xe</label>
                      <input
                        type="date"
                        value={bikePickupDate}
                        onChange={(e) => setBikePickupDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Giờ nhận xe</label>
                      <input
                        type="time"
                        value={bikePickupTime}
                        onChange={(e) => setBikePickupTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    <div>
                      <label className="text-xs text-slate-300 block mb-1">Ngày trả xe</label>
                      <input
                        type="date"
                        value={bikeReturnDate}
                        onChange={(e) => setBikeReturnDate(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>

                    <div>
                      <label className="text-xs text-slate-300 block mb-1">
                        Giờ trả xe (Mốc trước 12h trưa)
                      </label>
                      <input
                        type="time"
                        value={bikeReturnTime}
                        onChange={(e) => setBikeReturnTime(e.target.value)}
                        className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-white"
                      />
                    </div>
                  </div>

                  {/* Giải thích cách tính tiền theo mốc 12h trưa */}
                  <div className="bg-slate-900/90 p-3 rounded-xl border border-slate-750 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
                    <div>
                      <span className="text-slate-400 block text-xs">Công thức tính ngày thuê xe:</span>
                      <span className="text-sky-300 font-bold">
                        {motorbikeCalc.breakdown}
                      </span>
                    </div>
                    {motorbikeCalc.isHalfDayReturn && (
                      <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-1 rounded-lg font-bold border border-emerald-500/30 shrink-0">
                        ✓ Trả trước 12:00: Tính nửa ngày
                      </span>
                    )}
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column: Passenger Info, Payment Proof & Checkout */}
          <div className="lg:col-span-5 bg-slate-850 border border-slate-750 rounded-3xl p-6 flex flex-col justify-between space-y-5">
            <form onSubmit={handleConfirmBus} className="space-y-4">
              <div>
                <h3 className="text-base font-extrabold text-white mb-1">
                  Thông Tin Vé Đi Xe & Thanh Toán
                </h3>
                <p className="text-xs text-slate-400">
                  Nhà xe gọi điện xác nhận điểm đón trước giờ khởi hành 30 phút
                </p>
              </div>

              {/* Date */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Ngày khởi hành xe *
                </label>
                <input
                  type="date"
                  value={travelDate}
                  onChange={(e) => setTravelDate(e.target.value)}
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2 text-xs text-white focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              {/* Name & Phone */}
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Họ tên hành khách đại diện *
                </label>
                <input
                  type="text"
                  value={passengerName}
                  onChange={(e) => setPassengerName(e.target.value)}
                  placeholder="Ví dụ: Hoàng Minh Long"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1">
                  Số điện thoại đón xe & Zalo *
                </label>
                <input
                  type="tel"
                  value={passengerPhone}
                  onChange={(e) => setPassengerPhone(e.target.value)}
                  placeholder="Ví dụ: 0987 654 321"
                  className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3.5 py-2.5 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-teal-500"
                  required
                />
              </div>

              {/* Nộp biên lai: tắt cho tới khi có thanh toán thật (N06, quyết định D03) */}
              {ONLINE_PAYMENT_ENABLED && (
              <div className="bg-slate-900 p-3.5 rounded-2xl border border-slate-750 space-y-2">
                <div className="flex items-center justify-between">
                  <span className="text-xs font-bold text-slate-200 flex items-center gap-1.5">
                    <ShieldCheck className="w-4 h-4 text-emerald-400" />
                    <span>Nộp Ảnh Biên Lai Chuyển Khoản (Cọc {DEPOSIT_PERCENT}%)</span>
                  </span>
                  <span className="text-xs text-slate-400">Tùy chọn</span>
                </div>
                <p className="text-xs text-slate-400">
                  Tải ảnh chuyển khoản giúp nhà xe xác nhận giữ chỗ ưu tiên và làm bằng chứng đối soát minh bạch.
                </p>

                {paymentProofUrl ? (
                  <div className="flex items-center justify-between bg-slate-800 p-2.5 rounded-xl border border-emerald-500/30">
                    <div className="flex items-center gap-2 text-xs text-emerald-300 font-bold">
                      <ImageIcon className="w-4 h-4" />
                      <span>Đã gắn ảnh biên lai chuyển khoản</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => setPaymentProofUrl(null)}
                      className="text-xs text-rose-400 hover:underline cursor-pointer"
                    >
                      Xóa
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={handleDemoUploadProof}
                    className="w-full py-2 px-3 border border-dashed border-teal-500/50 hover:border-teal-400 rounded-xl text-xs font-semibold text-teal-300 hover:bg-teal-500/10 flex items-center justify-center gap-2 transition-all cursor-pointer"
                  >
                    <UploadCloud className="w-4 h-4" />
                    <span>Tải Lên Ảnh Biên Lai Chuyển Khoản Cọc</span>
                  </button>
                )}
              </div>
              )}

              {/* Summary breakdown */}
              <div className="bg-slate-900/90 rounded-2xl p-4 border border-slate-750 space-y-2 text-xs">
                <div className="flex justify-between text-slate-400">
                  <span>Tiền vé xe khách:</span>
                  <span className="text-white font-medium">{formatVND(comboResult.busTotal)}</span>
                </div>
                {enableMotorbikeCombo && (
                  <div className="flex justify-between text-slate-400">
                    <span>Thuê xe máy ({motorbikeCalc.billableDays} ngày):</span>
                    <span className="text-white font-medium">{formatVND(comboResult.motorbikeTotal)}</span>
                  </div>
                )}
                {comboResult.discountAmount > 0 && (
                  <div className="flex justify-between text-emerald-400 font-bold">
                    <span>Ưu đãi Combo:</span>
                    <span>-{formatVND(comboResult.discountAmount)}</span>
                  </div>
                )}
                <div className="flex justify-between text-slate-400">
                  <span>Tích điểm thành viên:</span>
                  <span className="text-amber-300 font-semibold">+{pointsEarned} Điểm Mây</span>
                </div>
                <div className="flex justify-between text-sm font-bold pt-2 border-t border-slate-800">
                  <span className="text-white">Tổng thanh toán:</span>
                  <span className="text-teal-400 text-lg">{formatVND(comboResult.finalTotal)}</span>
                </div>
                <div className="text-xs text-slate-400 text-right">
                  Cọc trước {DEPOSIT_PERCENT}%: <strong className="text-amber-300">{formatVND(depositFor(comboResult.finalTotal))}</strong>
                </div>
              </div>

              {/* Submit CTA */}
              <button
                type="submit"
                disabled={isSubmitting}
                className="w-full bg-gradient-to-r from-sky-500 via-teal-500 to-emerald-600 hover:from-sky-600 hover:to-emerald-700 text-white font-extrabold py-3.5 rounded-2xl text-sm transition-all shadow-xl shadow-sky-500/20 active:scale-98 flex items-center justify-center gap-2 cursor-pointer"
              >
                {isSubmitting ? (
                  <span>Đang xử lý đơn vé...</span>
                ) : (
                  <>
                    <span>Xác Nhận Giữ Chỗ & Nhận Mã Vé</span>
                    <ArrowRight className="w-4 h-4" />
                  </>
                )}
              </button>

              <div className="text-xs text-center text-slate-400">
                📞 Hotline nhà xe: <a href={`tel:${selectedTrip.phone.replace(/\s+/g, '')}`} className="text-sky-400 font-bold">{selectedTrip.phone}</a>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

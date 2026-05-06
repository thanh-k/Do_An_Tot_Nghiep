import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { motion } from "framer-motion";
import {
  Mail,
  Phone,
  MapPin,
  Send,
  MessageSquare,
  Facebook,
  Instagram,
  Youtube,
  Globe,
} from "lucide-react";
import useAuth from "@/hooks/useAuth";
import contactService from "@/services/contactService";

const fadeInUp = {
  initial: { opacity: 0, y: 30 },
  whileInView: { opacity: 1, y: 0 },
  viewport: { once: true },
  transition: { duration: 0.6 },
};

const initialForm = {
  fullName: "",
  phone: "",
  email: "",
  message: "",
};

const initialErrors = {
  fullName: "",
  phone: "",
  email: "",
  message: "",
};

function ContactPage() {
  const { currentUser } = useAuth();
  const [form, setForm] = useState(initialForm);
  const [errors, setErrors] = useState(initialErrors);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!currentUser) return;

    setForm((prev) => ({
      ...prev,
      fullName: currentUser.fullName || currentUser.name || "",
      phone: currentUser.phone || "",
      email: currentUser.email || "",
    }));
  }, [currentUser]);

  const updateField = (field, value) => {
    setForm((prev) => ({ ...prev, [field]: value }));
    setErrors((prev) => ({ ...prev, [field]: "" }));
  };

  const mapBackendErrorToField = (message) => {
    const msg = (message || "").toLowerCase();

    if (msg.includes("tên") || msg.includes("họ và tên")) {
      return { field: "fullName", message };
    }
    if (msg.includes("điện thoại") || msg.includes("đầu số") || msg.includes("số điện thoại")) {
      return { field: "phone", message };
    }
    if (msg.includes("email")) {
      return { field: "email", message };
    }
    if (msg.includes("nội dung")) {
      return { field: "message", message };
    }

    return null;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrors(initialErrors);
    setSubmitting(true);

    try {
      await contactService.create(form);

      toast.success("Cảm ơn bạn! Tin nhắn đã được gửi đi thành công.");

      setForm({
        ...initialForm,
        fullName: currentUser?.fullName || currentUser?.name || "",
        phone: currentUser?.phone || "",
        email: currentUser?.email || "",
      });
    } catch (error) {
      const message = error.message || "Gửi liên hệ thất bại";
      const mapped = mapBackendErrorToField(message);

      if (mapped) {
        setErrors((prev) => ({
          ...prev,
          [mapped.field]: mapped.message,
        }));
      }

      toast.error(message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="bg-[#fcfcfc] min-h-screen pb-20">
      <section className="relative py-24 bg-slate-950 text-white overflow-hidden">
        <div className="absolute inset-0 z-0">
          <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-rose-600/20 rounded-full blur-[120px] animate-pulse" />
          <div className="absolute bottom-0 left-0 w-[500px] h-[500px] bg-blue-600/10 rounded-full blur-[120px]" />
        </div>

        <div className="container-padded relative z-10 text-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="mb-6 inline-flex items-center gap-2 rounded-full bg-rose-600/20 px-4 py-1.5 text-xs font-black uppercase tracking-[0.2em] text-rose-400 ring-1 ring-rose-500/30"
          >
            <MessageSquare size={14} />
            Kết nối với chúng tôi
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-5xl md:text-7xl font-black italic tracking-tighter mb-6"
          >
            CHÚNG TÔI LUÔN <br />
            <span className="text-rose-600 text-transparent bg-clip-text bg-gradient-to-r from-rose-500 to-orange-400">
              LẮNG NGHE BẠN
            </span>
          </motion.h1>

          <p className="max-w-2xl mx-auto text-slate-400 text-lg">
            Mọi thắc mắc, góp ý của bạn là động lực để ND MALL hoàn thiện hơn mỗi ngày.
            Hãy để lại lời nhắn, chúng tôi sẽ phản hồi trong vòng 24h.
          </p>
        </div>
      </section>

      <div className="container-padded -mt-20 relative z-20">
        <div className="grid lg:grid-cols-3 gap-8">
          <div className="lg:col-span-1 space-y-6">
            {[
              {
                icon: Phone,
                title: "Hotline Miễn Phí",
                content: "1900 6750",
                sub: "Thứ 2 - Chủ nhật (8h - 22h)",
                color: "bg-blue-500",
              },
              {
                icon: Mail,
                title: "Email Hỗ Trợ",
                content: "support@ndmall.vn",
                sub: "Phản hồi trong 24h làm việc",
                color: "bg-rose-500",
              },
              {
                icon: MapPin,
                title: "Trụ Sở Chính",
                content: "Tầng 6, Tòa Ladeco, Hà Nội",
                sub: "266 Đội Cấn, Q. Ba Đình",
                color: "bg-orange-500",
              },
            ].map((item, i) => (
              <motion.div
                key={i}
                {...fadeInUp}
                transition={{ delay: i * 0.1 }}
                className="bg-white p-8 rounded-[2rem] shadow-xl border border-slate-100 group hover:border-rose-200 transition-all"
              >
                <div
                  className={`w-12 h-12 ${item.color} rounded-2xl flex items-center justify-center text-white mb-6 group-hover:scale-110 transition-transform shadow-lg`}
                >
                  <item.icon size={24} />
                </div>
                <h4 className="text-sm font-black text-slate-400 uppercase tracking-widest mb-2">
                  {item.title}
                </h4>
                <p className="text-xl font-black text-slate-900 mb-1">{item.content}</p>
                <p className="text-sm text-slate-500 font-medium">{item.sub}</p>
              </motion.div>
            ))}

            <motion.div
              {...fadeInUp}
              className="bg-slate-900 p-8 rounded-[2rem] text-white overflow-hidden relative"
            >
              <div className="relative z-10">
                <h4 className="text-lg font-black mb-6 italic uppercase">Theo dõi ND MALL</h4>
                <div className="flex gap-4">
                  <a
                    href="#"
                    className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-600 transition-all"
                  >
                    <Facebook size={20} />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-600 transition-all"
                  >
                    <Instagram size={20} />
                  </a>
                  <a
                    href="#"
                    className="w-12 h-12 bg-white/10 rounded-2xl flex items-center justify-center hover:bg-rose-600 transition-all"
                  >
                    <Youtube size={20} />
                  </a>
                </div>
              </div>
              <Globe size={150} className="absolute -right-10 -bottom-10 opacity-10 rotate-12" />
            </motion.div>
          </div>

          <motion.div
            {...fadeInUp}
            className="lg:col-span-2 bg-white p-10 md:p-16 rounded-[3rem] shadow-2xl border border-slate-100"
          >
            <h2 className="text-3xl font-black text-slate-900 mb-8 uppercase italic">
              Gửi tin nhắn <span className="text-rose-600">cho chúng tôi</span>
            </h2>

            <form onSubmit={handleSubmit} className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-500 ml-1">
                  Họ và tên
                </label>
                <input
                  required
                  type="text"
                  value={form.fullName}
                  onChange={(e) => updateField("fullName", e.target.value)}
                  placeholder="Nguyễn Văn A"
                  className={`w-full bg-slate-50 border rounded-2xl px-6 py-4 outline-none transition-all font-medium ${
                    errors.fullName
                      ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      : "border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                  }`}
                />
                {errors.fullName && (
                  <p className="text-sm text-red-500 ml-1">{errors.fullName}</p>
                )}
              </div>

              <div className="space-y-2">
                <label className="text-xs font-black uppercase text-slate-500 ml-1">
                  Số điện thoại
                </label>
                <input
                  required
                  type="tel"
                  value={form.phone}
                  onChange={(e) => updateField("phone", e.target.value)}
                  placeholder="09xx xxx xxx"
                  className={`w-full bg-slate-50 border rounded-2xl px-6 py-4 outline-none transition-all font-medium ${
                    errors.phone
                      ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      : "border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                  }`}
                />
                {errors.phone && (
                  <p className="text-sm text-red-500 ml-1">{errors.phone}</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black uppercase text-slate-500 ml-1">
                  Địa chỉ Email
                </label>
                <input
                  required
                  type="email"
                  value={form.email}
                  onChange={(e) => updateField("email", e.target.value)}
                  placeholder="name@example.com"
                  className={`w-full bg-slate-50 border rounded-2xl px-6 py-4 outline-none transition-all font-medium ${
                    errors.email
                      ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      : "border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                  }`}
                />
                {errors.email && (
                  <p className="text-sm text-red-500 ml-1">{errors.email}</p>
                )}
              </div>

              <div className="md:col-span-2 space-y-2">
                <label className="text-xs font-black uppercase text-slate-500 ml-1">
                  Nội dung tin nhắn
                </label>
                <textarea
                  required
                  rows="5"
                  value={form.message}
                  onChange={(e) => updateField("message", e.target.value)}
                  placeholder="Bạn muốn chia sẻ điều gì với ND MALL?"
                  className={`w-full bg-slate-50 border rounded-2xl px-6 py-4 outline-none transition-all font-medium resize-none ${
                    errors.message
                      ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      : "border-slate-200 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10"
                  }`}
                />
                {errors.message && (
                  <p className="text-sm text-red-500 ml-1">{errors.message}</p>
                )}
              </div>

              <div className="md:col-span-2 pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full md:w-fit bg-rose-600 text-white px-12 py-5 rounded-full font-black uppercase tracking-widest hover:bg-rose-700 transition-all shadow-[0_20px_40px_rgba(225,29,72,0.3)] flex items-center justify-center gap-3 group disabled:opacity-60"
                >
                  {submitting ? "Đang gửi..." : "Gửi yêu cầu ngay"}
                  <Send
                    size={18}
                    className="group-hover:translate-x-1 group-hover:-translate-y-1 transition-transform"
                  />
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      </div>

      <section className="container-padded py-20">
        <motion.div
          {...fadeInUp}
          className="relative h-[500px] rounded-[3.5rem] overflow-hidden shadow-2xl border-8 border-white"
        >
          <iframe
            src="https://www.google.com/maps/embed?pb=!1m18!1m12!1m3!1d3723.863981044334!2d105.810627!3d21.036128!2m3!1f0!2f0!3f0!3m2!1i1024!2i768!4f13.1!3m3!1m2!1s0x3135ab1946ef51ab%3A0x67c006509f6b4d37!2zMjY2IMSQ4buZaSBD4bqlbiwgTGnhu4V1IEdpYWksIEJhIMSQw6xuaCwgSMOgIE7hu5lpLCBWaeG7h3QgTmFt!5e0!3m2!1svi!2s!4v1700000000000!5m2!1svi!2s"
            className="absolute inset-0 w-full h-full grayscale-[0.5] contrast-[1.1]"
            style={{ border: 0 }}
            allowFullScreen=""
            loading="lazy"
            referrerPolicy="no-referrer-when-downgrade"
            title="Bản đồ vị trí ND MALL"
          />
        </motion.div>
      </section>
    </div>
  );
}

export default ContactPage;
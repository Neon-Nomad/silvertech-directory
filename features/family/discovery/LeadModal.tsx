import React, { useState } from 'react';
import { supabase } from '@/src/lib/supabase';
import { Button } from '@/components/ui/Button';
import { X, Loader2, Send, Phone, Calendar, User, Mail, MessageSquare } from 'lucide-react';
import { useAuth } from '@/src/context/AuthProvider';
import { trackEvent } from '@/src/utils/analytics';

interface LeadModalProps {
    isOpen: boolean;
    onClose: () => void;
    facilityId: string;
    facilityName: string;
}

export const LeadModal: React.FC<LeadModalProps> = ({
    isOpen,
    onClose,
    facilityId,
    facilityName,
}) => {
    const { user } = useAuth();
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const [formData, setFormData] = useState({
        name: user?.user_metadata?.full_name || '',
        email: user?.email || '',
        phone: '',
        moveInTimeframe: 'Immediately',
        message: 'I am interested in learning more about pricing and availability.',
    });

    if (!isOpen) return null;

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);
        setError(null);
        trackEvent('lead_submit_attempt', { facilityId });

        try {
            const { error } = await supabase.from('leads').insert({
                facility_id: facilityId,
                user_id: user?.id || null,
                name: formData.name,
                email: formData.email,
                phone: formData.phone,
                move_in_timeframe: formData.moveInTimeframe,
                message: formData.message,
            });

            if (error) throw error;

            setSuccess(true);
            trackEvent('lead_submit_success', { facilityId });
        } catch (err: any) {
            console.error('Error submitting lead:', err);
            setError(err.message || 'Failed to submit inquiry. Please try again.');
            trackEvent('lead_submit_error', { facilityId });
        } finally {
            setLoading(false);
        }
    };

    if (success) {
        return (
            <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
                <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md p-8 text-center transform transition-all scale-100">
                    <div className="w-16 h-16 bg-primary-100 rounded-full flex items-center justify-center mx-auto mb-6">
                        <Send className="w-8 h-8 text-primary-600" />
                    </div>
                    <h3 className="text-2xl font-bold text-slate-900 mb-2">Inquiry Sent!</h3>
                    <p className="text-slate-600 mb-6">
                        Thank you for contacting <span className="font-semibold text-slate-900">{facilityName}</span>.
                        They have received your message and will be in touch shortly.
                    </p>
                    <div className="bg-warm-gray border border-slate-200 rounded-xl p-4 text-sm text-slate-600 mb-6 text-left">
                        <p className="font-semibold text-slate-800 mb-2">Next steps</p>
                        <ul className="space-y-2">
                            <li>We typically confirm availability within 24 hours.</li>
                            <li>Consider calling for the fastest response.</li>
                            <li>Save this facility to compare later.</li>
                        </ul>
                    </div>
                    <div className="space-y-3">
                        {formData.phone && (
                            <Button
                                variant="outline"
                                className="w-full border-slate-300 hover:bg-slate-100"
                                onClick={() => window.location.href = `tel:${formData.phone}`}
                            >
                                Call Facility
                            </Button>
                        )}
                        <Button
                            variant="primary"
                            onClick={() => {
                                setSuccess(false);
                                onClose();
                                setFormData({ ...formData, message: 'I am interested in learning more about pricing and availability.' });
                            }}
                            className="w-full"
                        >
                            Close
                        </Button>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-in fade-in duration-200">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">

                {/* Header */}
                <div className="bg-primary-600 p-6 text-white flex justify-between items-start">
                    <div>
                        <h3 className="text-xl font-bold">Contact Facility</h3>
                        <p className="text-primary-100 text-sm mt-1">
                            Request pricing & availability from {facilityName}
                        </p>
                    </div>
                    <button
                        onClick={onClose}
                        className="text-white/80 hover:text-white hover:bg-white/10 p-2 rounded-full transition-colors"
                    >
                        <X className="h-5 w-5" />
                    </button>
                </div>

                {/* Form */}
                <div className="p-6 overflow-y-auto">
                    <form onSubmit={handleSubmit} className="space-y-5">
                        {error && (
                            <div className="bg-red-50 text-red-600 text-sm p-4 rounded-xl border border-red-100 flex items-start gap-3">
                                <div className="mt-0.5"><X className="w-4 h-4" /></div>
                                {error}
                            </div>
                        )}

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                            <div className="space-y-1.5">
                                <label htmlFor="name" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <User className="w-4 h-4 text-slate-400" /> Name
                                </label>
                                <input
                                    id="name"
                                    type="text"
                                    required
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                    placeholder="Your full name"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                />
                            </div>

                            <div className="space-y-1.5">
                                <label htmlFor="phone" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                    <Phone className="w-4 h-4 text-slate-400" /> Phone
                                </label>
                                <input
                                    id="phone"
                                    type="tel"
                                    required
                                    className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                    placeholder="(555) 123-4567"
                                    value={formData.phone}
                                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                                />
                            </div>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="email" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Mail className="w-4 h-4 text-slate-400" /> Email
                            </label>
                            <input
                                id="email"
                                type="email"
                                required
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all"
                                placeholder="your@email.com"
                                value={formData.email}
                                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                            />
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="timeframe" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <Calendar className="w-4 h-4 text-slate-400" /> Move-in Timeframe
                            </label>
                            <select
                                id="timeframe"
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all bg-white"
                                value={formData.moveInTimeframe}
                                onChange={(e) => setFormData({ ...formData, moveInTimeframe: e.target.value })}
                            >
                                <option>Immediately</option>
                                <option>Within 30 days</option>
                                <option>1-3 months</option>
                                <option>3-6 months</option>
                                <option>Just researching</option>
                            </select>
                        </div>

                        <div className="space-y-1.5">
                            <label htmlFor="message" className="text-sm font-semibold text-slate-700 flex items-center gap-2">
                                <MessageSquare className="w-4 h-4 text-slate-400" /> Message
                            </label>
                            <textarea
                                id="message"
                                rows={3}
                                className="w-full px-4 py-2.5 border border-slate-300 rounded-lg focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all resize-none"
                                value={formData.message}
                                onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                            />
                        </div>

                        <div className="pt-2">
                            <Button
                                type="submit"
                                variant="primary"
                                disabled={loading}
                                className="w-full py-3 text-lg font-semibold shadow-lg hover:shadow-xl hover:-translate-y-0.5 transition-all"
                            >
                                {loading ? (
                                    <>
                                        <Loader2 className="animate-spin -ml-1 mr-2 h-5 w-5" />
                                        Sending Inquiry...
                                    </>
                                ) : (
                                    'Request Information'
                                )}
                            </Button>
                            <p className="text-xs text-center text-slate-500 mt-3">
                                By submitting this form, you agree to our Terms of Service and Privacy Policy.
                                Your information is secure and will only be shared with this facility.
                            </p>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
};

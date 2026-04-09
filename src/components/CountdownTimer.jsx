import React, { useState, useEffect } from 'react';

const CountdownTimer = ({ endDate }) => {
    const [timeLeft, setTimeLeft] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

    useEffect(() => {
        console.log("endDate", endDate)
        const targetDate = endDate;
        console.log("targetDate", targetDate)

        if (!targetDate) {
            setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            return;
        }

        const calculateTimeLeft = () => {
            const now = new Date().getTime();
            const difference = targetDate - now;

            if (difference > 0) {
                setTimeLeft({
                    days: Math.floor(difference / (1000 * 60 * 60 * 24)),
                    hours: Math.floor((difference % (1000 * 60 * 60 * 24)) / (1000 * 60 * 60)),
                    minutes: Math.floor((difference % (1000 * 60 * 60)) / (1000 * 60)),
                    seconds: Math.floor((difference % (1000 * 60)) / 1000)
                });
            } else {
                setTimeLeft({ days: 0, hours: 0, minutes: 0, seconds: 0 });
            }
        };

        // Calculate immediately
        calculateTimeLeft();

        // Update every second for real-time countdown
        const timer = setInterval(calculateTimeLeft, 1000);

        return () => clearInterval(timer);
    }, [endDate]);

    return (
        <div className="bg-[#0a1f1f] border-2 border-[#00ff88]/20 rounded-2xl p-6 flex flex-col items-center justify-center text-center">
            <p className="text-gray-400 text-sm mb-2">Event closes in:</p>
            <p className="text-[#00ff88] text-3xl font-bold tracking-wider">
                {timeLeft.days}d-{timeLeft.hours}h-{timeLeft.minutes}m-{timeLeft.seconds}s
            </p>
        </div>
    );
};

export default CountdownTimer;

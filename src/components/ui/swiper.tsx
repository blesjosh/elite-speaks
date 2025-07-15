import { Swiper, SwiperSlide } from 'swiper/react';
import { Autoplay, EffectCoverflow } from 'swiper/modules';
import 'swiper/css';
import 'swiper/css/pagination';

export const SwiperComponent = () => {
    return (
        <Swiper
            slidesPerView={1}
            pagination={{ clickable: true }}
            loop
            autoplay={{ delay: 5000 }}
            modules={[Autoplay, EffectCoverflow]}
        >
            <SwiperSlide className="px-2">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg h-44 max-w-lg border border-blue-300 p-9 flex items-center justify-center shadow-lg backdrop-blur-sm">
                    <p className="text-center text-xl font-medium text-blue-900 font-['Inter_Tight']">
                        Transforming ideas into powerful digital experiences
                    </p>
                </div>
            </SwiperSlide>
            <SwiperSlide className="px-2">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg h-44 max-w-lg border border-blue-300 p-9 flex items-center justify-center shadow-lg backdrop-blur-sm">
                    <p className="text-center text-xl font-medium text-blue-900 font-['Inter_Tight']">
                        Building the future of web development
                    </p>
                </div>
            </SwiperSlide>
            <SwiperSlide className="px-2">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg h-44 max-w-lg border border-blue-300 p-9 flex items-center justify-center shadow-lg backdrop-blur-sm">
                    <p className="text-center text-xl font-medium text-blue-900 font-['Inter_Tight']">
                        Creating seamless user experiences
                    </p>
                </div>
            </SwiperSlide>
            <SwiperSlide className="px-2">
                <div className="bg-gradient-to-br from-blue-100 to-blue-200 rounded-lg h-44 max-w-lg border border-blue-300 p-9 flex items-center justify-center shadow-lg backdrop-blur-sm">
                    <p className="text-center text-xl font-medium text-blue-900 font-['Inter_Tight']">
                        Empowering businesses through technology
                    </p>
                </div>
            </SwiperSlide>
        </Swiper>
    );
};
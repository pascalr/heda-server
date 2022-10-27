import React, { useState, useEffect, useRef } from 'react'
import { Swiper, SwiperSlide, useSwiper, useSwiperSlide } from 'swiper/react';

import { useWindowWidth } from "./lib"

const SlidePreviousButton = ({idx, nbItems, nbView, swiper}) => {
  if (nbItems <= nbView) {return ''}
  let disabled = idx == 0
  const handleClick = () => disabled ? null : swiper.slidePrev()
  return (
    <button className="plain-btn" aria-disabled={disabled} onClick={handleClick} style={{zIndex: '100', top: '40px', left: '5px'}}>
      <img src="icons/custom-chevron-left.svg" width="45" height="90"/>
    </button>
  );
}

const SlideNextButton = ({idx, nbItems, nbView, swiper}) => {
  if (nbItems <= nbView) {return ''}
  let disabled = idx == nbItems-nbView
  const handleClick = () => disabled ? null : swiper.slideNext()
  return (
    <button className="plain-btn" aria-disabled={disabled} onClick={handleClick} style={{zIndex: '100', top: '40px', right: '5px'}}>
      <img src="icons/custom-chevron-right.svg" width="45" height="90"/>
    </button>
  );
}

export const Carrousel = ({items, children}) => {

  const [idx, setIdx] = useState(0)
  const [swiper, setSwiper] = useState(null)

  const winWidth = useWindowWidth()
  const nbView = Math.min(3, winWidth / 300)
  
  if (!children) {throw "Error carroussel must have one and only one children."}

  return <div className="position-limbo">
    <Swiper
      spaceBetween={20}
      slidesPerView={nbView}
      onSwiper={setSwiper}
      onSlideChange={({activeIndex}) => setIdx(activeIndex)}
    >
      {items.map(item => {
        return <div key={item.id}>
          <SwiperSlide key={item.id}>
            <div className="d-flex flex-column align-items-center text-center ff-satisfy fs-18">
              {children(item)}
            </div>
          </SwiperSlide>
        </div>
      })}
    </Swiper>
    <SlidePreviousButton {...{swiper, idx, nbView, nbItems: items.length}} />
    <SlideNextButton {...{swiper, idx, nbView, nbItems: items.length}} />
  </div>
}

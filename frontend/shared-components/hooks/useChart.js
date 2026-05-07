import { useEffect, useRef } from 'react';
import { init } from "echarts";

export default function useChart(id, getData, condition, ...params) {
  const ref = useRef();

  useEffect(() => {
    if (!ref.current?.setOption && condition) {
      ref.current = init(document.getElementById(id));
    } else if (!condition) {
      ref.current = null;
    }
  }, [condition]);

  useEffect(() => {
    if (condition) {
      ref.current?.setOption && ref.current.setOption(getData(...params));
    }
  }, [condition, ...params]);

  const windowResized = () => {
    ref.current?.resize();
  };

  useEffect(() => {
    window.addEventListener('resize', windowResized);
    return () => {
      window.removeEventListener('resize', windowResized);
    };
  }, []);
}
